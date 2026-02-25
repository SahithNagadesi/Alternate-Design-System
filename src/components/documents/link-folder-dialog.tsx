"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, Check, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
  visibility: "PUBLIC" | "PRIVATE";
  _count: { documents: number };
  createdBy: { id: string; name: string | null; email: string };
}

interface FolderLink {
  id: string;
  folderId: string;
  folder: Folder;
}

interface LinkFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onLinked: () => void;
}

export function LinkFolderDialog({
  open,
  onOpenChange,
  projectId,
  onLinked,
}: LinkFolderDialogProps) {
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [existingLinks, setExistingLinks] = useState<FolderLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, projectId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [foldersRes, linksRes] = await Promise.all([
        fetch("/api/documents/folders"),
        fetch(`/api/projects/${projectId}/folder-links`),
      ]);

      if (foldersRes.ok) {
        setAllFolders(await foldersRes.json());
      }
      if (linksRes.ok) {
        const links: FolderLink[] = await linksRes.json();
        setExistingLinks(links);
        setLinkedIds(new Set(links.map((l) => l.folderId)));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(folderId: string) {
    setLinking(folderId);
    try {
      if (linkedIds.has(folderId)) {
        // Unlink
        const link = existingLinks.find((l) => l.folderId === folderId);
        if (!link) return;

        const res = await fetch(`/api/projects/${projectId}/folder-links/${link.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to unlink folder");

        setLinkedIds((prev) => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
        setExistingLinks((prev) => prev.filter((l) => l.folderId !== folderId));
        toast.success("Folder unlinked");
      } else {
        // Link
        const res = await fetch(`/api/projects/${projectId}/folder-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to link folder");
        }

        const newLink = await res.json();
        setLinkedIds((prev) => new Set(prev).add(folderId));
        setExistingLinks((prev) => [...prev, newLink]);
        toast.success("Folder linked");
      }
      onLinked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setLinking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Document Folders</DialogTitle>
          <DialogDescription>
            Select folders to link to this project. Linked folder documents will be available as AI context.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : allFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No document folders available.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create folders from the Documents page first.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allFolders.map((folder) => {
                const isLinked = linkedIds.has(folder.id);
                const isProcessing = linking === folder.id;

                return (
                  <button
                    key={folder.id}
                    onClick={() => handleToggle(folder.id)}
                    disabled={isProcessing}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isLinked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isLinked ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{folder.name}</p>
                        <Badge
                          variant={folder.visibility === "PUBLIC" ? "secondary" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {folder.visibility === "PUBLIC" ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {folder._count.documents} document{folder._count.documents !== 1 ? "s" : ""}
                        {" · "}
                        {folder.createdBy.name || folder.createdBy.email}
                      </p>
                    </div>
                    {isLinked && <Link2 className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
