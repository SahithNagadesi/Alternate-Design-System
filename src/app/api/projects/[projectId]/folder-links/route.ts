import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId]/folder-links — list linked folders
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

  const links = await prisma.projectFolderLink.findMany({
    where: { projectId },
    include: {
      folder: {
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { documents: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

// POST /api/projects/[projectId]/folder-links — link a folder
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

  const body = await req.json();
  const { folderId } = body;

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  // Verify user can access the folder
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: { accessGrants: { select: { userId: true } } },
  });
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const hasAccess =
    folder.visibility === "PUBLIC" ||
    folder.createdById === userId ||
    folder.accessGrants.some((g) => g.userId === userId);

  if (!hasAccess) {
    return NextResponse.json({ error: "No access to this folder" }, { status: 403 });
  }

  // Check if already linked
  const existing = await prisma.projectFolderLink.findUnique({
    where: { projectId_folderId: { projectId, folderId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Folder already linked" }, { status: 400 });
  }

  const link = await prisma.projectFolderLink.create({
    data: { projectId, folderId },
    include: {
      folder: {
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { documents: true } },
        },
      },
    },
  });

  return NextResponse.json(link, { status: 201 });
}
