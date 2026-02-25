import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * Returns the active Anthropic API key.
 * Checks the database first (admin-configured), falls back to env var.
 *
 * If a key exists in the DB but decryption fails, the error is thrown
 * rather than silently falling back to a potentially invalid env var.
 */
export async function getAnthropicApiKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_API_KEY" },
  });

  if (setting) {
    // Admin saved a key via Settings — always use it.
    // Let decryption errors propagate so callers see the real problem.
    return decrypt(setting.value);
  }

  // No DB entry — fall back to environment variable
  return process.env.ANTHROPIC_API_KEY?.trim() ?? null;
}

/**
 * Returns the custom Anthropic base URL (for enterprise proxies / model vending machines).
 * Checks the database first, falls back to env var, returns undefined if not set
 * (which makes the SDK use the default https://api.anthropic.com).
 */
export async function getAnthropicBaseUrl(): Promise<string | undefined> {
  const setting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_BASE_URL" },
  });

  if (setting) {
    return setting.value.trim();
  }

  return process.env.ANTHROPIC_BASE_URL?.trim() || undefined;
}

/**
 * Returns the configured model name.
 * Checks the database first, falls back to env var, defaults to claude-sonnet-4-20250514.
 */
export async function getAnthropicModel(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_MODEL" },
  });

  if (setting) {
    return setting.value.trim();
  }

  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
}
