"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Component, AppWindow, Calendar, Users, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  type: "COMPONENT" | "APPLICATION";
  createdAt: string;
  updatedAt: string;
  _count: { members: number; chatMessages: number };
}

type FilterType = "ALL" | "COMPONENT" | "APPLICATION";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "ALL" || p.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  function handleProjectCreated() {
    setDialogOpen(false);
    fetchProjects();
  }

  const componentCount = projects.filter((p) => p.type === "COMPONENT").length;
  const appCount = projects.filter((p) => p.type === "APPLICATION").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats bar */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Projects</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-primary">{componentCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Components</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-secondary">{appCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Applications</p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
            {([
              { key: "ALL" as FilterType, label: "All", count: projects.length },
              { key: "COMPONENT" as FilterType, label: "Components", count: componentCount },
              { key: "APPLICATION" as FilterType, label: "Applications", count: appCount },
            ]).map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg text-xs ${filter === tab.key ? "shadow-sm" : ""}`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {tab.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 rounded-xl border-dashed border-2 border-border/50">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/30">
              <Component className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              Create your first Pega component or application to get started
            </p>
            <Button className="mt-5 rounded-xl shadow-md" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No matching projects</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group relative overflow-hidden rounded-xl border-border/50 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                    <Badge
                      variant={project.type === "COMPONENT" ? "default" : "secondary"}
                      className="rounded-full text-[10px] font-semibold uppercase tracking-wider px-2.5"
                    >
                      {project.type === "COMPONENT" ? (
                        <Component className="mr-1 h-3 w-3" />
                      ) : (
                        <AppWindow className="mr-1 h-3 w-3" />
                      )}
                      {project.type === "COMPONENT" ? "Component" : "App"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project._count.members}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {project._count.chatMessages} message{project._count.chatMessages !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
