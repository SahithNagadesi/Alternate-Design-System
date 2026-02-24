import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Frontier XD, an AI assistant specialized in creating Pega UI components and Alternate Design Systems.

Your expertise includes:
- Pega DX API integration and usage
- Creating custom Pega UI components (React-based)
- Building Alternate Design Systems that connect to Pega via DX APIs
- Pega Constellation architecture and design patterns
- HTML, CSS, JavaScript, TypeScript, React for Pega UI development

When generating code:
- Follow Pega best practices and conventions
- Use Pega DX API endpoints correctly
- Create clean, maintainable, and well-structured code
- Provide clear explanations of the code and architecture decisions
- Consider responsive design and accessibility
- Use markdown formatting with code blocks for all code snippets

When the user uploads files, analyze them and incorporate the context into your responses.
When context documents are provided, use them as reference material for your answers.`;

// GET /api/projects/[projectId]/chat — get chat history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/projects/[projectId]/chat — send a message (streaming)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Rate limit: 20 messages per minute per user
  const rateLimit = checkRateLimit(`chat:${session.user.id}`, {
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another message." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { content, includeContext } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  // Save user message
  const userMessage = await prisma.chatMessage.create({
    data: {
      projectId,
      role: "USER",
      content,
    },
  });

  // Get project info for context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, type: true, folderPath: true },
  });

  // Build context from enabled documents if requested
  let contextText = "";
  if (includeContext) {
    const docs = await prisma.contextDocument.findMany({
      where: { projectId, enabled: true },
    });
    if (docs.length > 0) {
      // Fetch actual document content for text-based files
      const docContents = await Promise.all(
        docs.map(async (d) => {
          if (d.mimeType.startsWith("text/") || d.mimeType === "application/json" || d.mimeType === "application/javascript" || d.mimeType === "application/xml") {
            try {
              const res = await fetch(d.blobUrl);
              const text = await res.text();
              return `[${d.name}]:\n${text}`;
            } catch {
              return `[${d.name}]: (could not read content)`;
            }
          }
          return `[${d.name}]: (binary file - ${d.mimeType})`;
        })
      );
      contextText = "\n\n--- Context Documents ---\n" + docContents.join("\n\n");
    }
  }

  // Get recent conversation history (last 20 messages)
  const history = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages: Array<{ role: "user" | "assistant"; content: string }> = history
    .filter((m) => m.id !== userMessage.id)
    .map((m) => ({
      role: m.role === "USER" ? "user" as const : "assistant" as const,
      content: m.content,
    }));

  // Add current message with optional context
  const currentContent = contextText
    ? `${content}\n${contextText}`
    : content;
  messages.push({ role: "user", content: currentContent });

  const projectContext = project
    ? `\nProject: "${project.name}" (${project.type === "COMPONENT" ? "Custom Component" : "Alternate Design System"})\nFolder: ${project.folderPath}`
    : "";

  try {
    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          // Send user message ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "user_message", message: userMessage })}\n\n`)
          );

          const response = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: SYSTEM_PROMPT + projectContext,
            messages,
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullContent += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`)
              );
            }
          }

          // Save assistant message to DB
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              projectId,
              role: "ASSISTANT",
              content: fullContent,
            },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", message: assistantMessage })}\n\n`)
          );
        } catch (err) {
          console.error("Claude API streaming error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Failed to get AI response" })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json(
      { error: "Failed to get AI response. Please check API configuration." },
      { status: 500 }
    );
  }
}
