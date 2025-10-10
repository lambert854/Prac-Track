import { NextRequest, NextResponse } from 'next/server'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireFacultyOrAdmin()

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    const whereClause = siteId ? { siteId } : {}

    const learningContracts = await prisma.agencyLearningContract.findMany({
      where: whereClause,
      include: {
        site: true,
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(learningContracts)

  } catch (error) {
    console.error('Error fetching learning contracts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
