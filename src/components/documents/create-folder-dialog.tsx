"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editFolder?: {
    id: string;
    name: string;
    description: string | null;
    visibility: "PUBLIC" | "PRIVATE";
  } | null;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreated,
  editFolder,
}: CreateFolderDialogProps) {
  const [name, setName] = useState(editFolder?.name || "");
  const [description, setDescription] = useState(editFolder?.description || "");
  const [isPrivate, setIsPrivate] = useState(editFolder?.visibility === "PRIVATE");
  const [loading, setLoading] = useState(false);

  const isEditing = !!editFolder;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setName("");
      setDescription("");
      setIsPrivate(false);
    }
    onOpenChange(open);
  }

  // Sync state when editFolder changes
  if (open && editFolder && name === "" && editFolder.name !== "") {
    setName(editFolder.name);
    setDescription(editFolder.description || "");
    setIsPrivate(editFolder.visibility === "PRIVATE");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/documents/folders/${editFolder.id}`
        : "/api/documents/folders";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          visibility: isPrivate ? "PRIVATE" : "PUBLIC",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} folder`);
      }

      toast.success(`Folder ${isEditing ? "updated" : "created"} successfully`);
      setName("");
      setDescription("");
      setIsPrivate(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Folder" : "New Folder"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the folder name, description, or visibility."
              : "Create a new document folder to organize and share files."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g. Pega Design Tokens"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-desc">Description (optional)</Label>
            <Textarea
              id="folder-desc"
              placeholder="What kind of documents will this folder contain?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Private Folder</p>
              <p className="text-xs text-muted-foreground">
                {isPrivate
                  ? "Only you and users you grant access can view"
                  : "All authenticated users can view and upload"}
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
