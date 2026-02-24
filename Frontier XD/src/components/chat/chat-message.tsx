"use client";

import { User, Bot, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

function CodeBlock({ className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match && !String(children).includes("\n");

  if (isInline) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>
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
    <div className="group relative my-3 overflow-hidden rounded-md border bg-muted/50">
      <div className="flex items-center justify-between border-b bg-muted px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{language || "code"}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3">
        <code className={cn("text-xs font-mono", className)} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "USER";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                a: ({ ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline" />
                ),
                table: ({ ...props }) => (
                  <div className="my-2 overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs" {...props} />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th className="border border-border bg-muted px-2 py-1 text-left font-medium" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="border border-border px-2 py-1" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p
          className={cn(
            "mt-1 text-xs",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
