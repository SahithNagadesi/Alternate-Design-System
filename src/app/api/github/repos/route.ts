import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGithubPat } from "@/lib/get-github-pat";

// GET /api/github/repos — list repos accessible via the stored PAT
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // Fetch repos the token has access to (up to 100)
    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member", {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

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

    const repos = await res.json();
    const simplified = repos.map((r: { full_name: string; name: string; private: boolean; default_branch: string; html_url: string; owner: { login: string } }) => ({
      fullName: r.full_name,
      name: r.name,
      owner: r.owner.login,
      private: r.private,
      defaultBranch: r.default_branch,
      url: r.html_url,
    }));

    return NextResponse.json(simplified);
  } catch (err) {
    console.error("Failed to fetch GitHub repos:", err);
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub" },
      { status: 500 }
    );
  }
}
