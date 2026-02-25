import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropicApiKey, getAnthropicBaseUrl, getAnthropicModel } from "@/lib/get-api-key";
import { getGithubPat } from "@/lib/get-github-pat";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/admin/settings/test — test configured keys (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { testType } = body; // "anthropic" | "github"

  if (testType === "anthropic") {
    return testAnthropic();
  } else if (testType === "github") {
    return testGithub();
  }

  return NextResponse.json({ error: "Invalid testType" }, { status: 400 });
}

async function testAnthropic() {
  // Step 1: Retrieve the key and config
  let apiKey: string | null;
  let baseURL: string | undefined;
  let model: string;
  try {
    [apiKey, baseURL, model] = await Promise.all([
      getAnthropicApiKey(),
      getAnthropicBaseUrl(),
      getAnthropicModel(),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      step: "decrypt",
      error: `Failed to decrypt API key from database: ${msg}`,
    });
  }

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      step: "retrieve",
      error: "No API key configured (neither in database nor environment variable).",
    });
  }

  // Step 2: Log key diagnostics (safe — no secret data)
  const keyInfo = {
    length: apiKey.length,
    prefix: apiKey.slice(0, 10),
    suffix: apiKey.slice(-4),
    hasWhitespace: /\s/.test(apiKey),
    hasNonAscii: /[^\x20-\x7E]/.test(apiKey),
    baseURL: baseURL || "(default: api.anthropic.com)",
    model,
  };

  // Step 3: Make a minimal API call
  try {
    const anthropic = new Anthropic({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: "user", content: "Say hi" }],
    });

    return NextResponse.json({
      success: true,
      step: "api_call",
      keyInfo,
      response: {
        id: response.id,
        model: response.model,
        stopReason: response.stop_reason,
      },
    });
  } catch (err: unknown) {
    let errorDetail = "Unknown error";
    let errorType = "unknown";

    if (err instanceof Anthropic.AuthenticationError) {
      errorType = "authentication";
      errorDetail = `Authentication failed (401). The API key is being rejected. Key prefix: "${keyInfo.prefix}", length: ${keyInfo.length}, baseURL: ${keyInfo.baseURL}`;
    } else if (err instanceof Anthropic.PermissionDeniedError) {
      errorType = "permission";
      errorDetail = "Permission denied (403). The API key may not have access to the requested model.";
    } else if (err instanceof Anthropic.RateLimitError) {
      errorType = "rate_limit";
      errorDetail = "Rate limited (429). The key is valid but you've hit the rate limit.";
    } else if (err instanceof Anthropic.APIError) {
      errorType = `api_error_${err.status}`;
      errorDetail = `API error ${err.status}: ${err.message}`;
    } else if (err instanceof Error) {
      errorType = "network";
      errorDetail = err.message;
    }

    return NextResponse.json({
      success: false,
      step: "api_call",
      keyInfo,
      errorType,
      error: errorDetail,
    });
  }
}

async function testGithub() {
  // Step 1: Retrieve the PAT
  let pat: string | null;
  try {
    pat = await getGithubPat();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      step: "decrypt",
      error: `Failed to decrypt GitHub PAT from database: ${msg}`,
    });
  }

  if (!pat) {
    return NextResponse.json({
      success: false,
      step: "retrieve",
      error: "No GitHub PAT configured (neither in database nor environment variable).",
    });
  }

  // Step 2: Log PAT diagnostics (safe — no secret data)
  const patInfo = {
    length: pat.length,
    prefix: pat.slice(0, 12),
    suffix: pat.slice(-4),
    hasWhitespace: /\s/.test(pat),
    hasNonAscii: /[^\x20-\x7E]/.test(pat),
  };

  // Step 3: Make a minimal GitHub API call (get authenticated user)
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errorDetail = `GitHub API returned ${res.status}`;
      if (res.status === 401) {
        errorDetail = `Authentication failed (401). The PAT is being rejected by GitHub. PAT prefix: "${patInfo.prefix}", length: ${patInfo.length}. Response: ${errBody.slice(0, 200)}`;
      } else if (res.status === 403) {
        errorDetail = `Forbidden (403). PAT may lack scopes. Response: ${errBody.slice(0, 200)}`;
      }

      return NextResponse.json({
        success: false,
        step: "api_call",
        patInfo,
        error: errorDetail,
      });
    }

    const user = await res.json();
    return NextResponse.json({
      success: true,
      step: "api_call",
      patInfo,
      github: {
        login: user.login,
        name: user.name,
        scopes: res.headers.get("x-oauth-scopes"),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      step: "api_call",
      patInfo,
      error: `Network error: ${msg}`,
    });
  }
}
