import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[projectId]/members/[memberId] — remove a member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  const { projectId, memberId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owners can remove members
  const currentMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!currentMember || currentMember.role !== "OWNER") {
    return NextResponse.json({ error: "Only project owners can remove members" }, { status: 403 });
  }

  // Prevent removing yourself if you're the last owner
  const target = await prisma.projectMember.findFirst({
    where: { projectId, userId: memberId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.userId === session.user.id) {
    // Check if there are other owners
    const otherOwners = await prisma.projectMember.count({
      where: { projectId, role: "OWNER", userId: { not: session.user.id } },
    });
    if (otherOwners === 0) {
      return NextResponse.json(
        { error: "Cannot remove yourself as the only owner" },
        { status: 400 }
      );
    }
  }

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId: memberId, projectId } },
  });

  return NextResponse.json({ success: true });
}

// PATCH /api/projects/[projectId]/members/[memberId] — update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  const { projectId, memberId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  if (!currentMember || currentMember.role !== "OWNER") {
    return NextResponse.json({ error: "Only project owners can change roles" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;

  if (!role || !["OWNER", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const member = await prisma.projectMember.update({
    where: { userId_projectId: { userId: memberId, projectId } },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json(member);
}
