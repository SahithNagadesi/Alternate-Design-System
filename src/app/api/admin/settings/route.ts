import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// GET /api/admin/settings — get settings (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [apiKeySetting, githubPatSetting, baseUrlSetting, modelSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } }),
      prisma.setting.findUnique({ where: { key: "GITHUB_PAT" } }),
      prisma.setting.findUnique({ where: { key: "ANTHROPIC_BASE_URL" } }),
      prisma.setting.findUnique({ where: { key: "ANTHROPIC_MODEL" } }),
    ]);

    // Mask the API key for display
    let maskedKey = "";
    let apiKeySource: "database" | "environment" = "environment";

    if (apiKeySetting) {
      try {
        const realKey = decrypt(apiKeySetting.value);
        maskedKey = maskApiKey(realKey);
        apiKeySource = "database";
      } catch {
        maskedKey = "(decryption error)";
        apiKeySource = "database";
      }
    } else if (process.env.ANTHROPIC_API_KEY) {
      maskedKey = maskApiKey(process.env.ANTHROPIC_API_KEY);
      apiKeySource = "environment";
    }

    // Mask the GitHub PAT for display
    let maskedPat = "";
    let patSource: "database" | "environment" = "environment";

    if (githubPatSetting) {
      try {
        const realPat = decrypt(githubPatSetting.value);
        maskedPat = maskToken(realPat);
        patSource = "database";
      } catch {
        maskedPat = "(decryption error)";
        patSource = "database";
      }
    } else if (process.env.GITHUB_PAT) {
      maskedPat = maskToken(process.env.GITHUB_PAT);
      patSource = "environment";
    }

    // Base URL (not encrypted — it's not a secret)
    const baseUrl = baseUrlSetting?.value?.trim() || process.env.ANTHROPIC_BASE_URL?.trim() || "";
    const baseUrlSource: "database" | "environment" = baseUrlSetting ? "database" : "environment";

    // Model (not encrypted — it's not a secret)
    const modelValue = modelSetting?.value?.trim() || process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
    const modelSource: "database" | "environment" = modelSetting ? "database" : "environment";

    return NextResponse.json({
      anthropicApiKey: {
        masked: maskedKey,
        source: apiKeySource,
        updatedAt: apiKeySetting?.updatedAt ?? null,
      },
      anthropicBaseUrl: {
        value: baseUrl,
        source: baseUrlSource,
        updatedAt: baseUrlSetting?.updatedAt ?? null,
      },
      anthropicModel: {
        value: modelValue,
        source: modelSource,
        updatedAt: modelSetting?.updatedAt ?? null,
      },
      githubPat: {
        masked: maskedPat,
        source: patSource,
        updatedAt: githubPatSetting?.updatedAt ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to fetch settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings — update settings (admin only)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { anthropicApiKey, anthropicBaseUrl, anthropicModel, githubPat } = body;

    const result: Record<string, unknown> = {};

    // Update Anthropic API Key if provided
    if (anthropicApiKey !== undefined) {
      if (!anthropicApiKey?.trim()) {
        return NextResponse.json({ error: "API key is required" }, { status: 400 });
      }

      const trimmedKey = anthropicApiKey.trim();

      // Relaxed validation: accept any non-empty key (enterprise proxies use various formats)
      if (trimmedKey.length < 10) {
        return NextResponse.json(
          { error: "API key seems too short. Please check the key." },
          { status: 400 }
        );
      }

      const encrypted = encrypt(trimmedKey);

      await prisma.setting.upsert({
        where: { key: "ANTHROPIC_API_KEY" },
        update: { value: encrypted },
        create: { key: "ANTHROPIC_API_KEY", value: encrypted },
      });

      result.anthropicApiKey = {
        masked: maskApiKey(trimmedKey),
        source: "database" as const,
        updatedAt: new Date().toISOString(),
      };
    }

    // Update Anthropic Base URL if provided
    if (anthropicBaseUrl !== undefined) {
      const trimmedUrl = (anthropicBaseUrl || "").trim();

      if (trimmedUrl) {
        // Validate it looks like a URL
        try {
          new URL(trimmedUrl);
        } catch {
          return NextResponse.json(
            { error: "Invalid base URL format. Must be a valid URL (e.g., https://example.com/proxy)" },
            { status: 400 }
          );
        }

        await prisma.setting.upsert({
          where: { key: "ANTHROPIC_BASE_URL" },
          update: { value: trimmedUrl },
          create: { key: "ANTHROPIC_BASE_URL", value: trimmedUrl },
        });

        result.anthropicBaseUrl = {
          value: trimmedUrl,
          source: "database" as const,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Empty string means clear the setting
        await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_BASE_URL" } });
        result.anthropicBaseUrl = {
          value: process.env.ANTHROPIC_BASE_URL?.trim() || "",
          source: "environment" as const,
          updatedAt: null,
        };
      }
    }

    // Update Anthropic Model if provided
    if (anthropicModel !== undefined) {
      const trimmedModel = (anthropicModel || "").trim();

      if (trimmedModel) {
        await prisma.setting.upsert({
          where: { key: "ANTHROPIC_MODEL" },
          update: { value: trimmedModel },
          create: { key: "ANTHROPIC_MODEL", value: trimmedModel },
        });

        result.anthropicModel = {
          value: trimmedModel,
          source: "database" as const,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Empty string means clear the setting, revert to default
        await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_MODEL" } });
        result.anthropicModel = {
          value: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
          source: "environment" as const,
          updatedAt: null,
        };
      }
    }

    // Update GitHub PAT if provided
    if (githubPat !== undefined) {
      if (!githubPat?.trim()) {
        return NextResponse.json({ error: "GitHub PAT is required" }, { status: 400 });
      }

      const trimmedPat = githubPat.trim();

      if (!trimmedPat.startsWith("ghp_") && !trimmedPat.startsWith("github_pat_")) {
        return NextResponse.json(
          { error: "Invalid GitHub PAT format. Tokens start with 'ghp_' or 'github_pat_'" },
          { status: 400 }
        );
      }

      const encrypted = encrypt(trimmedPat);

      await prisma.setting.upsert({
        where: { key: "GITHUB_PAT" },
        update: { value: encrypted },
        create: { key: "GITHUB_PAT", value: encrypted },
      });

      result.githubPat = {
        masked: maskToken(trimmedPat),
        source: "database" as const,
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to update settings:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to update settings: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings — remove DB key(s), revert to env var
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const setting = searchParams.get("setting") || "anthropicApiKey";

    if (setting === "githubPat") {
      await prisma.setting.deleteMany({ where: { key: "GITHUB_PAT" } });

      const envPat = process.env.GITHUB_PAT;
      return NextResponse.json({
        githubPat: {
          masked: envPat ? maskToken(envPat) : "",
          source: "environment" as const,
          updatedAt: null,
        },
      });
    }

    if (setting === "anthropicBaseUrl") {
      await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_BASE_URL" } });
      return NextResponse.json({
        anthropicBaseUrl: {
          value: process.env.ANTHROPIC_BASE_URL?.trim() || "",
          source: "environment" as const,
          updatedAt: null,
        },
      });
    }

    if (setting === "anthropicModel") {
      await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_MODEL" } });
      return NextResponse.json({
        anthropicModel: {
          value: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
          source: "environment" as const,
          updatedAt: null,
        },
      });
    }

    // Default: delete Anthropic API key
    await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_API_KEY" } });

    const envKey = process.env.ANTHROPIC_API_KEY;
    return NextResponse.json({
      anthropicApiKey: {
        masked: envKey ? maskApiKey(envKey) : "",
        source: "environment" as const,
        updatedAt: null,
      },
    });
  } catch (err) {
    console.error("Failed to delete setting:", err);
    return NextResponse.json(
      { error: "Failed to revert setting" },
      { status: 500 }
    );
  }
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "sk-****";
  return key.slice(0, 7) + "..." + key.slice(-4);
}

function maskToken(token: string): string {
  if (token.length <= 8) return token.slice(0, 4) + "****";
  return token.slice(0, 8) + "..." + token.slice(-4);
}
