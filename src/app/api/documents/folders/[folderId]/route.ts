import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccessFolder(folderId: string, userId: string) {
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: { accessGrants: { select: { userId: true } } },
  });
  if (!folder) return null;
  if (folder.visibility === "PUBLIC") return folder;
  if (folder.createdById === userId) return folder;
  if (folder.accessGrants.some((g) => g.userId === userId)) return folder;
  return null;
}

// GET /api/documents/folders/[folderId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = await canAccessFolder(folderId, session.user.id);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fullFolder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { createdAt: "desc" } },
      accessGrants: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { documents: true } },
    },
  });

  return NextResponse.json(fullFolder);
}

// PATCH /api/documents/folders/[folderId] — update folder (creator only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (folder.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.visibility !== undefined) {
    updateData.visibility = body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  }

  const updated = await prisma.documentFolder.update({
    where: { id: folderId },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { documents: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/documents/folders/[folderId] — delete folder (creator only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (folder.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.documentFolder.delete({ where: { id: folderId } });

  return NextResponse.json({ success: true });
}
