"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      let savedUserMessage: Message | null = null;
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
                savedUserMessage = data.message;
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
    <div className="flex h-full flex-col rounded-lg border">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && !sending ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Start a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Describe the Pega component or application you want to build
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
              />
            )}
            {sending && !streamingContent && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-2">
          {attachments.map((file, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {file.name}
              <button
                onClick={() => removeAttachment(i)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
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
          <Textarea
            ref={textareaRef}
            placeholder="Describe what you want to build..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="h-auto shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
          {includeContext && " · Context documents included"}
          {attachments.length > 0 && ` · ${attachments.length} file(s) attached`}
        </p>
      </div>
    </div>
  );
}
