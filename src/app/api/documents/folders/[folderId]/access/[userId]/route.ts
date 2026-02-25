import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/documents/folders/[folderId]/access/[userId] — revoke access
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string; userId: string }> }
) {
  const { folderId, userId } = await params;
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

  const grant = await prisma.folderAccess.findUnique({
    where: { folderId_userId: { folderId, userId } },
  });
  if (!grant) {
    return NextResponse.json({ error: "Access grant not found" }, { status: 404 });
  }

  await prisma.folderAccess.delete({
    where: { folderId_userId: { folderId, userId } },
  });

  return NextResponse.json({ success: true });
}
