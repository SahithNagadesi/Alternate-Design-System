"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, RotateCcw, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ApiKeyInfo {
  masked: string;
  source: "database" | "environment";
  updatedAt: string | null;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [newKey, setNewKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setApiKeyInfo(data.anthropicApiKey);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!newKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: newKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setApiKeyInfo(data.anthropicApiKey);
      setNewKey("");
      setShowInput(false);
      toast.success("API key updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevert() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revert");
      const data = await res.json();
      setApiKeyInfo(data.anthropicApiKey);
      setNewKey("");
      setShowInput(false);
      toast.success("Reverted to environment variable key");
    } catch {
      toast.error("Failed to revert API key");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage application configuration</p>
      </div>

      {/* Anthropic API Key Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Anthropic API Key</h2>
            <p className="text-sm text-muted-foreground">
              Used for AI chat in all projects
            </p>
          </div>
        </div>

        {/* Current key display */}
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">
                {apiKeyInfo?.masked || "(not configured)"}
              </code>
              <Badge variant={apiKeyInfo?.source === "database" ? "default" : "secondary"}>
                {apiKeyInfo?.source === "database" ? "Custom" : "Environment"}
              </Badge>
            </div>
            {apiKeyInfo?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(apiKeyInfo.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Update form */}
        {showInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !newKey.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Key"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInput(false);
                  setNewKey("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowInput(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Key
            </Button>
            {apiKeyInfo?.source === "database" && (
              <Button variant="outline" onClick={handleRevert} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Revert to Env Variable
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          The key is encrypted before storage. Setting a custom key overrides the server environment variable.
          Reverting removes the custom key and falls back to the environment variable.
        </p>
      </div>
    </div>
  );
}
