import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents/folders — list visible folders
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Public folders + private folders user created or has access to
  const folders = await prisma.documentFolder.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        { createdById: userId },
        { accessGrants: { some: { userId } } },
      ],
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(folders);
}

// POST /api/documents/folders — create a folder
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, visibility } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const folder = await prisma.documentFolder.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      visibility: visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { documents: true } },
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
