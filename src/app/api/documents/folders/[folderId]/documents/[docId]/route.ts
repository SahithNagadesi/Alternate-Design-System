import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

// DELETE /api/documents/folders/[folderId]/documents/[docId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string; docId: string }> }
) {
  const { folderId, docId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify folder access
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: { accessGrants: { select: { userId: true } } },
  });
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const hasAccess =
    folder.visibility === "PUBLIC" ||
    folder.createdById === userId ||
    folder.accessGrants.some((g) => g.userId === userId);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document = await prisma.globalDocument.findUnique({
    where: { id: docId },
  });
  if (!document || document.folderId !== folderId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from Vercel Blob
  try {
    await del(document.blobUrl);
  } catch {
    // Blob may already be deleted
  }

  await prisma.globalDocument.delete({ where: { id: docId } });

  return NextResponse.json({ success: true });
}
