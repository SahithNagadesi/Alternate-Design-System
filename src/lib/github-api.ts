const GITHUB_API = "https://api.github.com";

async function githubFetch(
  pat: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      `GitHub API ${res.status}: ${body.message || res.statusText}`
    );
  }

  return res.json();
}

export async function getDefaultBranch(
  pat: string,
  repo: string
): Promise<string> {
  const data = await githubFetch(pat, `/repos/${repo}`);
  return data.default_branch || "main";
}

export async function readFile(
  pat: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; sha: string }> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const data = await githubFetch(
    pat,
    `/repos/${repo}/contents/${path}${ref}`
  );

  if (Array.isArray(data)) {
    throw new Error(
      `'${path}' is a directory, not a file. Use list_files instead.`
    );
  }

  const content = Buffer.from(data.content || "", "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function writeFile(
  pat: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string,
  branch?: string
): Promise<{ action: "created" | "updated"; sha: string }> {
  let sha: string | undefined;
  try {
    const existing = await readFile(pat, repo, path, branch);
    sha = existing.sha;
  } catch {
    // File doesn't exist — will be created
  }

  const body: Record<string, string> = {
    message: commitMessage,
    content: Buffer.from(content, "utf-8").toString("base64"),
  };
  if (sha) body.sha = sha;
  if (branch) body.branch = branch;

  const data = await githubFetch(pat, `/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return { action: sha ? "updated" : "created", sha: data.content.sha };
}

export async function listFiles(
  pat: string,
  repo: string,
  path: string,
  branch?: string
): Promise<
  Array<{ name: string; path: string; type: "file" | "dir"; size: number }>
> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  try {
    const data = await githubFetch(
      pat,
      `/repos/${repo}/contents/${path}${ref}`
    );

    if (!Array.isArray(data)) {
      return [
        { name: data.name, path: data.path, type: "file", size: data.size },
      ];
    }

    return data.map((item: { name: string; path: string; type: string; size?: number }) => ({
      name: item.name,
      path: item.path,
      type: (item.type === "dir" ? "dir" : "file") as "file" | "dir",
      size: item.size || 0,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}
