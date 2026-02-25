"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  type: "COMPONENT" | "APPLICATION";
  pegaServerUrl: string | null;
}

interface PublishDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PublishRecord {
  id: string;
  pegaServerUrl: string;
  status: "IN_PROGRESS" | "SUCCESS" | "FAILED";
  componentFiles: string[];
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  user: { name: string; email: string };
}

interface ProjectFile {
  path: string;
  content: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SUCCESS":
      return (
        <Badge variant="default" className="bg-green-600 text-white gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PublishDialog({
  project,
  open,
  onOpenChange,
}: PublishDialogProps) {
  // Publish form state
  const [serverUrl, setServerUrl] = useState(project.pegaServerUrl || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [publishing, setPublishing] = useState(false);

  // File selection state
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [loadingFiles, setLoadingFiles] = useState(false);

  // History state
  const [history, setHistory] = useState<PublishRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/files`);
      if (res.ok) {
        const data: ProjectFile[] = await res.json();
        setFiles(data);
        // Select all by default
        setSelectedPaths(new Set(data.map((f) => f.path)));
      }
    } catch {
      // Silently fail — user can still publish without file selection
    } finally {
      setLoadingFiles(false);
    }
  }, [project.id]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/publish`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingHistory(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (open) {
      setServerUrl(project.pegaServerUrl || "");
      setUsername("");
      setPassword("");
      fetchFiles();
      fetchHistory();
    }
  }, [open, project, fetchFiles, fetchHistory]);

  function toggleFile(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedPaths.size === files.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(files.map((f) => f.path)));
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();

    if (!serverUrl.trim()) {
      toast.error("Pega server URL is required");
      return;
    }

    setPublishing(true);
    try {
      const selectedFiles =
        files.length > 0
          ? files.filter((f) => selectedPaths.has(f.path))
          : undefined;

      const res = await fetch(`/api/projects/${project.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegaServerUrl: serverUrl,
          pegaUsername: username || undefined,
          pegaPassword: password || undefined,
          selectedFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Publish failed");
      } else {
        toast.success(data.message || "Published successfully");
        onOpenChange(false);
      }

      // Refresh history after publish attempt
      fetchHistory();
    } catch {
      toast.error("Failed to publish component");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Component</DialogTitle>
          <DialogDescription>
            Package and publish &quot;{project.name}&quot; to a Pega server
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="publish" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="publish" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Publish
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publish">
            <form onSubmit={handlePublish} className="space-y-4">
              {/* Server URL */}
              <div className="space-y-2">
                <Label htmlFor="publish-server-url">Pega Server URL</Label>
                <Input
                  id="publish-server-url"
                  placeholder="https://your-pega-server.com"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pre-filled from project settings. Override for this publish if needed.
                </p>
              </div>

              {/* Credentials override */}
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">
                  Credentials{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (leave blank to use project-level credentials)
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="publish-username">Username</Label>
                    <Input
                      id="publish-username"
                      placeholder="Optional override"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publish-password">Password</Label>
                    <Input
                      id="publish-password"
                      type="password"
                      placeholder="Optional override"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* File selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Files to Publish</Label>
                  {files.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={toggleAll}
                    >
                      {selectedPaths.size === files.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {loadingFiles ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading files...
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No files found. All project files will be published.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                    {files.map((file) => (
                      <label
                        key={file.path}
                        className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPaths.has(file.path)}
                          onChange={() => toggleFile(file.path)}
                          className="rounded border-input"
                        />
                        <span className="text-xs font-mono truncate">
                          {file.path}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Publish to Pega
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={fetchHistory}
                disabled={loadingHistory}
              >
                <RefreshCw
                  className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No publish history yet
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-md border p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={record.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {record.pegaServerUrl}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>by {record.user.name}</span>
                      {Array.isArray(record.componentFiles) && (
                        <span>
                          {record.componentFiles.length} file
                          {record.componentFiles.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {record.errorMessage && (
                      <p className="text-xs text-destructive mt-1 break-words">
                        {record.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
