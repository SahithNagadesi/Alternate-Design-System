import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// GET /api/projects — list projects for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      _count: {
        select: { members: true, chatMessages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, type, pegaServerUrl, pegaUsername, pegaPassword, githubRepo, githubFolder, metadata } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  if (!["COMPONENT", "APPLICATION"].includes(type)) {
    return NextResponse.json({ error: "Invalid project type" }, { status: 400 });
  }

  // Validate APPLICATION metadata
  if (type === "APPLICATION" && metadata) {
    if (!metadata.pegaAppName || !metadata.frontendFramework) {
      return NextResponse.json(
        { error: "Pega Application Name and Frontend Framework are required for Application projects" },
        { status: 400 }
      );
    }
  }

  // Validate COMPONENT metadata
  if (type === "COMPONENT" && metadata) {
    if (!metadata.organizationName || !metadata.libraryName || !metadata.componentName) {
      return NextResponse.json(
        { error: "Organization Name, Library Name, and Component Name are required for Component projects" },
        { status: 400 }
      );
    }
    if (!metadata.componentType || !metadata.componentSubtype) {
      return NextResponse.json(
        { error: "Component Type and Subtype are required for Component projects" },
        { status: 400 }
      );
    }
    if (!["Field", "Template", "Widget"].includes(metadata.componentType)) {
      return NextResponse.json(
        { error: "Component Type must be Field, Template, or Widget" },
        { status: 400 }
      );
    }
  }

  // Build folder path based on type
  const folder = type === "COMPONENT" ? "Components" : "Applications";
  const safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  const folderPath = githubFolder
    ? `${githubFolder}/${safeName}`
    : `${folder}/${safeName}`;

  // Encrypt Pega credentials if provided
  let encryptedCreds: string | undefined;
  if (pegaUsername && pegaPassword) {
    encryptedCreds = encrypt(JSON.stringify({ username: pegaUsername, password: pegaPassword }));
  }

  const project = await prisma.project.create({
    data: {
      name,
      type,
      folderPath,
      pegaServerUrl: pegaServerUrl || null,
      pegaCredentials: encryptedCreds || null,
      githubRepo: githubRepo || null,
      githubFolder: githubFolder || null,
      metadata: metadata || undefined,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      _count: {
        select: { members: true, chatMessages: true },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
