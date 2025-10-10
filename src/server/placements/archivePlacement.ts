import { prisma } from "@/lib/prisma";
import { endOfTodayLocal } from "@/lib/dates";

export async function archivePlacement(opts: {
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
        supervisorId: true,
        status: true, 
        requiredHours: true, 
        endDate: true,
      },
    });
    
    if (!placement) throw new Error("Placement not found");
    if (placement.status === "ARCHIVED") throw new Error("Already archived");

    // Get approved hours within the transaction
    const approvedHoursAgg = await tx.timesheetEntry.aggregate({
      _sum: { hours: true },
      where: { 
        placementId, 
        facultyApprovedAt: { not: null } 
      },
    });
    
    const approved = Number(approvedHoursAgg._sum.hours || 0);
    const remaining = placement.requiredHours - approved;
    const eligible = remaining <= 0 && placement.endDate <= endOfTodayLocal();
    
    if (!eligible) throw new Error("Placement not eligible to archive");

    const updated = await tx.placement.update({
      where: { id: placementId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        supervisorId: null,
      },
    });

    // Check if student has other active placements
    const studentHasOtherActive = await tx.placement.findFirst({
      where: { 
        studentId: placement.studentId, 
        status: "ACTIVE" 
      },
      select: { id: true },
    }).then(Boolean);

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: "PLACEMENT_ARCHIVED",
        details: JSON.stringify({
          placementId: placement.id,
          priorStatus: placement.status,
          priorSupervisorId: placement.supervisorId,
          studentId: placement.studentId,
          siteId: placement.siteId,
        }),
        ipAddress: actorIp ?? undefined,
      },
    });

    return { placement: updated, studentHasOtherActive };
  });
}
