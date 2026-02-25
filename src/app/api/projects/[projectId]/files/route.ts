import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGithubPat } from "@/lib/get-github-pat";
import { readFile, listFiles, getDefaultBranch } from "@/lib/github-api";

const MAX_DEPTH = 3;
const MAX_FILES = 20;
const PREVIEWABLE_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".json",
]);

interface ProjectFile {
  path: string;
  content: string;
}

function hasPreviewableExtension(name: string): boolean {
  const ext = name.slice(name.lastIndexOf("."));
  return PREVIEWABLE_EXTENSIONS.has(ext.toLowerCase());
}

async function collectFiles(
  pat: string,
  repo: string,
  basePath: string,
  branch: string,
  depth: number,
  collected: ProjectFile[]
): Promise<void> {
  if (depth > MAX_DEPTH || collected.length >= MAX_FILES) return;

  const items = await listFiles(pat, repo, basePath, branch);

  for (const item of items) {
    if (collected.length >= MAX_FILES) break;

    if (item.type === "dir") {
      await collectFiles(pat, repo, item.path, branch, depth + 1, collected);
    } else if (item.type === "file" && hasPreviewableExtension(item.name)) {
      try {
        const { content } = await readFile(pat, repo, item.path, branch);
        // Use path relative to basePath's parent (the project folder)
        const relativePath = item.path.includes("/")
          ? item.path.slice(item.path.indexOf("/", basePath.indexOf("/")) + 1)
          : item.name;
        collected.push({ path: relativePath, content });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/files — list previewable project files
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { folderPath: true, githubRepo: true },
  });
  if (!project?.githubRepo) {
    return NextResponse.json(
      { error: "Project has no GitHub repository configured" },
      { status: 400 }
    );
  }

  let pat: string | null;
  try {
    pat = await getGithubPat();
  } catch {
    return NextResponse.json(
      { error: "GitHub PAT not configured" },
      { status: 500 }
    );
  }
  if (!pat) {
    return NextResponse.json(
      { error: "GitHub PAT not configured" },
      { status: 500 }
    );
  }

  try {
    const branch = await getDefaultBranch(pat, project.githubRepo);
    const files: ProjectFile[] = [];
    await collectFiles(
      pat,
      project.githubRepo,
      project.folderPath,
      branch,
      0,
      files
    );

    return NextResponse.json(files);
  } catch (err) {
    console.error("Files API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch project files" },
      { status: 500 }
    );
  }
}
