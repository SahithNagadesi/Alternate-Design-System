import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGithubPat } from "@/lib/get-github-pat";

// GET /api/github/folders?repo=owner/name&path=optional/subfolder
// Lists directories in a given repo at a given path
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  const path = searchParams.get("path") || "";

  if (!repo) {
    return NextResponse.json({ error: "repo parameter is required" }, { status: 400 });
  }

  let pat: string | null;
  try {
    pat = await getGithubPat();
  } catch (err) {
    console.error("Failed to read GitHub PAT:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to read GitHub PAT: ${message}` },
      { status: 500 }
    );
  }
  if (!pat) {
    return NextResponse.json(
      { error: "GitHub PAT is not configured. Please ask an admin to set it in Settings." },
      { status: 503 }
    );
  }

  try {
    // Encode each path segment individually so slashes are preserved
    const encodedPath = path
      ? path.split("/").map(encodeURIComponent).join("/")
      : "";
    const apiUrl = encodedPath
      ? `https://api.github.com/repos/${repo}/contents/${encodedPath}`
      : `https://api.github.com/repos/${repo}/contents`;

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (res.status === 404) {
      // Repo or path not found — return empty list (folder may not exist yet)
      return NextResponse.json([]);
    }

    if (!res.ok) {
      const errBody = await res.text();
      console.error("GitHub API error:", res.status, errBody);

      let errorMsg = `GitHub API error: ${res.status}`;
      if (res.status === 401) {
        errorMsg = "GitHub PAT is invalid or expired. Please update it in Admin Settings.";
      } else if (res.status === 403) {
        errorMsg = "GitHub PAT lacks required permissions. Ensure it has 'repo' scope.";
      }

      return NextResponse.json(
        { error: errorMsg },
        { status: res.status }
      );
    }

    const contents = await res.json();

    // If contents is not an array, the path points to a file
    if (!Array.isArray(contents)) {
      return NextResponse.json([]);
    }

    // Return only directories
    const folders = contents
      .filter((item: { type: string }) => item.type === "dir")
      .map((item: { name: string; path: string }) => ({
        name: item.name,
        path: item.path,
      }));

    return NextResponse.json(folders);
  } catch (err) {
    console.error("Failed to fetch GitHub folders:", err);
    return NextResponse.json(
      { error: "Failed to fetch folders from GitHub" },
      { status: 500 }
    );
  }
}
