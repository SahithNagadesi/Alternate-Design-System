import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGithubPat } from "@/lib/get-github-pat";
import { writeFile, getDefaultBranch } from "@/lib/github-api";
import {
  generateADSScaffold,
  type ScaffoldMetadata,
} from "@/lib/ads-scaffold";
import { generateDXCBScaffold } from "@/lib/dxcb-scaffold";
import type { ComponentMetadata } from "@/types/project-metadata";

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
      type: true,
      name: true,
      folderPath: true,
      githubRepo: true,
      pegaServerUrl: true,
      metadata: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.githubRepo) {
    return NextResponse.json(
      { error: "No GitHub repository configured for this project" },
      { status: 400 }
    );
  }

  let githubPat: string | null;
  try {
    githubPat = await getGithubPat();
  } catch {
    githubPat = null;
  }
  if (!githubPat) {
    return NextResponse.json(
      { error: "GitHub PAT is not configured. Please set it in Admin Settings." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const overwrite = body.overwrite === true;

  // Generate scaffold files based on project type
  let files: Array<{ path: string; content: string }>;

  if (project.type === "COMPONENT") {
    // DXCB Component scaffolding
    const metadata = project.metadata as unknown as ComponentMetadata;
    if (!metadata?.organizationName || !metadata?.libraryName || !metadata?.componentName) {
      return NextResponse.json(
        {
          error:
            "Component metadata incomplete. Please configure Organization, Library, and Component names in project settings.",
        },
        { status: 400 }
      );
    }
    files = generateDXCBScaffold(metadata);
  } else {
    // APPLICATION scaffolding (ADS)
    const meta = (project.metadata as Record<string, unknown>) || {};
    const scaffoldMeta: ScaffoldMetadata = {
      appName: project.name,
      pegaAppName: (meta.pegaAppName as string) || undefined,
      caseTypes: (meta.caseTypes as string) || undefined,
      dxApiVersion: (meta.dxApiVersion as string) || undefined,
      authMethod: (meta.dxApiAuthMethod as string) || undefined,
      framework: (meta.frontendFramework as string) || undefined,
    };
    files = generateADSScaffold(scaffoldMeta, project.pegaServerUrl || undefined);
  }

  const branch = await getDefaultBranch(githubPat, project.githubRepo);
  const projectFolder = project.folderPath || "";

  let created = 0;
  let skipped = 0;
  const createdFiles: string[] = [];

  for (const file of files) {
    const fullPath = projectFolder
      ? `${projectFolder}/${file.path}`.replace(/\/\//g, "/")
      : file.path;

    if (!overwrite) {
      // Check if file already exists
      try {
        const { readFile } = await import("@/lib/github-api");
        await readFile(githubPat, project.githubRepo, fullPath, branch);
        skipped++;
        continue;
      } catch {
        // File doesn't exist — proceed to create
      }
    }

    const commitMsg = `Scaffold: ${file.path} via Frontier XD`;
    await writeFile(githubPat, project.githubRepo, fullPath, file.content, commitMsg, branch);
    created++;
    createdFiles.push(file.path);
  }

  // Build StackBlitz URL
  const stackblitzUrl = `https://stackblitz.com/github/${project.githubRepo}/tree/${branch}/${projectFolder}`;

  return NextResponse.json({
    created,
    skipped,
    total: files.length,
    files: createdFiles,
    stackblitzUrl,
  });
}
