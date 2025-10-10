import { prisma } from "@/lib/prisma";

export async function unarchivePlacement(opts: {
  placementId: string;
  actorUserId: string;
  actorIp?: string | null;
}) {
  const { placementId, actorUserId, actorIp } = opts;

  return await prisma.$transaction(async (tx) => {
    const placement = await tx.placement.findUnique({
      where: { id: placementId },
      select: {
        id: true,
        studentId: true,
        siteId: true,
        status: true,
        archivedAt: true,
      },
    });

    if (!placement) throw new Error("Placement not found");
    if (placement.status !== "ARCHIVED") throw new Error("Placement is not archived");

    // Restore to ACTIVE status (could also restore to COMPLETE based on business rules)
    const updated = await tx.placement.update({
      where: { id: placementId },
      data: {
        status: "ACTIVE",
        archivedAt: null,
      },
    });

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: "PLACEMENT_UNARCHIVED",
        details: JSON.stringify({
          placementId: placement.id,
          priorStatus: placement.status,
          newStatus: "ACTIVE",
          studentId: placement.studentId,
          siteId: placement.siteId,
        }),
        ipAddress: actorIp ?? undefined,
      },
    });

    return { placement: updated };
  });
}
