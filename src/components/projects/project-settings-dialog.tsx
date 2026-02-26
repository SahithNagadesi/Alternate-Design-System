"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, UserPlus, Crown, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationMetadata, ComponentMetadata } from "@/types/project-metadata";

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

interface Project {
  id: string;
  name: string;
  type: "COMPONENT" | "APPLICATION";
  pegaServerUrl: string | null;
  folderPath: string;
  metadata?: ApplicationMetadata | ComponentMetadata | null;
  members: Array<{
    role: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface ProjectSettingsDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

interface Member {
  userId: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; name: string; email: string; role: string };
}

export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange,
  onUpdated,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project.name);
  const [pegaServerUrl, setPegaServerUrl] = useState(project.pegaServerUrl || "");
  const [pegaUsername, setPegaUsername] = useState("");
  const [pegaPassword, setPegaPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // App Config state (APPLICATION projects only)
  const [appMetadata, setAppMetadata] = useState<ApplicationMetadata>({
    frontendFramework: "",
    frontendFrameworkOther: "",
    pegaAppName: "",
    caseTypes: "",
    dxApiVersion: "24.1",
    dxApiAuthMethod: "Basic",
    dxApiEndpoints: "",
  });
  const [savingMetadata, setSavingMetadata] = useState(false);

  // Component Config state (COMPONENT projects only)
  const [compMetadata, setCompMetadata] = useState<ComponentMetadata>({
    organizationName: "",
    libraryName: "",
    componentName: "",
    componentVersion: "01.01.01",
    projectDescription: "",
    componentType: "Field",
    componentSubtype: "TextInput",
    dxcbVersion: "25.1.10",
    pegaPlatformVersion: "25",
    libraryMode: true,
    rulesetName: "",
    rulesetVersion: "",
    oauthGrantType: "",
    clientId: "",
  });
  const [savingCompMetadata, setSavingCompMetadata] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const isApplication = project.type === "APPLICATION";
  const isComponent = project.type === "COMPONENT";

  useEffect(() => {
    if (open) {
      setName(project.name);
      setPegaServerUrl(project.pegaServerUrl || "");
      fetchMembers();
      if (isApplication && project.metadata) {
        const meta = project.metadata as ApplicationMetadata;
        setAppMetadata({
          frontendFramework: meta.frontendFramework || "",
          frontendFrameworkOther: meta.frontendFrameworkOther || "",
          pegaAppName: meta.pegaAppName || "",
          caseTypes: meta.caseTypes || "",
          dxApiVersion: meta.dxApiVersion || "24.1",
          dxApiAuthMethod: meta.dxApiAuthMethod || "Basic",
          dxApiEndpoints: meta.dxApiEndpoints || "",
        });
      }
      if (isComponent && project.metadata) {
        const meta = project.metadata as ComponentMetadata;
        setCompMetadata({
          organizationName: meta.organizationName || "",
          libraryName: meta.libraryName || "",
          componentName: meta.componentName || "",
          componentVersion: meta.componentVersion || "01.01.01",
          projectDescription: meta.projectDescription || "",
          componentType: meta.componentType || "Field",
          componentSubtype: meta.componentSubtype || "TextInput",
          dxcbVersion: meta.dxcbVersion || "25.1.10",
          pegaPlatformVersion: meta.pegaPlatformVersion || "25",
          libraryMode: meta.libraryMode !== false,
          rulesetName: meta.rulesetName || "",
          rulesetVersion: meta.rulesetVersion || "",
          oauthGrantType: meta.oauthGrantType || "",
          clientId: meta.clientId || "",
        });
      }
    }
  }, [open, project]);

  async function fetchMembers() {
    const res = await fetch(`/api/projects/${project.id}/members`);
    if (res.ok) {
      setMembers(await res.json());
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, string> = {};
      if (name !== project.name) body.name = name;
      if (pegaServerUrl !== (project.pegaServerUrl || "")) body.pegaServerUrl = pegaServerUrl;
      if (pegaUsername && pegaPassword) {
        body.pegaUsername = pegaUsername;
        body.pegaPassword = pegaPassword;
      }

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Project updated");
      setPegaUsername("");
      setPegaPassword("");
      onUpdated();
      onOpenChange(false);
    } catch {
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Project deleted");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to delete project");
      setDeleting(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim(), role: "MEMBER" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }

      toast.success("Member added");
      setNewMemberEmail("");
      fetchMembers();
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: string, userName: string) {
    if (!confirm(`Remove "${userName}" from this project?`)) return;

    const res = await fetch(`/api/projects/${project.id}/members/${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Member removed");
      fetchMembers();
      onUpdated();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove member");
    }
  }

  async function handleChangeRole(userId: string, newRole: "OWNER" | "MEMBER") {
    const res = await fetch(`/api/projects/${project.id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      toast.success("Role updated");
      fetchMembers();
    } else {
      toast.error("Failed to update role");
    }
  }

  async function handleSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    setSavingMetadata(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: appMetadata }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("App configuration updated");
      onUpdated();
    } catch {
      toast.error("Failed to update app configuration");
    } finally {
      setSavingMetadata(false);
    }
  }

  async function handleSaveCompMetadata(e: React.FormEvent) {
    e.preventDefault();
    setSavingCompMetadata(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: compMetadata }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Component configuration updated");
      onUpdated();
    } catch {
      toast.error("Failed to update component configuration");
    } finally {
      setSavingCompMetadata(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Manage project configuration, Pega server, and team members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${isApplication || isComponent ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            {isApplication && <TabsTrigger value="appconfig">App Config</TabsTrigger>}
            {isComponent && <TabsTrigger value="compconfig">Component Config</TabsTrigger>}
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name">Project Name</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Folder Path</Label>
                <Input value={project.folderPath} disabled />
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Pega Server Connection</p>
                <div className="space-y-2">
                  <Label htmlFor="settings-pega-url">Server URL</Label>
                  <Input
                    id="settings-pega-url"
                    placeholder="https://your-pega-server.com"
                    value={pegaServerUrl}
                    onChange={(e) => setPegaServerUrl(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-pega-user">Username</Label>
                    <Input
                      id="settings-pega-user"
                      placeholder="Leave blank to keep current"
                      value={pegaUsername}
                      onChange={(e) => setPegaUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-pega-pass">Password</Label>
                    <Input
                      id="settings-pega-pass"
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={pegaPassword}
                      onChange={(e) => setPegaPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {isApplication && (
            <TabsContent value="appconfig">
              <form onSubmit={handleSaveMetadata} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-pega-app">Pega Application Name</Label>
                  <Input
                    id="settings-pega-app"
                    value={appMetadata.pegaAppName}
                    onChange={(e) =>
                      setAppMetadata({ ...appMetadata, pegaAppName: e.target.value })
                    }
                    placeholder="e.g. MyApp"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-framework">Frontend Framework</Label>
                  <Select
                    value={appMetadata.frontendFramework}
                    onValueChange={(val) =>
                      setAppMetadata({ ...appMetadata, frontendFramework: val, frontendFrameworkOther: val !== "Other" ? "" : appMetadata.frontendFrameworkOther })
                    }
                  >
                    <SelectTrigger id="settings-framework">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="React">React</SelectItem>
                      <SelectItem value="Angular">Angular</SelectItem>
                      <SelectItem value="Vue">Vue</SelectItem>
                      <SelectItem value="Svelte">Svelte</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {appMetadata.frontendFramework === "Other" && (
                    <Input
                      placeholder="Enter framework name"
                      value={appMetadata.frontendFrameworkOther || ""}
                      onChange={(e) =>
                        setAppMetadata({ ...appMetadata, frontendFrameworkOther: e.target.value })
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-casetypes">Case Types</Label>
                  <Input
                    id="settings-casetypes"
                    value={appMetadata.caseTypes}
                    onChange={(e) =>
                      setAppMetadata({ ...appMetadata, caseTypes: e.target.value })
                    }
                    placeholder="e.g. MyOrg-MyApp-Work-Order, MyOrg-MyApp-Work-ServiceRequest"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-dxversion">DX API Version</Label>
                    <Select
                      value={appMetadata.dxApiVersion}
                      onValueChange={(val) =>
                        setAppMetadata({ ...appMetadata, dxApiVersion: val })
                      }
                    >
                      <SelectTrigger id="settings-dxversion">
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
                    <Label htmlFor="settings-dxauth">Auth Method</Label>
                    <Select
                      value={appMetadata.dxApiAuthMethod}
                      onValueChange={(val) =>
                        setAppMetadata({ ...appMetadata, dxApiAuthMethod: val })
                      }
                    >
                      <SelectTrigger id="settings-dxauth">
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
                  <Label htmlFor="settings-dxendpoints">DX API Endpoints</Label>
                  <Textarea
                    id="settings-dxendpoints"
                    value={appMetadata.dxApiEndpoints || ""}
                    onChange={(e) =>
                      setAppMetadata({ ...appMetadata, dxApiEndpoints: e.target.value })
                    }
                    placeholder="Optional: custom DX API endpoint paths"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingMetadata}>
                    {savingMetadata ? "Saving..." : "Save Config"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          )}

          {isComponent && (
            <TabsContent value="compconfig">
              <form onSubmit={handleSaveCompMetadata} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-org">Organization</Label>
                    <Input
                      id="settings-org"
                      value={compMetadata.organizationName}
                      onChange={(e) => setCompMetadata({ ...compMetadata, organizationName: e.target.value })}
                      placeholder="e.g. MyOrg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-lib">Library</Label>
                    <Input
                      id="settings-lib"
                      value={compMetadata.libraryName}
                      onChange={(e) => setCompMetadata({ ...compMetadata, libraryName: e.target.value })}
                      placeholder="e.g. MyLib"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-comp">Component</Label>
                    <Input
                      id="settings-comp"
                      value={compMetadata.componentName}
                      onChange={(e) => setCompMetadata({ ...compMetadata, componentName: e.target.value })}
                      placeholder="e.g. MyField"
                      required
                    />
                  </div>
                </div>

                {compMetadata.organizationName && compMetadata.libraryName && compMetadata.componentName && (
                  <p className="text-xs text-muted-foreground">
                    Full Key: <code className="bg-muted px-1 rounded">{compMetadata.organizationName}_{compMetadata.libraryName}_{compMetadata.componentName}</code>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-comp-version">Version</Label>
                    <Input
                      id="settings-comp-version"
                      value={compMetadata.componentVersion}
                      onChange={(e) => setCompMetadata({ ...compMetadata, componentVersion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-comp-desc">Description</Label>
                    <Input
                      id="settings-comp-desc"
                      value={compMetadata.projectDescription || ""}
                      onChange={(e) => setCompMetadata({ ...compMetadata, projectDescription: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-comp-type">Component Type</Label>
                    <Select
                      value={compMetadata.componentType}
                      onValueChange={(val) => {
                        const subtypes = COMPONENT_SUBTYPES[val] || [];
                        setCompMetadata({ ...compMetadata, componentType: val, componentSubtype: subtypes[0] || "" });
                      }}
                    >
                      <SelectTrigger id="settings-comp-type">
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
                    <Label htmlFor="settings-comp-subtype">Subtype</Label>
                    <Select
                      value={compMetadata.componentSubtype}
                      onValueChange={(val) => setCompMetadata({ ...compMetadata, componentSubtype: val })}
                    >
                      <SelectTrigger id="settings-comp-subtype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(COMPONENT_SUBTYPES[compMetadata.componentType] || []).map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-dxcb">DXCB Version</Label>
                    <Select
                      value={compMetadata.dxcbVersion}
                      onValueChange={(val) => setCompMetadata({ ...compMetadata, dxcbVersion: val })}
                    >
                      <SelectTrigger id="settings-dxcb">
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
                    <Label htmlFor="settings-platform">Pega Platform</Label>
                    <Select
                      value={compMetadata.pegaPlatformVersion}
                      onValueChange={(val) => setCompMetadata({ ...compMetadata, pegaPlatformVersion: val })}
                    >
                      <SelectTrigger id="settings-platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">Pega &apos;25</SelectItem>
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
                    <Label htmlFor="settings-lib-mode" className="text-sm">Library Mode</Label>
                    <p className="text-xs text-muted-foreground">Default for Pega &apos;25+</p>
                  </div>
                  <Switch
                    id="settings-lib-mode"
                    checked={compMetadata.libraryMode}
                    onCheckedChange={(checked) => setCompMetadata({ ...compMetadata, libraryMode: checked })}
                  />
                </div>

                {/* Advanced Section */}
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`} />
                  Advanced
                </button>

                {showAdvancedSettings && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="settings-ruleset">Ruleset Name</Label>
                        <Input
                          id="settings-ruleset"
                          value={compMetadata.rulesetName || ""}
                          onChange={(e) => setCompMetadata({ ...compMetadata, rulesetName: e.target.value })}
                          placeholder="e.g. CustomDXComponents"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settings-ruleset-ver">Ruleset Version</Label>
                        <Input
                          id="settings-ruleset-ver"
                          value={compMetadata.rulesetVersion || ""}
                          onChange={(e) => setCompMetadata({ ...compMetadata, rulesetVersion: e.target.value })}
                          placeholder="e.g. 01-01-01"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="settings-oauth">OAuth Grant Type</Label>
                        <Select
                          value={compMetadata.oauthGrantType || "__none__"}
                          onValueChange={(v) => setCompMetadata({ ...compMetadata, oauthGrantType: v === "__none__" ? "" : v })}
                        >
                          <SelectTrigger id="settings-oauth">
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
                        <Label htmlFor="settings-client-id">Client ID</Label>
                        <Input
                          id="settings-client-id"
                          value={compMetadata.clientId || ""}
                          onChange={(e) => setCompMetadata({ ...compMetadata, clientId: e.target.value })}
                          placeholder="OAuth 2.0 Client ID"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingCompMetadata}>
                    {savingCompMetadata ? "Saving..." : "Save Config"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          )}

          <TabsContent value="members" className="space-y-4">
            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-2">
              <Input
                placeholder="Enter user email..."
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                type="email"
              />
              <Button type="submit" size="sm" disabled={addingMember || !newMemberEmail.trim()}>
                <UserPlus className="mr-1 h-4 w-4" />
                {addingMember ? "Adding..." : "Add"}
              </Button>
            </form>

            {/* Members List */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {member.role === "OWNER" ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={member.role === "OWNER" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() =>
                        handleChangeRole(
                          member.userId,
                          member.role === "OWNER" ? "MEMBER" : "OWNER"
                        )
                      }
                    >
                      {member.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveMember(member.userId, member.user.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
