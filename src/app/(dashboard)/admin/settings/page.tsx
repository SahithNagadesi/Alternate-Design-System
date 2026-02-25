"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, RotateCcw, Save, Trash2, Github, FlaskConical, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SettingInfo {
  masked: string;
  source: "database" | "environment";
  updatedAt: string | null;
}

interface ValueSettingInfo {
  value: string;
  source: "database" | "environment";
  updatedAt: string | null;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeyInfo, setApiKeyInfo] = useState<SettingInfo | null>(null);
  const [baseUrlInfo, setBaseUrlInfo] = useState<ValueSettingInfo | null>(null);
  const [modelInfo, setModelInfo] = useState<ValueSettingInfo | null>(null);
  const [githubPatInfo, setGithubPatInfo] = useState<SettingInfo | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newPat, setNewPat] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showBaseUrlInput, setShowBaseUrlInput] = useState(false);
  const [showModelInput, setShowModelInput] = useState(false);
  const [showPatInput, setShowPatInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [savingBaseUrl, setSavingBaseUrl] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [savingPat, setSavingPat] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testingPat, setTestingPat] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; detail: string } | null>(null);
  const [patTestResult, setPatTestResult] = useState<{ success: boolean; detail: string } | null>(null);

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
      setBaseUrlInfo(data.anthropicBaseUrl);
      setModelInfo(data.anthropicModel);
      setGithubPatInfo(data.githubPat);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey() {
    if (!newKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setSavingKey(true);
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
      setShowKeyInput(false);
      toast.success("API key updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  }

  async function handleRevertKey() {
    setSavingKey(true);
    try {
      const res = await fetch("/api/admin/settings?setting=anthropicApiKey", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revert");
      const data = await res.json();
      setApiKeyInfo(data.anthropicApiKey);
      setNewKey("");
      setShowKeyInput(false);
      toast.success("Reverted to environment variable key");
    } catch {
      toast.error("Failed to revert API key");
    } finally {
      setSavingKey(false);
    }
  }

  async function handleSaveBaseUrl() {
    setSavingBaseUrl(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicBaseUrl: newBaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setBaseUrlInfo(data.anthropicBaseUrl);
      setNewBaseUrl("");
      setShowBaseUrlInput(false);
      toast.success(newBaseUrl.trim() ? "Base URL updated successfully" : "Base URL cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save base URL");
    } finally {
      setSavingBaseUrl(false);
    }
  }

  async function handleRevertBaseUrl() {
    setSavingBaseUrl(true);
    try {
      const res = await fetch("/api/admin/settings?setting=anthropicBaseUrl", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revert");
      const data = await res.json();
      setBaseUrlInfo(data.anthropicBaseUrl);
      setNewBaseUrl("");
      setShowBaseUrlInput(false);
      toast.success("Reverted base URL to environment variable");
    } catch {
      toast.error("Failed to revert base URL");
    } finally {
      setSavingBaseUrl(false);
    }
  }

  async function handleSaveModel() {
    setSavingModel(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicModel: newModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setModelInfo(data.anthropicModel);
      setNewModel("");
      setShowModelInput(false);
      toast.success(newModel.trim() ? "Model updated successfully" : "Model reverted to default");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save model");
    } finally {
      setSavingModel(false);
    }
  }

  async function handleRevertModel() {
    setSavingModel(true);
    try {
      const res = await fetch("/api/admin/settings?setting=anthropicModel", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revert");
      const data = await res.json();
      setModelInfo(data.anthropicModel);
      setNewModel("");
      setShowModelInput(false);
      toast.success("Reverted model to default");
    } catch {
      toast.error("Failed to revert model");
    } finally {
      setSavingModel(false);
    }
  }

  async function handleSavePat() {
    if (!newPat.trim()) {
      toast.error("Please enter a GitHub PAT");
      return;
    }
    setSavingPat(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubPat: newPat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setGithubPatInfo(data.githubPat);
      setNewPat("");
      setShowPatInput(false);
      toast.success("GitHub PAT updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save GitHub PAT");
    } finally {
      setSavingPat(false);
    }
  }

  async function handleTestKey() {
    setTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "anthropic" }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyTestResult({ success: true, detail: `Connected successfully. Model: ${data.response?.model}` });
      } else {
        const info = data.keyInfo
          ? ` [Key: ${data.keyInfo.prefix}..., len=${data.keyInfo.length}, baseURL: ${data.keyInfo.baseURL || "default"}]`
          : "";
        setKeyTestResult({ success: false, detail: `${data.error}${info}` });
      }
    } catch {
      setKeyTestResult({ success: false, detail: "Failed to reach test endpoint" });
    } finally {
      setTestingKey(false);
    }
  }

  async function handleTestPat() {
    setTestingPat(true);
    setPatTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "github" }),
      });
      const data = await res.json();
      if (data.success) {
        setPatTestResult({ success: true, detail: `Connected as @${data.github?.login}. Scopes: ${data.github?.scopes || "N/A"}` });
      } else {
        const info = data.patInfo
          ? ` [PAT: ${data.patInfo.prefix}..., len=${data.patInfo.length}, whitespace=${data.patInfo.hasWhitespace}, nonAscii=${data.patInfo.hasNonAscii}]`
          : "";
        setPatTestResult({ success: false, detail: `${data.error}${info}` });
      }
    } catch {
      setPatTestResult({ success: false, detail: "Failed to reach test endpoint" });
    } finally {
      setTestingPat(false);
    }
  }

  async function handleRevertPat() {
    setSavingPat(true);
    try {
      const res = await fetch("/api/admin/settings?setting=githubPat", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revert");
      const data = await res.json();
      setGithubPatInfo(data.githubPat);
      setNewPat("");
      setShowPatInput(false);
      toast.success("Reverted GitHub PAT to environment variable");
    } catch {
      toast.error("Failed to revert GitHub PAT");
    } finally {
      setSavingPat(false);
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
        {showKeyInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter API key..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveKey} disabled={savingKey || !newKey.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {savingKey ? "Saving..." : "Save Key"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowKeyInput(false);
                  setNewKey("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowKeyInput(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Key
            </Button>
            {apiKeyInfo?.source === "database" && (
              <Button variant="outline" onClick={handleRevertKey} disabled={savingKey}>
                <Trash2 className="mr-2 h-4 w-4" />
                Revert to Env Variable
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          The key is encrypted before storage. Supports standard Anthropic keys and enterprise proxy keys.
        </p>
      </div>

      {/* Anthropic Base URL Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">API Base URL</h2>
            <p className="text-sm text-muted-foreground">
              Custom endpoint for enterprise proxies or model vending machines
            </p>
          </div>
        </div>

        {/* Current base URL display */}
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono break-all">
                {baseUrlInfo?.value || "(default: api.anthropic.com)"}
              </code>
              {baseUrlInfo?.value && (
                <Badge variant={baseUrlInfo?.source === "database" ? "default" : "secondary"}>
                  {baseUrlInfo?.source === "database" ? "Custom" : "Environment"}
                </Badge>
              )}
            </div>
            {baseUrlInfo?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(baseUrlInfo.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Update form */}
        {showBaseUrlInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://your-proxy.example.com/api"
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveBaseUrl} disabled={savingBaseUrl}>
                <Save className="mr-2 h-4 w-4" />
                {savingBaseUrl ? "Saving..." : "Save URL"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBaseUrlInput(false);
                  setNewBaseUrl("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowBaseUrlInput(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {baseUrlInfo?.value ? "Change URL" : "Set Custom URL"}
            </Button>
            {baseUrlInfo?.source === "database" && (
              <Button variant="outline" onClick={handleRevertBaseUrl} disabled={savingBaseUrl}>
                <Trash2 className="mr-2 h-4 w-4" />
                Revert to Default
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Leave empty to use the default Anthropic API. Set a custom URL if using an enterprise proxy
          or model vending machine (e.g., <code>https://proxy.example.com/v1</code>).
        </p>
      </div>

      {/* Anthropic Model Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">AI Model</h2>
            <p className="text-sm text-muted-foreground">
              The Claude model to use for chat
            </p>
          </div>
        </div>

        {/* Current model display */}
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">
                {modelInfo?.value || "claude-sonnet-4-20250514"}
              </code>
              <Badge variant={modelInfo?.source === "database" ? "default" : "secondary"}>
                {modelInfo?.source === "database" ? "Custom" : "Default"}
              </Badge>
            </div>
            {modelInfo?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(modelInfo.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Update form */}
        {showModelInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="claude-sonnet-4-20250514"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveModel} disabled={savingModel}>
                <Save className="mr-2 h-4 w-4" />
                {savingModel ? "Saving..." : "Save Model"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowModelInput(false);
                  setNewModel("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowModelInput(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Model
            </Button>
            {modelInfo?.source === "database" && (
              <Button variant="outline" onClick={handleRevertModel} disabled={savingModel}>
                <Trash2 className="mr-2 h-4 w-4" />
                Revert to Default
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Change if your proxy requires a different model identifier. Common models:
          <code className="mx-1">claude-sonnet-4-20250514</code>,
          <code className="mx-1">claude-haiku-4-20250514</code>,
          <code className="mx-1">claude-3-5-sonnet-20241022</code>.
        </p>
      </div>

      {/* Test Connection */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Test AI Connection</h2>
        <p className="text-sm text-muted-foreground">
          Tests the API key, base URL, and model together by making a minimal API call.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestKey}
            disabled={testingKey || !apiKeyInfo?.masked || apiKeyInfo.masked === "(not configured)"}
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {testingKey ? "Testing..." : "Test Connection"}
          </Button>
          {keyTestResult && (
            <p className={`text-xs ${keyTestResult.success ? "text-green-600" : "text-destructive"}`}>
              {keyTestResult.detail}
            </p>
          )}
        </div>
      </div>

      {/* GitHub PAT Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Github className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">GitHub Personal Access Token</h2>
            <p className="text-sm text-muted-foreground">
              Used to access repositories for storing project files
            </p>
          </div>
        </div>

        {/* Current PAT display */}
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">
                {githubPatInfo?.masked || "(not configured)"}
              </code>
              {githubPatInfo?.masked && (
                <Badge variant={githubPatInfo?.source === "database" ? "default" : "secondary"}>
                  {githubPatInfo?.source === "database" ? "Custom" : "Environment"}
                </Badge>
              )}
            </div>
            {githubPatInfo?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(githubPatInfo.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Update form */}
        {showPatInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="ghp_... or github_pat_..."
                value={newPat}
                onChange={(e) => setNewPat(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSavePat} disabled={savingPat || !newPat.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {savingPat ? "Saving..." : "Save PAT"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPatInput(false);
                  setNewPat("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowPatInput(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {githubPatInfo?.masked ? "Change PAT" : "Add PAT"}
            </Button>
            {githubPatInfo?.source === "database" && (
              <Button variant="outline" onClick={handleRevertPat} disabled={savingPat}>
                <Trash2 className="mr-2 h-4 w-4" />
                Revert to Env Variable
              </Button>
            )}
          </div>
        )}

        {/* Test connection */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPat}
            disabled={testingPat || !githubPatInfo?.masked || githubPatInfo.masked === "(not configured)"}
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {testingPat ? "Testing..." : "Test Connection"}
          </Button>
          {patTestResult && (
            <p className={`text-xs ${patTestResult.success ? "text-green-600" : "text-destructive"}`}>
              {patTestResult.detail}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          The PAT is encrypted before storage. It needs <strong>repo</strong> scope to read/write repositories.
          When configured, you can select a GitHub repository and folder while creating projects.
        </p>
      </div>
    </div>
  );
}
