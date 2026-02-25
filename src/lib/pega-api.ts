import JSZip from "jszip";

interface ComponentFile {
  path: string;
  content: string;
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
 * Auth: Basic (username:password)
 */
export async function publishToPega(
  serverUrl: string,
  credentials: { username: string; password: string },
  zipBuffer: Buffer,
  componentName: string
): Promise<{ success: boolean; message: string }> {
  // Normalize server URL — strip trailing slash
  const baseUrl = serverUrl.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/prweb/api/v1/components`;

  const basicAuth = Buffer.from(
    `${credentials.username}:${credentials.password}`
  ).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
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
