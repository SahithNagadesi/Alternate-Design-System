// Server-side environment variable validation
// Import this in server entry points to fail fast on missing config

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateEnv() {
  const errors: string[] = [];

  const requiredVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "ENCRYPTION_KEY",
  ];

  for (const name of requiredVars) {
    if (!process.env[name]?.trim()) {
      errors.push(name);
    }
  }

  // ENCRYPTION_KEY must be exactly 64 hex chars (after cleaning)
  const encKeyRaw = process.env.ENCRYPTION_KEY;
  if (encKeyRaw) {
    const encKey = encKeyRaw.replace(/\\n/g, "").replace(/^["']|["']$/g, "").trim();
    if (encKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(encKey)) {
      errors.push("ENCRYPTION_KEY (must be 64 hex characters)");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Missing or invalid environment variables:\n  - ${errors.join("\n  - ")}\n\nSee .env.example for required configuration.`
    );
  }
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get NEXTAUTH_SECRET() {
    return required("NEXTAUTH_SECRET");
  },
  get NEXTAUTH_URL() {
    return process.env.NEXTAUTH_URL || "http://localhost:3000";
  },
  get ANTHROPIC_API_KEY() {
    return process.env.ANTHROPIC_API_KEY?.trim() || "";
  },
  get BLOB_READ_WRITE_TOKEN() {
    return process.env.BLOB_READ_WRITE_TOKEN || "";
  },
  get ENCRYPTION_KEY() {
    return required("ENCRYPTION_KEY");
  },
};
