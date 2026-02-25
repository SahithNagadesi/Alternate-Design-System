import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

async function verifyMembership(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });
  return member;
}

// GET /api/projects/[projectId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await verifyMembership(projectId, session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      _count: {
        select: { chatMessages: true, contextDocuments: true },
      },
    },
  });

  return NextResponse.json(project);
}

// PATCH /api/projects/[projectId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await verifyMembership(projectId, session.user.id);
  if (!member || member.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, pegaServerUrl, pegaUsername, pegaPassword, metadata } = body;

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (pegaServerUrl !== undefined) updateData.pegaServerUrl = pegaServerUrl || null;
  if (pegaUsername && pegaPassword) {
    updateData.pegaCredentials = encrypt(
      JSON.stringify({ username: pegaUsername, password: pegaPassword })
    );
  }
  if (metadata !== undefined) updateData.metadata = metadata;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/[projectId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await verifyMembership(projectId, session.user.id);
  if (!member || member.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ success: true });
}
