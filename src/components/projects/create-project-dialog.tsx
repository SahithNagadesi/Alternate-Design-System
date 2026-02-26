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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Github, FolderGit2, Loader2, RefreshCw, ChevronDown } from "lucide-react";

const COMPONENT_SUBTYPES: Record<string, string[]> = {
  Field: [
    "Text", "TextInput", "Integer", "Decimal", "Currency", "Percentage",
    "Boolean", "Date", "DateTime", "TimeOfDay", "Email", "Phone", "URL",
    "Picklist", "RadioButtons", "TextArea", "RichText", "Checkbox",
    "AutoComplete", "Attachment",
  ],
  Template: [
    "FORM", "PAGE", "DETAILS", "DASHBOARD", "TAB", "LIST", "DATAVIEW", "OBJECTVIEW",
  ],
  Widget: ["CASE", "PAGE", "PAGE & CASE"],
};

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

  // Component metadata state
  const [organizationName, setOrganizationName] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [componentName, setComponentName] = useState("");
  const [componentVersion, setComponentVersion] = useState("01.01.01");
  const [projectDescription, setProjectDescription] = useState("");
  const [componentType, setComponentType] = useState("Field");
  const [componentSubtype, setComponentSubtype] = useState("TextInput");
  const [dxcbVersion, setDxcbVersion] = useState("25.1.10");
  const [pegaPlatformVersion, setPegaPlatformVersion] = useState("25");
  const [libraryMode, setLibraryMode] = useState(true);
  const [rulesetName, setRulesetName] = useState("");
  const [rulesetVersion, setRulesetVersion] = useState("");
  const [oauthGrantType, setOauthGrantType] = useState("");
  const [clientId, setClientId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset subtype when type changes
  useEffect(() => {
    const subtypes = COMPONENT_SUBTYPES[componentType] || [];
    setComponentSubtype(subtypes[0] || "");
  }, [componentType]);

  // Auto-derive library mode from DXCB + platform version
  useEffect(() => {
    const majorPlatform = parseFloat(pegaPlatformVersion);
    const majorDxcb = parseFloat(dxcbVersion);
    // Library mode is default for Pega '25+ and DXCB 25+
    setLibraryMode(majorPlatform >= 25 || majorDxcb >= 25);
  }, [dxcbVersion, pegaPlatformVersion]);

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
      } : type === "COMPONENT" ? {
        organizationName: organizationName.trim(),
        libraryName: libraryName.trim(),
        componentName: componentName.trim(),
        componentVersion,
        projectDescription: projectDescription.trim() || undefined,
        componentType,
        componentSubtype,
        dxcbVersion,
        pegaPlatformVersion,
        libraryMode,
        rulesetName: rulesetName.trim() || undefined,
        rulesetVersion: rulesetVersion.trim() || undefined,
        oauthGrantType: oauthGrantType || undefined,
        clientId: clientId.trim() || undefined,
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
      setOrganizationName("");
      setLibraryName("");
      setComponentName("");
      setComponentVersion("01.01.01");
      setProjectDescription("");
      setComponentType("Field");
      setComponentSubtype("TextInput");
      setDxcbVersion("25.1.10");
      setPegaPlatformVersion("25");
      setLibraryMode(true);
      setRulesetName("");
      setRulesetVersion("");
      setOauthGrantType("");
      setClientId("");
      setShowAdvanced(false);
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

          {/* Component Metadata Fields */}
          {type === "COMPONENT" && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Component Configuration</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization *</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g. MyOrg"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lib-name">Library *</Label>
                  <Input
                    id="lib-name"
                    placeholder="e.g. MyLib"
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-name">Component *</Label>
                  <Input
                    id="comp-name"
                    placeholder="e.g. MyField"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {organizationName && libraryName && componentName && (
                <p className="text-xs text-muted-foreground">
                  Full Key: <code className="bg-muted px-1 rounded">{organizationName}_{libraryName}_{componentName}</code>
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="comp-version">Version</Label>
                  <Input
                    id="comp-version"
                    placeholder="01.01.01"
                    value={componentVersion}
                    onChange={(e) => setComponentVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-desc">Description</Label>
                  <Input
                    id="comp-desc"
                    placeholder="Optional description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="comp-type">Component Type *</Label>
                  <Select value={componentType} onValueChange={setComponentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Field">Field</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                      <SelectItem value="Widget">Widget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-subtype">Subtype *</Label>
                  <Select value={componentSubtype} onValueChange={setComponentSubtype}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(COMPONENT_SUBTYPES[componentType] || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dxcb-version">DXCB Version</Label>
                  <Select value={dxcbVersion} onValueChange={setDxcbVersion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25.1.10">25.1.10</SelectItem>
                      <SelectItem value="24.2.10">24.2.10</SelectItem>
                      <SelectItem value="24.1.10">24.1.10</SelectItem>
                      <SelectItem value="23.1.10">23.1.10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-version">Pega Platform</Label>
                  <Select value={pegaPlatformVersion} onValueChange={setPegaPlatformVersion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">Pega '25</SelectItem>
                      <SelectItem value="24.2">24.2</SelectItem>
                      <SelectItem value="24.1">24.1</SelectItem>
                      <SelectItem value="23.1">23.1</SelectItem>
                      <SelectItem value="8.8">8.8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <Label htmlFor="lib-mode" className="text-sm">Library Mode</Label>
                  <p className="text-xs text-muted-foreground">Default for Pega &apos;25+</p>
                </div>
                <Switch
                  id="lib-mode"
                  checked={libraryMode}
                  onCheckedChange={setLibraryMode}
                />
              </div>

              {/* Advanced Section */}
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                Advanced
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="ruleset-name">Ruleset Name</Label>
                      <Input
                        id="ruleset-name"
                        placeholder="e.g. CustomDXComponents"
                        value={rulesetName}
                        onChange={(e) => setRulesetName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ruleset-version">Ruleset Version</Label>
                      <Input
                        id="ruleset-version"
                        placeholder="e.g. 01-01-01"
                        value={rulesetVersion}
                        onChange={(e) => setRulesetVersion(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="oauth-grant">OAuth Grant Type</Label>
                      <Select value={oauthGrantType || "__none__"} onValueChange={(v) => setOauthGrantType(v === "__none__" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          <SelectItem value="authCode">Authorization Code</SelectItem>
                          <SelectItem value="passwordCreds">Password Credentials</SelectItem>
                          <SelectItem value="clientCreds">Client Credentials</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        placeholder="OAuth 2.0 Client ID"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
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
            <Button type="submit" disabled={
              loading ||
              !name.trim() ||
              (type === "APPLICATION" && !pegaAppName.trim()) ||
              (type === "COMPONENT" && (!organizationName.trim() || !libraryName.trim() || !componentName.trim()))
            }>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
