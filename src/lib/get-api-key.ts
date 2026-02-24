import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * Returns the active Anthropic API key.
 * Checks the database first (admin-configured), falls back to env var.
 */
export async function getAnthropicApiKey(): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "ANTHROPIC_API_KEY" },
    });

    if (setting) {
      return decrypt(setting.value);
    }
  } catch (e) {
    console.error("Failed to read API key from database:", e);
  }

  return process.env.ANTHROPIC_API_KEY ?? null;
}
