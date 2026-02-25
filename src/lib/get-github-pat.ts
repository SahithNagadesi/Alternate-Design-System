import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * Returns the active GitHub PAT.
 * Checks the database first (admin-configured), falls back to env var.
 * Throws if a DB entry exists but decryption fails (so callers can report it).
 */
export async function getGithubPat(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: "GITHUB_PAT" },
  });

  if (setting) {
    // If the value is in the DB, decrypt it — let errors propagate
    return decrypt(setting.value);
  }

  return process.env.GITHUB_PAT?.trim() ?? null;
}
