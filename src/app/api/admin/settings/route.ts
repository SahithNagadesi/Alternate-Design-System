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

  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_API_KEY" },
  });

  // Mask the key for display
  let maskedKey = "";
  let source: "database" | "environment" = "environment";

  if (apiKeySetting) {
    try {
      const realKey = decrypt(apiKeySetting.value);
      maskedKey = maskApiKey(realKey);
      source = "database";
    } catch {
      maskedKey = "(decryption error)";
      source = "database";
    }
  } else if (process.env.ANTHROPIC_API_KEY) {
    maskedKey = maskApiKey(process.env.ANTHROPIC_API_KEY);
    source = "environment";
  }

  return NextResponse.json({
    anthropicApiKey: {
      masked: maskedKey,
      source,
      updatedAt: apiKeySetting?.updatedAt ?? null,
    },
  });
}

// PUT /api/admin/settings — update settings (admin only)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { anthropicApiKey } = body;

  if (!anthropicApiKey?.trim()) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const trimmedKey = anthropicApiKey.trim();

  // Basic validation
  if (!trimmedKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid API key format. Anthropic keys start with 'sk-'" },
      { status: 400 }
    );
  }

  const encrypted = encrypt(trimmedKey);

  await prisma.setting.upsert({
    where: { key: "ANTHROPIC_API_KEY" },
    update: { value: encrypted },
    create: { key: "ANTHROPIC_API_KEY", value: encrypted },
  });

  return NextResponse.json({
    anthropicApiKey: {
      masked: maskApiKey(trimmedKey),
      source: "database" as const,
      updatedAt: new Date().toISOString(),
    },
  });
}

// DELETE /api/admin/settings/api-key — remove DB key, revert to env var
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.setting.deleteMany({ where: { key: "ANTHROPIC_API_KEY" } });

  const envKey = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    anthropicApiKey: {
      masked: envKey ? maskApiKey(envKey) : "",
      source: "environment" as const,
      updatedAt: null,
    },
  });
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "sk-****";
  return key.slice(0, 7) + "..." + key.slice(-4);
}
