import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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

// GET /api/documents/folders/[folderId]/documents
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

  const documents = await prisma.globalDocument.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

// POST /api/documents/folders/[folderId]/documents — upload document
export async function POST(
  req: NextRequest,
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = await put(`documents/${folderId}/${file.name}`, file, {
    access: "public",
  });

  const document = await prisma.globalDocument.create({
    data: {
      folderId,
      name: file.name,
      filePath: `documents/${folderId}/${file.name}`,
      blobUrl: blob.url,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
