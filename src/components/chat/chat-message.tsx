"use client";

import { User, Copy, Check, Sparkles, FilePlus2, FilePenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FileOperation {
  action: string;
  path: string;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  fileAttachments?: FileOperation[] | null;
}

function CodeBlock({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"code"> & { className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match && !String(children).includes("\n");

  if (isInline) {
    return (
      <code
        className="rounded-md bg-primary/8 px-1.5 py-0.5 text-xs font-mono text-primary/90 dark:bg-primary/15"
        {...props}
      >
        {children}
      </code>
    );
  }

  const language = match ? match[1] : "";

  function handleCopy() {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border/40 bg-muted/20 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/50 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code
          className={cn("text-xs font-mono leading-relaxed", className)}
          {...props}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}

function FileOperationsBadges({ operations }: { operations: FileOperation[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {operations.map((op, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
            op.action === "created"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
          )}
        >
          {op.action === "created" ? (
            <FilePlus2 className="h-3 w-3" />
          ) : (
            <FilePenLine className="h-3 w-3" />
          )}
          {op.path}
        </span>
      ))}
    </div>
  );
}

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "USER";
  const fileOps = (message.fileAttachments as FileOperation[] | null) || [];

  return (
    <div className={cn("chat-fade-in flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
            : "border border-border/40 bg-gradient-to-br from-card to-muted/80 text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-tr-sm"
            : "border border-border/30 bg-card rounded-tl-sm",
          isStreaming && "streaming-pulse"
        )}
      >
        {/* File operation badges (only for assistant messages with file ops) */}
        {!isUser && fileOps.length > 0 && (
          <FileOperationsBadges operations={fileOps} />
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                a: ({ ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
                  />
                ),
                p: ({ ...props }) => (
                  <p className="mb-2.5 last:mb-0 leading-relaxed" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul
                    className="mb-2.5 ml-1 list-disc space-y-1 pl-4"
                    {...props}
                  />
                ),
                ol: ({ ...props }) => (
                  <ol
                    className="mb-2.5 ml-1 list-decimal space-y-1 pl-4"
                    {...props}
                  />
                ),
                li: ({ ...props }) => (
                  <li className="leading-relaxed" {...props} />
                ),
                h1: ({ ...props }) => (
                  <h1
                    className="mb-3 mt-4 text-lg font-bold first:mt-0"
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    className="mb-2.5 mt-3.5 text-base font-bold first:mt-0"
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    className="mb-2 mt-3 text-sm font-bold first:mt-0"
                    {...props}
                  />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="my-2 border-l-2 border-primary/30 pl-3 italic text-muted-foreground"
                    {...props}
                  />
                ),
                hr: () => <hr className="my-3 border-border/50" />,
                table: ({ ...props }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-border/40">
                    <table
                      className="min-w-full border-collapse text-xs"
                      {...props}
                    />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th
                    className="border-b border-border/40 bg-muted/40 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td
                    className="border-b border-border/20 px-3 py-2"
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p
          className={cn(
            "mt-2 text-[10px] tabular-nums",
            isUser
              ? "text-primary-foreground/40"
              : "text-muted-foreground/40"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
