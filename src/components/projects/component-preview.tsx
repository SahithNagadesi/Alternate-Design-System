"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { RefreshCw, Loader2, Code, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSandpackMockFiles } from "@/lib/sandpack-mocks";

interface ComponentPreviewProps {
  projectId: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

function normalizeFilePath(path: string): string {
  // Sandpack requires paths starting with /
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized;
}

function detectEntryFile(files: Record<string, string>): string {
  const paths = Object.keys(files);

  // Prefer .stories.tsx files
  const storyFile = paths.find(
    (p) => p.endsWith(".stories.tsx") || p.endsWith(".stories.jsx")
  );
  if (storyFile) return storyFile;

  // Then index files
  const indexFile = paths.find(
    (p) =>
      p.endsWith("/index.tsx") ||
      p.endsWith("/index.jsx") ||
      p === "/index.tsx" ||
      p === "/index.jsx"
  );
  if (indexFile) return indexFile;

  // Then App files
  const appFile = paths.find(
    (p) =>
      p.endsWith("/App.tsx") ||
      p.endsWith("/App.jsx") ||
      p === "/App.tsx" ||
      p === "/App.jsx"
  );
  if (appFile) return appFile;

  // Fall back to first .tsx or .jsx file
  const firstComponent = paths.find(
    (p) =>
      (p.endsWith(".tsx") || p.endsWith(".jsx")) &&
      !p.endsWith(".d.ts") &&
      !p.includes(".stories.")
  );
  if (firstComponent) return firstComponent;

  return paths[0] || "/index.tsx";
}

export function ComponentPreview({ projectId }: ComponentPreviewProps) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch files");
      }
      const projectFiles: ProjectFile[] = await res.json();

      if (projectFiles.length === 0) {
        setError("No previewable files found. Create a component via chat first.");
        setFiles(null);
        return;
      }

      const sandpackFiles: Record<string, string> = {};
      for (const f of projectFiles) {
        sandpackFiles[normalizeFilePath(f.path)] = f.content;
      }
      setFiles(sandpackFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFiles(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (error || !files) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {error || "No files to preview"}
        </p>
        <Button variant="outline" size="sm" onClick={fetchFiles}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const entryFile = detectEntryFile(files);

  // Build Sandpack file map with project files
  const sandpackFileMap: Record<string, { code: string; hidden?: boolean }> = {};
  for (const [path, code] of Object.entries(files)) {
    sandpackFileMap[path] = { code };
  }

  // Merge in mock modules for Pega-specific dependencies
  const mockFiles = getSandpackMockFiles();
  Object.assign(sandpackFileMap, mockFiles);

  // Only show real project files in the visible files list (not mocks)
  const visibleFiles = Object.keys(files);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant={view === "preview" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setView("preview")}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
          <Button
            variant={view === "code" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setView("code")}
          >
            <Code className="h-3 w-3" />
            Code
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={fetchFiles}
          title="Refresh files from repository"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Sandpack */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SandpackProvider
          template="react-ts"
          files={sandpackFileMap}
          customSetup={{
            dependencies: {
              "styled-components": "^5.3.11",
              "@pega/cosmos-react-core": "^3.0.0",
              "@pega/pcore-pconnect-typedefs": "^1.0.0",
            },
          }}
          options={{
            activeFile: entryFile,
            visibleFiles,
          }}
          theme="auto"
        >
          <SandpackLayout style={{ height: "100%", border: "none" }}>
            {view === "preview" ? (
              <SandpackPreview
                style={{ height: "100%" }}
                showNavigator={false}
                showRefreshButton
              />
            ) : (
              <SandpackCodeEditor
                style={{ height: "100%" }}
                showLineNumbers
                showTabs
                readOnly
              />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
