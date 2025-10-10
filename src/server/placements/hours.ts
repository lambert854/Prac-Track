import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function getApprovedHoursSum(placementId: string): Promise<number> {
  const agg = await prisma.timesheetEntry.aggregate({
    _sum: { hours: true },
    where: { 
      placementId, 
      facultyApprovedAt: { not: null } 
    },
  });
  
  // Prisma Decimal → number (safe: hours should be small totals)
  const val = agg._sum.hours ?? new Decimal(0);
  return Number(val);
}
