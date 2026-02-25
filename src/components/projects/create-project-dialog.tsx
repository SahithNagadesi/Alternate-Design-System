"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Github, FolderGit2, Loader2, RefreshCw } from "lucide-react";

interface GitHubRepo {
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  url: string;
}

interface GitHubFolder {
  name: string;
  path: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"COMPONENT" | "APPLICATION">("COMPONENT");
  const [pegaServerUrl, setPegaServerUrl] = useState("");
  const [pegaUsername, setPegaUsername] = useState("");
  const [pegaPassword, setPegaPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Application metadata state
  const [frontendFramework, setFrontendFramework] = useState("React");
  const [frontendFrameworkOther, setFrontendFrameworkOther] = useState("");
  const [pegaAppName, setPegaAppName] = useState("");
  const [caseTypes, setCaseTypes] = useState("");
  const [dxApiVersion, setDxApiVersion] = useState("24.1");
  const [dxApiAuthMethod, setDxApiAuthMethod] = useState("Basic");
  const [dxApiEndpoints, setDxApiEndpoints] = useState("");

  // GitHub state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [folders, setFolders] = useState<GitHubFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [githubAvailable, setGithubAvailable] = useState<boolean | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Fetch repos when dialog opens
  useEffect(() => {
    if (open) {
      fetchRepos();
    } else {
      // Reset state when dialog closes
      setRepos([]);
      setSelectedRepo("");
      setFolders([]);
      setSelectedFolder("");
      setGithubAvailable(null);
      setGithubError(null);
    }
  }, [open]);

  // Fetch folders when repo changes
  useEffect(() => {
    if (selectedRepo) {
      fetchFolders(selectedRepo, "");
    } else {
      setFolders([]);
      setSelectedFolder("");
    }
  }, [selectedRepo]);

  async function fetchRepos() {
    setLoadingRepos(true);
    setGithubError(null);
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || `GitHub API error (${res.status})`;
        setGithubError(msg);
        setGithubAvailable(false);
        return;
      }
      const data = await res.json();
      setRepos(data);
      setGithubAvailable(true);
    } catch {
      setGithubError("Failed to connect to GitHub API");
      setGithubAvailable(false);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function fetchFolders(repo: string, path: string) {
    setLoadingFolders(true);
    try {
      const params = new URLSearchParams({ repo });
      if (path) params.set("path", path);
      const res = await fetch(`/api/github/folders?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch folders");
      }
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const metadata = type === "APPLICATION" ? {
        frontendFramework: frontendFramework === "Other" ? frontendFrameworkOther.trim() : frontendFramework,
        pegaAppName: pegaAppName.trim(),
        caseTypes: caseTypes.trim(),
        dxApiVersion,
        dxApiAuthMethod,
        dxApiEndpoints: dxApiEndpoints.trim() || undefined,
      } : undefined;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          pegaServerUrl: pegaServerUrl.trim() || undefined,
          pegaUsername: pegaUsername.trim() || undefined,
          pegaPassword: pegaPassword.trim() || undefined,
          githubRepo: selectedRepo || undefined,
          githubFolder: selectedFolder || undefined,
          metadata,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      toast.success("Project created successfully");
      setName("");
      setType("COMPONENT");
      setPegaServerUrl("");
      setPegaUsername("");
      setPegaPassword("");
      setSelectedRepo("");
      setSelectedFolder("");
      setFrontendFramework("React");
      setFrontendFrameworkOther("");
      setPegaAppName("");
      setCaseTypes("");
      setDxApiVersion("24.1");
      setDxApiAuthMethod("Basic");
      setDxApiEndpoints("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new Pega UI project. You can configure the Pega server connection later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My Pega Component"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-type">Project Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "COMPONENT" | "APPLICATION")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPONENT">Pega Constellation Component</SelectItem>
                <SelectItem value="APPLICATION">Alternate Design System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === "COMPONENT"
                ? "A Pega Constellation custom DX component publishable to a Pega server"
                : "A full application using Pega as backend via DX APIs"}
            </p>
          </div>

          {/* Application Metadata Fields */}
          {type === "APPLICATION" && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Application Configuration</p>
              <div className="space-y-2">
                <Label htmlFor="pega-app-name">Pega Application Name *</Label>
                <Input
                  id="pega-app-name"
                  placeholder="e.g. MyApp"
                  value={pegaAppName}
                  onChange={(e) => setPegaAppName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frontend-framework">Frontend Framework</Label>
                <Select value={frontendFramework} onValueChange={setFrontendFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="React">React</SelectItem>
                    <SelectItem value="Angular">Angular</SelectItem>
                    <SelectItem value="Vue">Vue</SelectItem>
                    <SelectItem value="Svelte">Svelte</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {frontendFramework === "Other" && (
                  <Input
                    placeholder="Enter framework name"
                    value={frontendFrameworkOther}
                    onChange={(e) => setFrontendFrameworkOther(e.target.value)}
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-types">Case Types (comma-separated)</Label>
                <Input
                  id="case-types"
                  placeholder="e.g. ServiceRequest, Incident"
                  value={caseTypes}
                  onChange={(e) => setCaseTypes(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dx-api-version">DX API Version</Label>
                  <Select value={dxApiVersion} onValueChange={setDxApiVersion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24.1">24.1</SelectItem>
                      <SelectItem value="23.1">23.1</SelectItem>
                      <SelectItem value="22.1">22.1</SelectItem>
                      <SelectItem value="8.8">8.8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dx-auth-method">Auth Method</Label>
                  <Select value={dxApiAuthMethod} onValueChange={setDxApiAuthMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="OAuth 2.0">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dx-endpoints">DX API Endpoints (optional)</Label>
                <Textarea
                  id="dx-endpoints"
                  placeholder="e.g. /cases, /assignments, /data_views/D_Operators"
                  value={dxApiEndpoints}
                  onChange={(e) => setDxApiEndpoints(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* GitHub Repository Section */}
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">GitHub Repository (optional)</p>
              </div>
              {githubAvailable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                >
                  <RefreshCw className={`h-3 w-3 ${loadingRepos ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>

            {githubAvailable === false && (
              <p className="text-xs text-destructive">
                {githubError || "GitHub PAT not configured. Ask an admin to set it in Settings to enable repo selection."}
              </p>
            )}

            {githubAvailable === null && loadingRepos && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading repositories...
              </div>
            )}

            {githubAvailable && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="github-repo">Repository</Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.fullName} value={repo.fullName}>
                          <div className="flex items-center gap-2">
                            <FolderGit2 className="h-3 w-3" />
                            {repo.fullName}
                            {repo.private && (
                              <span className="text-xs text-muted-foreground">(private)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRepo && (
                  <div className="space-y-2">
                    <Label htmlFor="github-folder">Folder (optional)</Label>
                    {loadingFolders ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading folders...
                      </div>
                    ) : (
                      <Select
                        value={selectedFolder || "__ROOT__"}
                        onValueChange={(v) => {
                          const actualValue = v === "__ROOT__" ? "" : v;
                          setSelectedFolder(actualValue);
                          // Fetch subfolders for the selected path
                          fetchFolders(selectedRepo, actualValue);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Root (or select a folder)" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedFolder && (
                            <SelectItem value="__ROOT__">
                              .. (root)
                            </SelectItem>
                          )}
                          {folders.map((folder) => (
                            <SelectItem key={folder.path} value={folder.path}>
                              {folder.name}/
                            </SelectItem>
                          ))}
                          {folders.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              No subfolders found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {selectedFolder && (
                      <p className="text-xs text-muted-foreground">
                        Project will be stored at: <code>{selectedFolder}/{name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "..."}</code>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Pega Server (optional)</p>
            <div className="space-y-2">
              <Label htmlFor="pega-url">Server URL</Label>
              <Input
                id="pega-url"
                placeholder="https://your-pega-server.com"
                value={pegaServerUrl}
                onChange={(e) => setPegaServerUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pega-user">Username</Label>
                <Input
                  id="pega-user"
                  placeholder="operator"
                  value={pegaUsername}
                  onChange={(e) => setPegaUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pega-pass">Password</Label>
                <Input
                  id="pega-pass"
                  type="password"
                  value={pegaPassword}
                  onChange={(e) => setPegaPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || (type === "APPLICATION" && !pegaAppName.trim())}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
