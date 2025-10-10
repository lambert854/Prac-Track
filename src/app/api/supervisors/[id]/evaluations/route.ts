import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'FACULTY'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: supervisorId } = await params

    // Get all evaluations for this supervisor
    const evaluations = await prisma.evaluationSubmission.findMany({
      where: {
        role: 'SUPERVISOR',
        evaluation: {
          placement: {
            supervisorId: supervisorId
          }
        }
      },
      include: {
        evaluation: {
          include: {
            placement: {
              include: {
                student: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include student name
    const transformedEvaluations = evaluations.map(evaluation => ({
      id: evaluation.id,
      type: evaluation.evaluation.type,
      status: evaluation.status,
      studentName: `${evaluation.evaluation.placement.student.firstName} ${evaluation.evaluation.placement.student.lastName}`,
      lastSavedAt: evaluation.lastSavedAt,
      lockedAt: evaluation.lockedAt,
      createdAt: evaluation.createdAt
    }))

    return NextResponse.json(transformedEvaluations)
  } catch (error) {
    console.error('Error fetching supervisor evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supervisor evaluations' },
      { status: 500 }
    )
  }
}
