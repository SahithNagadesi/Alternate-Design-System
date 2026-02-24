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
import { Trash2, UserPlus, Crown, User } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  type: "COMPONENT" | "APPLICATION";
  pegaServerUrl: string | null;
  folderPath: string;
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

  useEffect(() => {
    if (open) {
      setName(project.name);
      setPegaServerUrl(project.pegaServerUrl || "");
      fetchMembers();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Manage project configuration, Pega server, and team members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
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
