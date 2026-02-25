"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  FolderOpen,
  Lock,
  Globe,
  FileText,
  Calendar,
  User,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CreateFolderDialog } from "@/components/documents/create-folder-dialog";
import Link from "next/link";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdById: string;
  createdBy: { id: string; name: string | null; email: string };
  _count: { documents: number };
  createdAt: string;
}

type FilterType = "ALL" | "PUBLIC" | "PRIVATE" | "MINE";

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  async function fetchFolders() {
    try {
      const res = await fetch("/api/documents/folders");
      if (res.ok) {
        setFolders(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFolders();
  }, []);

  const filtered = useMemo(() => {
    return folders.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description || "").toLowerCase().includes(search.toLowerCase());
      let matchesFilter = true;
      if (filter === "PUBLIC") matchesFilter = f.visibility === "PUBLIC";
      else if (filter === "PRIVATE") matchesFilter = f.visibility === "PRIVATE";
      else if (filter === "MINE") matchesFilter = f.createdById === session?.user?.id;
      return matchesSearch && matchesFilter;
    });
  }, [folders, search, filter, session?.user?.id]);

  function handleCreated() {
    setDialogOpen(false);
    fetchFolders();
  }

  const publicCount = folders.filter((f) => f.visibility === "PUBLIC").length;
  const privateCount = folders.filter((f) => f.visibility === "PRIVATE").length;
  const myCount = folders.filter((f) => f.createdById === session?.user?.id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and share documents across projects
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* Stats bar */}
      {folders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold">{folders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Folders</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-primary">{publicCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Public</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-secondary">{privateCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Private</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {folders.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
            {([
              { key: "ALL" as FilterType, label: "All", count: folders.length },
              { key: "PUBLIC" as FilterType, label: "Public", count: publicCount },
              { key: "PRIVATE" as FilterType, label: "Private", count: privateCount },
              { key: "MINE" as FilterType, label: "Mine", count: myCount },
            ]).map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg text-xs ${filter === tab.key ? "shadow-sm" : ""}`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] opacity-70">{tab.count}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
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
      ) : folders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 rounded-xl border-dashed border-2 border-border/50">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/30">
              <FolderOpen className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold">No document folders yet</h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              Create your first folder to start organizing and sharing documents
            </p>
            <Button
              className="mt-5 rounded-xl shadow-md"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No matching folders</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((folder) => (
            <Link key={folder.id} href={`/documents/${folder.id}`}>
              <Card className="group relative overflow-hidden rounded-xl border-border/50 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold truncate pr-2">
                      {folder.name}
                    </CardTitle>
                    <Badge
                      variant={folder.visibility === "PUBLIC" ? "secondary" : "outline"}
                      className="rounded-full text-[10px] font-semibold uppercase tracking-wider px-2.5 shrink-0"
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
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {folder.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {folder._count.documents} doc{folder._count.documents !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {folder.createdBy.name || folder.createdBy.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateFolderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
