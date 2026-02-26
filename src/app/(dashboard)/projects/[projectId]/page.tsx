"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Settings, FolderOpen, BookOpen, Eye, Upload, Hammer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ContextPanel } from "@/components/projects/context-panel";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { PublishDialog } from "@/components/projects/publish-dialog";
import type { ApplicationMetadata, ComponentMetadata } from "@/types/project-metadata";
import Link from "next/link";

const ComponentPreview = dynamic(
  () =>
    import("@/components/projects/component-preview").then(
      (mod) => mod.ComponentPreview
    ),
  { ssr: false }
);

interface Project {
  id: string;
  name: string;
  type: "COMPONENT" | "APPLICATION";
  pegaServerUrl: string | null;
  folderPath: string;
  githubRepo?: string | null;
  githubFolder?: string | null;
  metadata?: ApplicationMetadata | ComponentMetadata | null;
  members: Array<{
    role: string;
    user: { id: string; name: string; email: string };
  }>;
  _count: { chatMessages: number; contextDocuments: number };
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [scaffoldLoading, setScaffoldLoading] = useState(false);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setProject(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function handleScaffold() {
    if (!project) return;
    setScaffoldLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/scaffold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite: false }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to scaffold project");
      }
      const data = await res.json();
      alert(
        `Scaffold complete!\n\nCreated: ${data.created} files\nSkipped: ${data.skipped} files\n\nFiles:\n${data.files.join("\n")}`
      );
    } catch (error: any) {
      alert(`Scaffold failed: ${error.message}`);
    } finally {
      setScaffoldLoading(false);
    }
  }

  function getStackBlitzUrl() {
    if (!project?.githubRepo || project.type !== "APPLICATION") return null;

    // githubRepo format from scaffold route: "owner/repo" (not full URL)
    const folder = project.folderPath;
    const branch = "main"; // Use default branch

    return `https://stackblitz.com/github/${project.githubRepo}/tree/${branch}/${folder}`;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading project...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isComponent = project.type === "COMPONENT";

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Project Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight">{project.name}</h1>
              <Badge
                variant={isComponent ? "default" : "secondary"}
                className="rounded-full text-[10px] font-semibold uppercase tracking-wider px-2.5"
              >
                {isComponent ? "Constellation Component" : "Application"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {project.folderPath}
              {project.pegaServerUrl && (
                <span className="before:content-['_·_']">{project.pegaServerUrl}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Component-specific buttons */}
          {isComponent && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8"
                onClick={handleScaffold}
                disabled={scaffoldLoading}
              >
                {scaffoldLoading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Hammer className="h-3.5 w-3.5" />
                )}
                Scaffold
              </Button>
              <Button
                variant={previewOpen ? "default" : "outline"}
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8"
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8"
                onClick={() => setPublishOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Publish
              </Button>
            </>
          )}

          {/* Application-specific buttons */}
          {!isComponent && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8"
                onClick={handleScaffold}
                disabled={scaffoldLoading}
              >
                {scaffoldLoading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Hammer className="h-3.5 w-3.5" />
                )}
                Scaffold
              </Button>
              {getStackBlitzUrl() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-1.5 text-xs font-medium h-8"
                  onClick={() => window.open(getStackBlitzUrl()!, "_blank")}
                >
                  <Play className="h-3.5 w-3.5" />
                  Run App
                </Button>
              )}
              <Button
                variant={previewOpen ? "default" : "outline"}
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8"
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
            </>
          )}

          {/* Common buttons */}
          <Button
            variant={includeContext ? "default" : "outline"}
            size="sm"
            className="rounded-lg gap-1.5 text-xs font-medium h-8"
            onClick={() => setIncludeContext(!includeContext)}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Context
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-lg h-8 w-8"
            onClick={() => setContextOpen(!contextOpen)}
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-lg h-8 w-8"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Chat */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <ChatInterface projectId={projectId} includeContext={includeContext} />
        </div>

        {/* Preview Panel (both Component and Application projects) */}
        {previewOpen && (
          <div className="w-[480px] shrink-0 chat-fade-in">
            <ComponentPreview projectId={projectId} />
          </div>
        )}

        {/* Context Panel */}
        {contextOpen && (
          <div className="w-80 shrink-0 chat-fade-in">
            <ContextPanel projectId={projectId} />
          </div>
        )}
      </div>

      <ProjectSettingsDialog
        project={project}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUpdated={fetchProject}
      />

      {isComponent && (
        <PublishDialog
          project={project}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      )}
    </div>
  );
}
