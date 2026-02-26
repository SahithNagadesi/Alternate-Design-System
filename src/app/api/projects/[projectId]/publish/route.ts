import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { getGithubPat } from "@/lib/get-github-pat";
import { readFile, listFiles, getDefaultBranch } from "@/lib/github-api";
import { packageComponentZip, publishToPega, obtainOAuthToken } from "@/lib/pega-api";
import type { PegaCredentials, ComponentMetadata } from "@/types/project-metadata";

const MAX_DEPTH = 3;
const MAX_FILES = 50;

interface CollectedFile {
  path: string;
  content: string;
}

async function collectAllFiles(
  pat: string,
  repo: string,
  basePath: string,
  branch: string,
  depth: number,
  collected: CollectedFile[]
): Promise<void> {
  if (depth > MAX_DEPTH || collected.length >= MAX_FILES) return;

  const items = await listFiles(pat, repo, basePath, branch);

  for (const item of items) {
    if (collected.length >= MAX_FILES) break;

    if (item.type === "dir") {
      await collectAllFiles(pat, repo, item.path, branch, depth + 1, collected);
    } else if (item.type === "file") {
      try {
        const { content } = await readFile(pat, repo, item.path, branch);
        // Path relative to project folder
        const relPath = item.path.startsWith(basePath + "/")
          ? item.path.slice(basePath.length + 1)
          : item.name;
        collected.push({ path: relPath, content });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/publish — publish component to Pega
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      type: true,
      folderPath: true,
      githubRepo: true,
      pegaServerUrl: true,
      pegaCredentials: true,
      metadata: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.type !== "COMPONENT") {
    return NextResponse.json(
      { error: "Only COMPONENT projects can be published" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    pegaServerUrl: overrideUrl,
    pegaUsername,
    pegaPassword,
    pegaClientId,
    pegaClientSecret,
    selectedFiles,
  } = body;

  // Resolve server URL
  const serverUrl = overrideUrl || project.pegaServerUrl;
  if (!serverUrl) {
    return NextResponse.json(
      { error: "Pega server URL is required. Provide one or set it in project settings." },
      { status: 400 }
    );
  }

  // Determine auth method from metadata
  const metadata = project.metadata as ComponentMetadata | null;
  const useOAuth = metadata?.oauthGrantType === "clientCreds";

  // Resolve stored credentials
  let storedCreds: PegaCredentials = {};
  if (project.pegaCredentials) {
    try {
      const decrypted = decrypt(project.pegaCredentials);
      storedCreds = JSON.parse(decrypted) as PegaCredentials;
    } catch {
      return NextResponse.json(
        { error: "Failed to decrypt stored Pega credentials" },
        { status: 500 }
      );
    }
  }

  // Resolve credentials based on auth method
  if (useOAuth) {
    // OAuth Client Credentials flow
    const clientId = pegaClientId || storedCreds.clientId;
    const clientSecret = pegaClientSecret || storedCreds.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "OAuth Client ID and Client Secret are required. Provide them or set in project settings." },
        { status: 400 }
      );
    }

    // Store for later use
    storedCreds.clientId = clientId;
    storedCreds.clientSecret = clientSecret;
  } else {
    // Basic Auth
    const username = pegaUsername || storedCreds.username;
    const password = pegaPassword || storedCreds.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Pega credentials are required. Provide them or set in project settings." },
        { status: 400 }
      );
    }

    // Store for later use
    storedCreds.username = username;
    storedCreds.password = password;
  }

  // Create publish record
  const publishRecord = await prisma.publishHistory.create({
    data: {
      projectId,
      userId: session.user.id,
      pegaServerUrl: serverUrl,
      status: "IN_PROGRESS",
      componentFiles: [],
    },
  });

  try {
    // Get files from GitHub
    let files: CollectedFile[];

    if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
      // Use specific files selected by user
      files = selectedFiles;
    } else {
      // Fetch all files from the project folder
      if (!project.githubRepo) {
        throw new Error("No GitHub repository configured for this project");
      }

      const pat = await getGithubPat();
      if (!pat) throw new Error("GitHub PAT not configured");

      const branch = await getDefaultBranch(pat, project.githubRepo);
      files = [];
      await collectAllFiles(
        pat,
        project.githubRepo,
        project.folderPath,
        branch,
        0,
        files
      );

      if (files.length === 0) {
        throw new Error("No files found in project folder");
      }
    }

    // Package ZIP
    const zipBuffer = await packageComponentZip(files, project.name);

    // Publish to Pega with appropriate auth method
    let result;
    if (useOAuth) {
      // Obtain OAuth token
      try {
        const token = await obtainOAuthToken(
          serverUrl,
          storedCreds.clientId!,
          storedCreds.clientSecret!
        );
        result = await publishToPega(
          serverUrl,
          { method: "bearer", token },
          zipBuffer,
          project.name
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`OAuth authentication failed: ${errorMessage}`);
      }
    } else {
      // Use Basic Auth
      result = await publishToPega(
        serverUrl,
        { method: "basic", username: storedCreds.username!, password: storedCreds.password! },
        zipBuffer,
        project.name
      );
    }

    // Update record
    await prisma.publishHistory.update({
      where: { id: publishRecord.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        componentFiles: files.map((f) => f.path),
        errorMessage: result.success ? null : result.message,
        completedAt: new Date(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, publishId: publishRecord.id },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: result.message,
      publishId: publishRecord.id,
      filesPublished: files.length,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.publishHistory.update({
      where: { id: publishRecord.id },
      data: {
        status: "FAILED",
        errorMessage,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: errorMessage, publishId: publishRecord.id },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/publish — publish history
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await prisma.publishHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(history);
}
