import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[projectId]/folder-links/[linkId] — unlink folder
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; linkId: string }> }
) {
  const { projectId, linkId } = await params;
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

  const link = await prisma.projectFolderLink.findUnique({
    where: { id: linkId },
  });
  if (!link || link.projectId !== projectId) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await prisma.projectFolderLink.delete({ where: { id: linkId } });

  return NextResponse.json({ success: true });
}
