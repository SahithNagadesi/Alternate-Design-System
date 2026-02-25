"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2, Paperclip, X, Sparkles, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/components/chat/chat-message";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  projectId: string;
  includeContext: boolean;
}

export function ChatInterface({ projectId, includeContext }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      toast.error("Failed to load chat history");
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleSend = useCallback(async () => {
    let content = input.trim();
    if (!content || sending) return;

    // If there are file attachments, read their content and append
    if (attachments.length > 0) {
      const fileTexts = await Promise.all(
        attachments.map(async (file) => {
          try {
            const text = await file.text();
            return `\n\n--- Attached File: ${file.name} ---\n${text}`;
          } catch {
            return `\n\n--- Attached File: ${file.name} (binary, ${file.type}) ---`;
          }
        })
      );
      content += fileTexts.join("");
    }

    setInput("");
    setAttachments([]);
    setSending(true);
    setStreamingContent("");

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userDisplay = input.trim() + (attachments.length > 0
      ? `\n\n[Attached: ${attachments.map(f => f.name).join(", ")}]`
      : "");
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "USER", content: userDisplay, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, includeContext }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "user_message") {
                // Replace temp message with saved one
                setMessages((prev) =>
                  prev.map((m) => (m.id === tempId ? data.message : m))
                );
              } else if (data.type === "delta") {
                fullContent += data.text;
                setStreamingContent(fullContent);
              } else if (data.type === "done") {
                setStreamingContent("");
                setMessages((prev) => [...prev, data.message]);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(input);
      setStreamingContent("");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, attachments, projectId, includeContext]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Messages Area — native scrollable div */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth px-4 py-5 sm:px-6"
      >
        {messages.length === 0 && !sending ? (
          <div className="flex h-full items-center justify-center">
            <div className="chat-fade-in text-center max-w-md mx-auto">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/40 shadow-inner">
                <MessageSquarePlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">Start a conversation</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Describe the Pega component or application you want to build.
                Attach files for context or enable project documents.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Create a DX API form", "Build a data table", "Design a dashboard"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-border/80 bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* Streaming AI response */}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: "streaming",
                  role: "ASSISTANT",
                  content: streamingContent,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            {sending && !streamingContent && (
              <div className="chat-fade-in flex items-center gap-3 pl-12">
                <div className="flex items-center gap-1.5 rounded-xl bg-muted/70 px-4 py-3">
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" style={{ animationDelay: "0.15s" }} />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border/50 bg-muted/30 px-4 py-2.5">
          {attachments.map((file, i) => (
            <Badge key={i} variant="secondary" className="gap-1.5 pr-1 rounded-full">
              <Paperclip className="h-3 w-3 opacity-50" />
              {file.name}
              <button
                onClick={() => removeAttachment(i)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Describe what you want to build..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[44px] max-h-[160px] resize-none rounded-xl border-border/60 bg-muted/30 pr-12 text-sm transition-colors focus:bg-background"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground/70">
            Enter to send &middot; Shift+Enter for new line
          </p>
          <div className="flex items-center gap-2">
            {attachments.length > 0 && (
              <span className="text-[11px] text-muted-foreground/70">
                {attachments.length} file{attachments.length > 1 ? "s" : ""} attached
              </span>
            )}
            {includeContext && (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary/70">
                <Sparkles className="h-3 w-3" />
                Context on
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
