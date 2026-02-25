"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Upload, FileText, Trash2, Loader2, FileCode, FileImage, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  mimeType: string;
  blobUrl: string;
  enabled: boolean;
  createdAt: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json") || mimeType.includes("xml") || mimeType.includes("html") || mimeType.includes("css")) return FileCode;
  if (mimeType.startsWith("text/")) return FileText;
  return File;
}

export function ContextPanel({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  async function fetchDocuments() {
    const res = await fetch(`/api/projects/${projectId}/documents`);
    if (res.ok) {
      setDocuments(await res.json());
    }
  }

  async function uploadFile(file: globalThis.File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/projects/${projectId}/documents`, {
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
      fetchDocuments();
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleUpload(files);
  }, [projectId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function toggleDocument(docId: string, enabled: boolean) {
    const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, enabled } : d))
      );
    }
  }

  async function deleteDocument(docId: string, name: string) {
    if (!confirm(`Remove "${name}" from context?`)) return;
    const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document removed");
    }
  }

  function toggleAll(enabled: boolean) {
    documents.forEach((doc) => {
      if (doc.enabled !== enabled) {
        toggleDocument(doc.id, enabled);
      }
    });
  }

  const enabledCount = documents.filter((d) => d.enabled).length;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/50 bg-card shadow-sm transition-colors",
        dragOver && "border-primary border-dashed bg-primary/5"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between border-b border-border/40 p-3">
        <h3 className="text-sm font-semibold">Context Documents</h3>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Upload className="mr-1 h-3 w-3" />
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
              <FileText className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Upload files or drag & drop them here to use as AI context
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.mimeType);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <Switch
                    checked={doc.enabled}
                    onCheckedChange={(checked) => toggleDocument(doc.id, checked)}
                  />
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 overflow-hidden">
                    <a
                      href={doc.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {doc.name}
                    </a>
                    <p className="text-[10px] text-muted-foreground/60">{doc.mimeType}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => deleteDocument(doc.id, doc.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 p-2.5">
        <p className="text-[11px] text-muted-foreground/60">
          {enabledCount} of {documents.length} enabled
        </p>
        {documents.length > 0 && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] rounded-md"
              onClick={() => toggleAll(true)}
              disabled={enabledCount === documents.length}
            >
              All on
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] rounded-md"
              onClick={() => toggleAll(false)}
              disabled={enabledCount === 0}
            >
              All off
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
