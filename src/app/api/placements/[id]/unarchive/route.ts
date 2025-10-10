import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unarchivePlacement } from "@/server/placements/unarchivePlacement";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can unarchive
    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const { id: placementId } = await params;
    
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    const result = await unarchivePlacement({
      placementId,
      actorUserId: session.user.id,
      actorIp: ip,
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error("Unarchive placement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unarchive failed" }, 
      { status: 400 }
    );
  }
}
