import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { archivePlacement } from "@/server/placements/archivePlacement";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;
    if (!["FACULTY", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: placementId } = await params;
    
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    const result = await archivePlacement({
      placementId,
      actorUserId: session.user.id,
      actorIp: ip,
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error("Archive placement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archive failed" }, 
      { status: 400 }
    );
  }
}
