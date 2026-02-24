"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ContextPanel } from "@/components/projects/context-panel";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import Link from "next/link";

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      {/* Project Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <Badge variant={project.type === "COMPONENT" ? "default" : "secondary"}>
                {project.type === "COMPONENT" ? "Component" : "Application"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {project.folderPath}
              {project.pegaServerUrl && ` · ${project.pegaServerUrl}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={includeContext ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeContext(!includeContext)}
          >
            Include Context
          </Button>
          <Button variant="outline" size="icon" onClick={() => setContextOpen(!contextOpen)}>
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-4">
        {/* Chat */}
        <div className={`flex-1 ${contextOpen ? "mr-4" : ""}`}>
          <ChatInterface projectId={projectId} includeContext={includeContext} />
        </div>

        {/* Context Panel */}
        {contextOpen && (
          <div className="w-80 shrink-0">
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
    </div>
  );
}
