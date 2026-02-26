import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getAnthropicApiKey,
  getAnthropicBaseUrl,
  getAnthropicModel,
} from "@/lib/get-api-key";
import { getGithubPat } from "@/lib/get-github-pat";
import {
  readFile,
  writeFile,
  listFiles,
  getDefaultBranch,
} from "@/lib/github-api";
import Anthropic from "@anthropic-ai/sdk";

const MAX_TOOL_ROUNDS = 6;
const MAX_READ_SIZE = 30_000; // 30 KB cap for file reads
const MAX_CONTEXT_DOC_SIZE = 4_000; // 4K chars per context document

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

const CONSTELLATION_ADDENDUM = `

IMPORTANT — Pega Constellation DX Component Builder (DXCB) Knowledge:

## Project Structure
A DXCB project is scaffolded with \`npx @pega/custom-dx-components create\` and uses tasks.config.json
for build configuration. Key directories:
- src/components/<Org_Lib_CompName>/ — component source
- src/components/<Org_Lib_CompName>/demo.stories.tsx — Storybook stories
- tasks.config.json — project-level config (organization, library, version, components list)

## Component File Structure
Each component folder contains:
- index.ts — re-exports the component
- config.json — metadata, properties, events, and type/subtype declarations
- <ComponentName>.tsx — main React component receiving PConnect
- <ComponentName>.styles.ts — styled-components with theme access
- demo.stories.tsx — Storybook story for local development

## Component Types and Subtypes
- **Field** subtypes: Text, TextInput, Integer, Decimal, Currency, Percentage, Boolean, Date, DateTime,
  TimeOfDay, Email, Phone, URL, Picklist, RadioButtons, TextArea, RichText, Checkbox, AutoComplete, Attachment
- **Template** subtypes: FORM, PAGE, DETAILS, DASHBOARD, TAB, LIST, DATAVIEW, OBJECTVIEW
- **Widget** subtypes: CASE, PAGE, PAGE & CASE

## config.json Schema
\`\`\`json
{
  "name": "Org_Lib_CompName",
  "label": "Component Label",
  "description": "...",
  "organization": "Org",
  "version": "1.0.0",
  "library": "Lib",
  "type": "Field",
  "subtype": "TextInput",
  "icon": "auto",
  "properties": [
    {
      "name": "label",
      "label": "Label",
      "format": "TEXT"
    },
    {
      "name": "value",
      "label": "Value",
      "format": "TEXT",
      "binding": true
    }
  ],
  "events": []
}
\`\`\`

## Property Formats
TEXT, BOOLEAN, INTEGER, DECIMAL, SELECT, GROUP, VISIBILITY (evaluates to show/hide),
DISABLED, READONLY, REQUIRED, DATE, DATETIME, TIME, RICHTEXT, URL, EMAIL, PHONE, CURRENCY,
PERCENTAGE, DATASOURCE, CASE, CLASSPATH

## Key Annotations in Property Values
- @P — property reference (e.g. @P .FirstName)
- @L — localization key
- @DATASOURCE — data source reference
- @CASE — case reference
- @E — expression
- @ENV — environment variable
- @W — widget reference

## PConnect API Methods
Essential PConnect methods available on \`getPConnect()\`:
- \`getValue(propertyRef)\` — read a case property (.PropertyName)
- \`setValue(propertyRef, value)\` — write a case property
- \`getConfigProps()\` — get all configured properties from config.json
- \`getChildren()\` — get child PConnect objects (for Templates)
- \`getComponentName()\` — returns the component type name
- \`getCaseInfo()\` — get current case information
- \`getDataObject(dataRef)\` — read data page/object
- \`getActionsApi()\` — access case actions (openWorkByHandle, openAssignment, etc.)
- \`getValidationApi()\` — field validation
- \`resolveConfigProps(props)\` — resolve @P, @L, @E annotations to actual values
- \`createComponent(config)\` — dynamically render a child component
- \`getContextName()\`, \`getTarget()\`, \`getPageReference()\`

## Key NPM Packages
- @pega/cosmos-react-core — base UI components (Button, Card, Input, Text, Icon, etc.)
- @pega/cosmos-react-work — work-specific (Assignment, CaseView, CaseSummary, etc.)
- @pega/cosmos-react-condition — conditional rendering
- @pega/cosmos-react-template — template components
- @pega/pcore-pconnect-typedefs — TypeScript types for PConnect
- @pega/custom-dx-components — CLI tool and build system

## Cosmos React Component Usage
Import from @pega/cosmos-react-core:
\`\`\`tsx
import { Input, Button, Card, Text, Icon, registerIcon } from '@pega/cosmos-react-core';
\`\`\`

## Styled-Components Pattern
\`\`\`tsx
import styled, { css } from 'styled-components';

export const StyledWrapper = styled.div(({ theme }) => css\\\`
  padding: \${theme.base.spacing};
  color: \${theme.base.palette['primary-foreground']};
  border: 1px solid \${theme.base.colors['border']};
\\\`);
\`\`\`

## Pega Platform Compatibility
- Pega '25 — DXCB 25.x, library mode default
- Pega 24.2 — DXCB 24.2.x
- Pega 24.1 — DXCB 24.1.x
- Pega 23.1 — DXCB 23.1.x
- Pega 8.8 — DXCB 23.1.x (backward compatible)

## Best Practices
- Always use PConnect for data binding; never hardcode case data
- Use Cosmos React components for visual consistency with Constellation
- Declare all user-facing properties in config.json with proper formats
- Handle loading, error, and empty states gracefully
- Use Pega design tokens from theme for colors, spacing, typography
- For Fields: focus on value binding and validation
- For Templates: render children via getPConnect().getChildren()
- For Widgets: self-contained UI with own data fetching
- Use \`resolveConfigProps()\` to handle dynamic @P/@L/@E values
- Write demo.stories.tsx for every component for local Storybook testing
`;

const STORYBOOK_ADDENDUM = `

IMPORTANT — Storybook Story Generation:
When you create or update a React component for this project, ALWAYS also generate a companion Storybook story file.

Rules for story files:
- Use Component Story Format 3 (CSF3) with TypeScript.
- Name the story file the same as the component with a .stories.tsx suffix (e.g. Button.tsx → Button.stories.tsx).
- Each story file must be self-contained: only import React and the component itself. Do NOT import external design tokens, theme providers, or third-party libraries in stories.
- Export a default meta object with title (use "Components/<ComponentName>") and component reference.
- Export at least a "Default" story and, where appropriate, additional variants (e.g. Primary, Disabled, WithIcon).
- Include args/argTypes for the component's main props so they are controllable in Storybook.
- Wrap the component in minimal inline styles or a plain <div> if it needs layout context.
- Write the story file using the write_file tool just like any other code file.

Example skeleton:
\`\`\`tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "./MyComponent";

const meta: Meta<typeof MyComponent> = {
  title: "Components/MyComponent",
  component: MyComponent,
  argTypes: { label: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = { args: { label: "Hello" } };
\`\`\`
`;

const TOOLS_ADDENDUM = `

You have access to tools that let you directly create, read, and modify files in the project's GitHub repository.

IMPORTANT — When the user asks you to create, write, build, or modify any code:
- ALWAYS use the write_file tool to create or update files in the repository. Do NOT just show code in chat without also writing it to a file.
- Use read_file to check existing file contents before making changes.
- Use list_files to understand the current project structure.
- File paths are relative to the project folder (e.g. "src/components/Button.tsx" or "package.json").
- Always write complete, working files.
- You can create multiple files in sequence for a complete implementation.
- After making all file changes, briefly summarize what you created or modified.

When the user only asks questions or wants explanations (no file changes needed), respond normally in text.`;

function getFileTools(): Anthropic.Tool[] {
  return [
    {
      name: "read_file",
      description:
        "Read the contents of a file from the project's GitHub repository. Returns the file content as text.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to the project folder, e.g. 'src/components/Button.tsx'",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description:
        "Create a new file or overwrite an existing file in the project's GitHub repository. The file is committed immediately.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description: "File path relative to the project folder",
          },
          content: {
            type: "string",
            description: "The complete file content to write",
          },
          commit_message: {
            type: "string",
            description: "Short Git commit message describing the change",
          },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "list_files",
      description:
        "List files and sub-directories inside a directory of the project's GitHub repository.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description:
              "Directory path relative to the project folder. Use empty string or omit for project root.",
          },
        },
        required: [],
      },
    },
  ];
}

function buildApplicationContext(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "";

  const framework = metadata.frontendFramework === "Other"
    ? (metadata.frontendFrameworkOther as string) || "Unknown"
    : (metadata.frontendFramework as string) || "Not specified";
  const pegaApp = (metadata.pegaAppName as string) || "Not specified";
  const caseTypes = (metadata.caseTypes as string) || "Not specified";
  const dxVersion = (metadata.dxApiVersion as string) || "24.1";
  const authMethod = (metadata.dxApiAuthMethod as string) || "Basic";
  const endpoints = (metadata.dxApiEndpoints as string) || "";

  let ctx = `

IMPORTANT — Alternate Design System / Application Context:
This project is an Alternate Design System application using Pega as backend via DX APIs.

- Frontend Framework: ${framework}
- Pega Application: ${pegaApp}
- Case Types: ${caseTypes}
- DX API Version: ${dxVersion}
- Authentication Method: ${authMethod}`;

  if (endpoints) {
    ctx += `\n- Custom Endpoints:\n${endpoints}`;
  }

  ctx += `

DX API Integration Guidelines:
- Use Pega DX API v${dxVersion} endpoints for all data operations.
- Base URL pattern: {serverUrl}/prweb/api/application/v${dxVersion}/
- Key endpoints: cases, data_views, assignments, casetypes, pages.
- Authentication: ${authMethod === "OAuth 2.0"
    ? "Use OAuth 2.0 token flow. Obtain tokens from the Pega authorization server and include as Bearer token."
    : "Use HTTP Basic authentication with base64-encoded credentials in the Authorization header."}
- Always handle API errors gracefully with proper error states in the UI.
- Use the case types (${caseTypes}) when creating new work items or querying cases.
- Implement proper CORS handling when connecting from ${framework} frontend to Pega server.`;

  return ctx;
}

function buildComponentContext(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "";

  const org = (metadata.organizationName as string) || "Not specified";
  const lib = (metadata.libraryName as string) || "Not specified";
  const comp = (metadata.componentName as string) || "Not specified";
  const version = (metadata.componentVersion as string) || "01.01.01";
  const compType = (metadata.componentType as string) || "Field";
  const compSubtype = (metadata.componentSubtype as string) || "TextInput";
  const dxcb = (metadata.dxcbVersion as string) || "25.1.10";
  const platform = (metadata.pegaPlatformVersion as string) || "25";
  const libMode = metadata.libraryMode !== false;
  const ruleset = (metadata.rulesetName as string) || "";
  const rulesetVer = (metadata.rulesetVersion as string) || "";
  const oauth = (metadata.oauthGrantType as string) || "";
  const clientIdVal = (metadata.clientId as string) || "";
  const description = (metadata.projectDescription as string) || "";

  let ctx = `

IMPORTANT — Component Project Context:
- Organization: ${org}
- Library: ${lib}
- Component Name: ${comp}
- Full Key: ${org}_${lib}_${comp}
- Version: ${version}
- Type: ${compType}
- Subtype: ${compSubtype}
- DXCB Version: ${dxcb}
- Pega Platform: ${platform}
- Library Mode: ${libMode ? "Yes" : "No"}`;

  if (description) ctx += `\n- Description: ${description}`;
  if (ruleset) ctx += `\n- Ruleset: ${ruleset}${rulesetVer ? ` v${rulesetVer}` : ""}`;
  if (oauth) ctx += `\n- OAuth Grant Type: ${oauth}`;
  if (clientIdVal) ctx += `\n- Client ID: ${clientIdVal}`;

  // Type-specific guidance
  if (compType === "Field") {
    ctx += `

Field Component Guidance:
- Focus on value binding: use getPConnect().getValue('.PropertyName') and setValue()
- Implement proper validation via getValidationApi()
- Subtype "${compSubtype}" should match the expected input/display behavior
- Declare a "value" property with binding:true in config.json
- Handle readOnly, disabled, required states from PConnect`;
  } else if (compType === "Template") {
    ctx += `

Template Component Guidance:
- Render child components via getPConnect().getChildren()
- Use createComponent() to instantiate each child PConnect
- Subtype "${compSubtype}" defines the layout pattern
- Templates control layout and flow, not individual field behavior
- Handle regions/slots for child placement`;
  } else if (compType === "Widget") {
    ctx += `

Widget Component Guidance:
- Self-contained UI component with its own data fetching
- Subtype "${compSubtype}" — ${compSubtype === "CASE" ? "operates within a case context" : compSubtype === "PAGE" ? "standalone page-level widget" : "supports both page and case contexts"}
- Can use getActionsApi() for navigation and case operations
- May manage its own state independently of parent templates`;
  }

  return ctx;
}

interface FileOperation {
  action: string;
  path: string;
}

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  pat: string,
  repo: string,
  projectFolder: string,
  branch: string
): Promise<{ result: string; operation?: FileOperation }> {
  const relativePath = (input.path as string) || "";
  const fullPath = relativePath
    ? `${projectFolder}/${relativePath}`.replace(/\/\//g, "/")
    : projectFolder;

  switch (toolName) {
    case "read_file": {
      const { content } = await readFile(pat, repo, fullPath, branch);
      const truncated =
        content.length > MAX_READ_SIZE
          ? content.slice(0, MAX_READ_SIZE) +
            "\n\n... (truncated, file too large)"
          : content;
      return { result: truncated };
    }

    case "write_file": {
      const fileContent = input.content as string;
      const commitMsg =
        (input.commit_message as string) ||
        `Update ${relativePath} via Frontier XD`;
      const { action } = await writeFile(
        pat,
        repo,
        fullPath,
        fileContent,
        commitMsg,
        branch
      );
      return {
        result: `Successfully ${action} file: ${relativePath}`,
        operation: { action, path: relativePath },
      };
    }

    case "list_files": {
      const items = await listFiles(pat, repo, fullPath, branch);
      if (items.length === 0)
        return { result: "(empty or non-existent directory)" };
      const listing = items
        .map(
          (f) =>
            `[${f.type}] ${f.name}${f.type === "file" ? ` (${f.size} bytes)` : ""}`
        )
        .join("\n");
      return { result: listing };
    }

    default:
      return { result: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/chat — chat history
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/chat — send message (streaming + tool use)
// ---------------------------------------------------------------------------
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

  const rateLimit = checkRateLimit(`chat:${session.user.id}`, {
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many requests. Please wait before sending another message.",
      },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { content, includeContext } = body;

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  // Save user message
  const userMessage = await prisma.chatMessage.create({
    data: { projectId, role: "USER", content },
  });

  // Project info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, type: true, folderPath: true, githubRepo: true, metadata: true },
  });

  // Context documents (project-level + linked folders)
  let contextText = "";
  if (includeContext) {
    // Fetch project-level context documents
    const docs = await prisma.contextDocument.findMany({
      where: { projectId, enabled: true },
    });

    // Fetch linked folder documents
    const folderLinks = await prisma.projectFolderLink.findMany({
      where: { projectId },
      include: {
        folder: {
          include: {
            documents: true,
          },
        },
      },
    });

    const allDocEntries: { label: string; blobUrl: string; mimeType: string }[] = [];

    // Add project-level docs
    for (const d of docs) {
      allDocEntries.push({ label: d.name, blobUrl: d.blobUrl, mimeType: d.mimeType });
    }

    // Add linked folder docs
    for (const link of folderLinks) {
      for (const d of link.folder.documents) {
        allDocEntries.push({
          label: `${link.folder.name}/${d.name}`,
          blobUrl: d.blobUrl,
          mimeType: d.mimeType,
        });
      }
    }

    if (allDocEntries.length > 0) {
      const docContents = await Promise.all(
        allDocEntries.map(async (d) => {
          if (
            d.mimeType.startsWith("text/") ||
            d.mimeType === "application/json" ||
            d.mimeType === "application/javascript" ||
            d.mimeType === "application/xml"
          ) {
            try {
              const res = await fetch(d.blobUrl);
              let text = await res.text();
              if (text.length > MAX_CONTEXT_DOC_SIZE) {
                text = text.slice(0, MAX_CONTEXT_DOC_SIZE) + "\n... (truncated)";
              }
              return `[${d.label}]:\n${text}`;
            } catch {
              return `[${d.label}]: (could not read content)`;
            }
          }
          return `[${d.label}]: (binary file - ${d.mimeType})`;
        })
      );
      contextText =
        "\n\n--- Context Documents ---\n" + docContents.join("\n\n");
    }
  }

  // Conversation history (last 10 messages to reduce token cost)
  const history = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  history.reverse();

  const chatMessages: Anthropic.MessageParam[] = history
    .filter((m) => m.id !== userMessage.id)
    .map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  const currentContent = contextText ? `${content}\n${contextText}` : content;
  chatMessages.push({ role: "user", content: currentContent });

  const projectContext = project
    ? `\nProject: "${project.name}" (${project.type === "COMPONENT" ? "Pega Constellation Custom Component" : "Alternate Design System"})\nFolder: ${project.folderPath}`
    : "";

  // Anthropic config
  let apiKey: string | null;
  let baseURL: string | undefined;
  let model: string;
  try {
    [apiKey, baseURL, model] = await Promise.all([
      getAnthropicApiKey(),
      getAnthropicBaseUrl(),
      getAnthropicModel(),
    ]);
  } catch (err) {
    console.error("Failed to retrieve Anthropic settings:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: `Failed to read API settings: ${message}. Please check Admin Settings or ENCRYPTION_KEY.`,
      },
      { status: 500 }
    );
  }
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Anthropic API key is not configured. Please ask an admin to set it in Settings.",
      },
      { status: 503 }
    );
  }

  const anthropic = new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  // GitHub tool availability
  let githubPat: string | null = null;
  const githubRepo = project?.githubRepo || null;
  let defaultBranch = "main";
  const projectFolder = project?.folderPath || "";

  if (githubRepo) {
    try {
      githubPat = await getGithubPat();
      if (githubPat) {
        defaultBranch = await getDefaultBranch(githubPat, githubRepo);
      }
    } catch (err) {
      console.error("GitHub PAT error:", err);
      githubPat = null;
    }
  }

  const hasGithubTools = !!(githubPat && githubRepo);

  // Dynamic max_tokens: short questions get fewer tokens, code generation gets full budget
  const isCodeRequest = /\b(create|build|write|generate|implement|add|make|update|modify|refactor|fix)\b/i.test(content) || content.length > 200;
  const maxTokens = isCodeRequest ? 8192 : 2048;

  const constellationAddendum =
    project?.type === "COMPONENT" ? CONSTELLATION_ADDENDUM : "";
  const componentAddendum =
    project?.type === "COMPONENT"
      ? buildComponentContext(project.metadata as Record<string, unknown> | null)
      : "";
  const storybookAddendum =
    hasGithubTools && project?.type === "COMPONENT" ? STORYBOOK_ADDENDUM : "";
  const applicationAddendum =
    project?.type === "APPLICATION"
      ? buildApplicationContext(project.metadata as Record<string, unknown> | null)
      : "";
  const systemPrompt =
    SYSTEM_PROMPT + projectContext + constellationAddendum + componentAddendum + applicationAddendum + (hasGithubTools ? TOOLS_ADDENDUM : "") + storybookAddendum;

  const tools = hasGithubTools ? getFileTools() : undefined;

  // Helper: call the Anthropic API. Tries streaming first; if the provider
  // returns a permission / auth error we retry with non-streaming (some
  // proxies & Bedrock vending machines don't support stream:true or tools).
  async function callAnthropic(
    msgs: Anthropic.MessageParam[],
    useTools: boolean,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
  ): Promise<{ finalMsg: Anthropic.Message; streamed: boolean }> {
    const reqTools = useTools && tools ? tools : undefined;

    // --- Attempt 1: streaming ---
    try {
      const response = anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: msgs,
        ...(reqTools ? { tools: reqTools } : {}),
      });

      let gotData = false;
      for await (const event of response) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          gotData = true;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`
            )
          );
        }
      }

      const finalMsg = await response.finalMessage();
      return { finalMsg, streamed: true };
    } catch (streamErr) {
      // If the error is permission/auth related, fall back to non-streaming.
      // Otherwise rethrow so the outer handler deals with it.
      const isRetryable =
        streamErr instanceof Anthropic.PermissionDeniedError ||
        streamErr instanceof Anthropic.APIError &&
          (streamErr.status === 403 || streamErr.status === 400);

      if (!isRetryable) throw streamErr;

      console.warn(
        "Streaming request failed, retrying without stream/tools:",
        streamErr instanceof Error ? streamErr.message : streamErr
      );
    }

    // --- Attempt 2: non-streaming, without tools ---
    const finalMsg = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: msgs,
    });

    // Emit the full text at once as a delta so the client still works
    for (const block of finalMsg.content) {
      if (block.type === "text" && block.text) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "delta", text: block.text })}\n\n`
          )
        );
      }
    }

    return { finalMsg, streamed: false };
  }

  try {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        const fileOps: FileOperation[] = [];
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        try {
          // Confirm saved user message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "user_message", message: userMessage })}\n\n`
            )
          );

          let loopMessages: Anthropic.MessageParam[] = [...chatMessages];
          let round = 0;
          let toolsDisabled = false;

          while (round < MAX_TOOL_ROUNDS) {
            round++;

            const { finalMsg, streamed } = await callAnthropic(
              loopMessages,
              hasGithubTools && !toolsDisabled,
              controller,
              encoder,
            );

            // If the fallback kicked in, tools aren't available for this session
            if (!streamed) toolsDisabled = true;

            // Track token usage
            if (finalMsg.usage) {
              totalInputTokens += finalMsg.usage.input_tokens;
              totalOutputTokens += finalMsg.usage.output_tokens;
            }

            // Accumulate text content from the final message
            for (const block of finalMsg.content) {
              if (block.type === "text") {
                // Only add if we didn't already stream it (non-streamed case
                // already emitted deltas in callAnthropic, but we still need
                // fullContent for DB persistence)
                if (!streamed) {
                  fullContent += block.text;
                }
              }
            }
            // For streamed responses, accumulate from the deltas we already sent
            if (streamed) {
              for (const block of finalMsg.content) {
                if (block.type === "text") {
                  fullContent += block.text;
                }
              }
            }

            if (finalMsg.stop_reason !== "tool_use" || toolsDisabled || !hasGithubTools) {
              break;
            }

            // Collect tool_use blocks
            const toolBlocks = finalMsg.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
            );
            if (toolBlocks.length === 0) break;

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of toolBlocks) {
              const input = block.input as Record<string, unknown>;

              // Notify client: tool starting
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_start",
                    tool: block.name,
                    path: input.path || "",
                  })}\n\n`
                )
              );

              try {
                const { result, operation } = await executeTool(
                  block.name,
                  input,
                  githubPat!,
                  githubRepo!,
                  projectFolder,
                  defaultBranch
                );

                if (operation) fileOps.push(operation);

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: result,
                });

                // Notify client: tool completed
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_done",
                      tool: block.name,
                      path: input.path || "",
                      operation,
                    })}\n\n`
                  )
                );
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : String(err);
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Error: ${errMsg}`,
                  is_error: true,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_error",
                      tool: block.name,
                      path: input.path || "",
                      error: errMsg,
                    })}\n\n`
                  )
                );
              }
            }

            // Feed assistant response + tool results back for the next round
            loopMessages = [
              ...loopMessages,
              { role: "assistant", content: finalMsg.content },
              { role: "user", content: toolResults },
            ];
          }

          // Persist the final assistant message
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              projectId,
              role: "ASSISTANT",
              content: fullContent,
              fileAttachments:
                fileOps.length > 0
                  ? JSON.parse(JSON.stringify(fileOps))
                  : undefined,
            },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                message: assistantMessage,
                fileOperations: fileOps,
                usage: {
                  inputTokens: totalInputTokens,
                  outputTokens: totalOutputTokens,
                  totalTokens: totalInputTokens + totalOutputTokens,
                },
              })}\n\n`
            )
          );
        } catch (err: unknown) {
          console.error("Chat API error:", err);

          let errorMsg = "Failed to get AI response";
          if (err instanceof Anthropic.AuthenticationError) {
            errorMsg =
              "Invalid API key. Please check the key in Admin Settings.";
          } else if (err instanceof Anthropic.RateLimitError) {
            errorMsg =
              "API rate limit reached. Please wait a moment and try again.";
          } else if (err instanceof Anthropic.NotFoundError) {
            errorMsg =
              "AI model not found. The configured model may be unavailable — check model name in Admin Settings.";
          } else if (err instanceof Anthropic.PermissionDeniedError) {
            errorMsg =
              "API permission denied. The API key may lack access to the configured model or features. Check Admin Settings.";
          } else if (err instanceof Anthropic.APIError) {
            errorMsg = `API error (${err.status}): ${err.message}`;
          } else if (err instanceof Error) {
            errorMsg = `AI error: ${err.message}`;
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`
            )
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
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Failed to get AI response. Please check API configuration." },
      { status: 500 }
    );
  }
}
