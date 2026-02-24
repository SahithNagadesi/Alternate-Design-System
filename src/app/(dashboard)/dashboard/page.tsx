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
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search & Filter Bar */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {([
              { key: "ALL" as FilterType, label: "All", count: projects.length },
              { key: "COMPONENT" as FilterType, label: "Components", count: componentCount },
              { key: "APPLICATION" as FilterType, label: "Applications", count: appCount },
            ]).map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
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
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Component className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first project to get started
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
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
              <Card className="transition-colors hover:border-primary/50 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant={project.type === "COMPONENT" ? "default" : "secondary"}>
                      {project.type === "COMPONENT" ? (
                        <Component className="mr-1 h-3 w-3" />
                      ) : (
                        <AppWindow className="mr-1 h-3 w-3" />
                      )}
                      {project.type === "COMPONENT" ? "Component" : "Application"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project._count.members} member{project._count.members !== 1 ? "s" : ""}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {project._count.chatMessages} messages
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
