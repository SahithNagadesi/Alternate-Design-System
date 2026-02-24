"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          pegaServerUrl: pegaServerUrl.trim() || undefined,
          pegaUsername: pegaUsername.trim() || undefined,
          pegaPassword: pegaPassword.trim() || undefined,
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
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                <SelectItem value="COMPONENT">Custom Component</SelectItem>
                <SelectItem value="APPLICATION">Alternate Design System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === "COMPONENT"
                ? "A Pega UI component publishable to a Pega server"
                : "A full application using Pega as backend via DX APIs"}
            </p>
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
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
