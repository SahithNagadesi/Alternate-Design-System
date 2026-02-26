import JSZip from "jszip";

interface ComponentFile {
  path: string;
  content: string;
}

type AuthMethod =
  | { method: "basic"; username: string; password: string }
  | { method: "bearer"; token: string };

/**
 * Obtains an OAuth 2.0 access token using Client Credentials flow.
 *
 * @param serverUrl - Pega server base URL
 * @param clientId - OAuth client ID
 * @param clientSecret - OAuth client secret
 * @returns Access token string
 */
export async function obtainOAuthToken(
  serverUrl: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const baseUrl = serverUrl.replace(/\/+$/, "");
  const tokenEndpoint = `${baseUrl}/prweb/PRRestService/oauth2/v1/token`;

  // Client Credentials flow uses Basic Auth with clientId:clientSecret
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const body = await response.json();
      errorDetail = body.error_description || body.error || response.statusText;
    } catch {
      try {
        errorDetail = await response.text();
      } catch {
        // Keep statusText
      }
    }
    throw new Error(`OAuth token acquisition failed (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("OAuth response missing access_token");
  }

  return data.access_token;
}

/**
 * Packages component files into a ZIP buffer with an auto-generated
 * component.json manifest if one is not already present.
 */
export async function packageComponentZip(
  files: ComponentFile[],
  componentName: string
): Promise<Buffer> {
  const zip = new JSZip();

  let hasManifest = false;

  for (const file of files) {
    zip.file(file.path, file.content);
    if (
      file.path === "component.json" ||
      file.path.endsWith("/component.json")
    ) {
      hasManifest = true;
    }
  }

  // Auto-generate a minimal Pega component manifest if missing
  if (!hasManifest) {
    const manifest = {
      name: componentName,
      label: componentName,
      description: `Custom component: ${componentName}`,
      type: "Component",
      subtype: "FIELD",
      version: "1.0.0",
      pyCaseTypeResolution: "",
      properties: [],
      stateProps: [],
      events: [],
    };
    zip.file("component.json", JSON.stringify(manifest, null, 2));
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return zipBuffer;
}

/**
 * Publishes a component ZIP to a Pega server using the DX Components API.
 *
 * Endpoint: POST {serverUrl}/prweb/api/v1/components
 * Auth: Basic (username:password) or Bearer (OAuth token)
 */
export async function publishToPega(
  serverUrl: string,
  auth: AuthMethod,
  zipBuffer: Buffer,
  componentName: string
): Promise<{ success: boolean; message: string }> {
  // Normalize server URL — strip trailing slash
  const baseUrl = serverUrl.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/prweb/api/v1/components`;

  let authHeader: string;
  if (auth.method === "basic") {
    const basicAuth = Buffer.from(
      `${auth.username}:${auth.password}`
    ).toString("base64");
    authHeader = `Basic ${basicAuth}`;
  } else {
    authHeader = `Bearer ${auth.token}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${componentName}.zip"`,
    },
    body: new Uint8Array(zipBuffer),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const body = await response.json();
      errorDetail =
        body.errorDetails?.[0]?.message ||
        body.message ||
        body.error ||
        response.statusText;
    } catch {
      // Response might not be JSON
      try {
        errorDetail = await response.text();
      } catch {
        // Keep statusText
      }
    }
    return {
      success: false,
      message: `Pega server returned ${response.status}: ${errorDetail}`,
    };
  }

  return {
    success: true,
    message: `Component "${componentName}" published successfully`,
  };
}
