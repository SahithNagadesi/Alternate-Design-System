import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents/folders/[folderId]/access — list access grants
export async function GET(
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

  const grants = await prisma.folderAccess.findMany({
    where: { folderId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(grants);
}

// POST /api/documents/folders/[folderId]/access — grant access by email
export async function POST(
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
  const { email } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.id === folder.createdById) {
    return NextResponse.json({ error: "Owner already has access" }, { status: 400 });
  }

  // Check if already has access
  const existing = await prisma.folderAccess.findUnique({
    where: { folderId_userId: { folderId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "User already has access" }, { status: 400 });
  }

  const grant = await prisma.folderAccess.create({
    data: { folderId, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(grant, { status: 201 });
}
