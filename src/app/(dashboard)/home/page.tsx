"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Paintbrush,
  LayoutTemplate,
  Globe,
  ShieldCheck,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

const categories = [
  {
    title: "Design",
    icon: Paintbrush,
    color: "from-violet-500/20 to-violet-600/10",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-500",
    items: [
      { label: "Generate wireframes", prompt: "Generate wireframes for a Pega application UI" },
    ],
  },
  {
    title: "Re-create an application",
    icon: LayoutTemplate,
    color: "from-sky-500/20 to-sky-600/10",
    borderColor: "border-sky-500/30",
    iconColor: "text-sky-500",
    items: [
      {
        label: "Existing Pega",
        sub: "Cosmos, UI Kit",
        prompt: "Re-create an existing Pega Cosmos / UI Kit application as an Alternate Design System",
      },
      {
        label: "Legacy Modernization",
        sub: "video / images / document",
        prompt: "Modernize a legacy application by re-creating it with Pega DX APIs. I will provide reference screenshots/videos/documents.",
      },
    ],
  },
  {
    title: "Take inspiration from..",
    icon: Globe,
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-500",
    items: [
      {
        label: "Website link",
        prompt: "Take inspiration from a website to create a Pega UI component or application",
      },
    ],
  },
  {
    title: "Check Compliance",
    icon: ShieldCheck,
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-500",
    items: [
      { label: "Standards (HFI)", prompt: "Check compliance against HFI standards for a Pega UI component" },
      { label: "Accessibility", prompt: "Check accessibility compliance (WCAG) for a Pega UI component" },
    ],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function startProject(prompt: string) {
    if (!prompt.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.slice(0, 60).trim(),
          type: "COMPONENT",
          initialPrompt: prompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      toast.success("Project created");
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      startProject(query.trim());
    }
  }

  function handleItemClick(prompt: string) {
    setQuery(prompt);
    startProject(prompt);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-4xl space-y-10">
        {/* Branding */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              FRONTIER XD
            </span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Design &amp; Deliver at the Speed of Thought
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
            <div className="relative flex items-center rounded-2xl border-2 border-teal-500/50 bg-card shadow-lg">
              <Sparkles className="ml-4 h-5 w-5 text-teal-500 shrink-0" />
              <input
                type="text"
                placeholder="What do you want to build today?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={creating}
                className="flex-1 bg-transparent px-4 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!query.trim() || creating}
                className="mr-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white transition-all hover:bg-teal-600 disabled:opacity-30 disabled:hover:bg-teal-500 shrink-0"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          {creating && (
            <p className="mt-3 text-center text-sm text-muted-foreground animate-pulse">
              Creating your project...
            </p>
          )}
        </form>

        {/* Category Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className={`rounded-xl border ${cat.borderColor} bg-gradient-to-b ${cat.color} p-4 space-y-3`}
            >
              <div className="flex items-center gap-2">
                <cat.icon className={`h-4 w-4 ${cat.iconColor}`} />
                <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.prompt)}
                    disabled={creating}
                    className="group flex w-full items-start gap-2.5 rounded-lg bg-card/60 p-2.5 text-left transition-all hover:bg-card hover:shadow-md disabled:opacity-50"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                      {"sub" in item && item.sub && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Or use full dialog */}
        <div className="text-center">
          <button
            onClick={() => setDialogOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            or create a project with full configuration
          </button>
        </div>
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          setDialogOpen(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
