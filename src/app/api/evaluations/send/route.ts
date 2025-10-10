import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendEvaluationsSchema = z.object({
  type: z.enum(['MIDTERM', 'FINAL']),
  studentMsg: z.string().optional(),
  supervisorMsg: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only faculty and admin can send evaluations
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = sendEvaluationsSchema.parse(body)

    // Find all ACTIVE placements for this faculty member
    const placements = await prisma.placement.findMany({
      where: {
        facultyId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        supervisor: true,
      },
    })

    let studentsCreated = 0
    let studentsReused = 0
    let supervisorsCreated = 0
    let supervisorsReused = 0

    // For each placement, ensure evaluation and submissions exist
    for (const placement of placements) {
      // Upsert the Evaluation record
      const evaluation = await prisma.evaluation.upsert({
        where: {
          // Use a unique constraint we need to create
          placementId_type: {
            placementId: placement.id,
            type: validatedData.type,
          },
        },
        update: {
          studentMsg: validatedData.studentMsg,
          supervisorMsg: validatedData.supervisorMsg,
        },
        create: {
          placementId: placement.id,
          type: validatedData.type,
          createdById: session.user.id,
          studentMsg: validatedData.studentMsg,
          supervisorMsg: validatedData.supervisorMsg,
        },
      })

      // Create/check student submission
      const existingStudentSubmission = await prisma.evaluationSubmission.findUnique({
        where: {
          evaluationId_role: {
            evaluationId: evaluation.id,
            role: 'STUDENT',
          },
        },
      })

      if (!existingStudentSubmission) {
        // Create new student submission
        await prisma.evaluationSubmission.create({
          data: {
            evaluationId: evaluation.id,
            role: 'STUDENT',
            submittedById: null, // Will be set when they start working on it
            status: 'PENDING',
          },
        })

        // Create notification for student
        await prisma.notification.create({
          data: {
            userId: placement.studentId,
            type: 'EVALUATION_SENT',
            title: `${validatedData.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Self-Evaluation Available`,
            message: validatedData.studentMsg || 'A new self-evaluation is ready for you to complete.',
            relatedEntityId: evaluation.id,
            relatedEntityType: 'EVALUATION',
            priority: 'MEDIUM',
          },
        })

        studentsCreated++
      } else if (existingStudentSubmission.status !== 'LOCKED') {
        // Submission exists but not locked - count as reused
        studentsReused++
      }

      // Create/check supervisor submission (if supervisor exists)
      if (placement.supervisorId) {
        const existingSupervisorSubmission = await prisma.evaluationSubmission.findUnique({
          where: {
            evaluationId_role: {
              evaluationId: evaluation.id,
              role: 'SUPERVISOR',
            },
          },
        })

        if (!existingSupervisorSubmission) {
          // Create new supervisor submission
          await prisma.evaluationSubmission.create({
            data: {
              evaluationId: evaluation.id,
              role: 'SUPERVISOR',
              submittedById: null,
              status: 'PENDING',
            },
          })

          // Create notification for supervisor
          await prisma.notification.create({
            data: {
              userId: placement.supervisorId,
              type: 'EVALUATION_SENT',
              title: `${validatedData.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation Available`,
              message: validatedData.supervisorMsg || `A new evaluation for ${placement.student.firstName} ${placement.student.lastName} is ready for you to complete.`,
              relatedEntityId: evaluation.id,
              relatedEntityType: 'EVALUATION',
              priority: 'MEDIUM',
            },
          })

          supervisorsCreated++
        } else if (existingSupervisorSubmission.status !== 'LOCKED') {
          // Submission exists but not locked - count as reused
          supervisorsReused++
        }
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EVALUATION_ISSUED',
        details: JSON.stringify({
          type: validatedData.type,
          placementsProcessed: placements.length,
          studentsCreated,
          studentsReused,
          supervisorsCreated,
          supervisorsReused,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      placementsProcessed: placements.length,
      created: {
        students: studentsCreated,
        supervisors: supervisorsCreated,
      },
      reused: {
        students: studentsReused,
        supervisors: supervisorsReused,
      },
    })
  } catch (error) {
    console.error('Send evaluations error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
