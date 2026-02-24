import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

// PATCH /api/projects/[projectId]/documents/[docId] — toggle enabled
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
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
  const document = await prisma.contextDocument.update({
    where: { id: docId },
    data: { enabled: body.enabled },
  });

  return NextResponse.json(document);
}

// DELETE /api/projects/[projectId]/documents/[docId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
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

  const document = await prisma.contextDocument.findUnique({
    where: { id: docId },
  });

  if (document) {
    // Delete from Vercel Blob
    try {
      await del(document.blobUrl);
    } catch {
      // Blob may not exist, continue with DB deletion
    }

    await prisma.contextDocument.delete({ where: { id: docId } });
  }

  return NextResponse.json({ success: true });
}
