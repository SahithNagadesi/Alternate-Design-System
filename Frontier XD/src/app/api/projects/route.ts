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
  const { name, type, pegaServerUrl, pegaUsername, pegaPassword } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  if (!["COMPONENT", "APPLICATION"].includes(type)) {
    return NextResponse.json({ error: "Invalid project type" }, { status: 400 });
  }

  // Build folder path based on type
  const folder = type === "COMPONENT" ? "Components" : "Applications";
  const safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  const folderPath = `${folder}/${safeName}`;

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
