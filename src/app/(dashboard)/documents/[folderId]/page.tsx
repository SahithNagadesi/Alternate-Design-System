"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  FileText,
  FileCode,
  FileImage,
  File,
  Lock,
  Globe,
  Users,
  Pencil,
  Download,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateFolderDialog } from "@/components/documents/create-folder-dialog";
import { FolderAccessDialog } from "@/components/documents/folder-access-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  filePath: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface AccessGrant {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
}

interface Folder {
  id: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdById: string;
  createdBy: { id: string; name: string | null; email: string };
  documents: Document[];
  accessGrants: AccessGrant[];
  _count: { documents: number };
  createdAt: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  )
    return FileCode;
  if (mimeType.startsWith("text/")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const folderId = params.folderId as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = folder?.createdById === session?.user?.id;

  async function fetchFolder() {
    try {
      const res = await fetch(`/api/documents/folders/${folderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/documents");
          return;
        }
        throw new Error("Failed to load folder");
      }
      setFolder(await res.json());
    } catch {
      toast.error("Failed to load folder");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFolder();
  }, [folderId]);

  async function uploadFile(file: globalThis.File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/documents/folders/${folderId}/documents`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

  async function handleUpload(files: globalThis.File[]) {
    if (files.length === 0) return;
    setUploading(true);

    try {
      for (const file of files) {
        await uploadFile(file);
      }
      toast.success(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`);
      fetchFolder();
    } catch {
      toast.error("Failed to upload file(s)");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    handleUpload(files);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      handleUpload(files);
    },
    [folderId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function deleteDocument(docId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/documents/folders/${folderId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      setFolder((prev) =>
        prev
          ? {
              ...prev,
              documents: prev.documents.filter((d) => d.id !== docId),
              _count: { documents: prev._count.documents - 1 },
            }
          : prev
      );
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  }

  async function deleteFolder() {
    if (!folder) return;
    if (
      !confirm(
        `Delete folder "${folder.name}" and all its documents? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/documents/folders/${folderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Folder deleted");
      router.push("/documents");
    } catch {
      toast.error("Failed to delete folder");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{folder.name}</h1>
              <Badge
                variant={folder.visibility === "PUBLIC" ? "secondary" : "outline"}
                className="rounded-full text-[10px] font-semibold uppercase tracking-wider px-2.5"
              >
                {folder.visibility === "PUBLIC" ? (
                  <Globe className="mr-1 h-3 w-3" />
                ) : (
                  <Lock className="mr-1 h-3 w-3" />
                )}
                {folder.visibility === "PUBLIC" ? "Public" : "Private"}
              </Badge>
            </div>
            {folder.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{folder.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Created by {folder.createdBy.name || folder.createdBy.email}
              {" · "}
              {new Date(folder.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileInput}
          />

          {isOwner && folder.visibility === "PRIVATE" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setAccessDialogOpen(true)}
            >
              <Users className="mr-1.5 h-4 w-4" />
              Access
            </Button>
          )}

          {isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-destructive hover:text-destructive"
                onClick={deleteFolder}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Drop zone + document list */}
      <div
        className={`rounded-xl border transition-colors ${
          dragOver
            ? "border-primary border-dashed bg-primary/5"
            : "border-border/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {folder.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-semibold">No documents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Upload files or drag & drop them here
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {/* Drag overlay hint */}
            {dragOver && (
              <div className="flex items-center justify-center p-4 text-sm text-primary font-medium">
                Drop files here to upload
              </div>
            )}
            {folder.documents.map((doc) => {
              const Icon = getFileIcon(doc.mimeType);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.mimeType}</span>
                      <span>·</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.name}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => deleteDocument(doc.id, doc.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {folder.documents.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {folder.documents.length} document{folder.documents.length !== 1 ? "s" : ""}
          {" · "}
          {formatFileSize(folder.documents.reduce((sum, d) => sum + d.fileSize, 0))} total
        </p>
      )}

      {/* Edit dialog */}
      {isOwner && (
        <CreateFolderDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onCreated={() => {
            setEditDialogOpen(false);
            fetchFolder();
          }}
          editFolder={folder}
        />
      )}

      {/* Access dialog */}
      {isOwner && folder.visibility === "PRIVATE" && (
        <FolderAccessDialog
          open={accessDialogOpen}
          onOpenChange={setAccessDialogOpen}
          folderId={folder.id}
          folderName={folder.name}
        />
      )}
    </div>
  );
}
