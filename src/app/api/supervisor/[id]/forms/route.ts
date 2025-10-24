import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: supervisorId } = await params

    // Verify the supervisor exists
    const supervisor = await prisma.user.findUnique({
      where: { 
        id: supervisorId,
        role: 'SUPERVISOR'
      }
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    // Get form submissions that need supervisor review
    const pendingForms = await prisma.formSubmission.findMany({
      where: {
        placement: {
          supervisorId: supervisorId
        },
        status: 'SUBMITTED'
      },
      include: {
        template: {
          select: {
            id: true,
            key: true,
            title: true
          }
        },
        placement: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            site: {
              select: {
                name: true
              }
            }
          }
        },
        submitter: {
          select: {
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

    // Get all form submissions for the supervisor&apos;s students (including approved/rejected)
    const allForms = await prisma.formSubmission.findMany({
      where: {
        placement: {
          supervisorId: supervisorId
        }
      },
      include: {
        template: {
          select: {
            id: true,
            key: true,
            title: true
          }
        },
        placement: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            site: {
              select: {
                name: true
              }
            }
          }
        },
        submitter: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
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

    // Get uploaded documents from placements
    const placements = await prisma.placement.findMany({
      where: {
        supervisorId: supervisorId
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        site: {
          select: {
            name: true
          }
        }
      }
    })

    // Get completed evaluations for the supervisor
    const completedEvaluations = await prisma.evaluationSubmission.findMany({
      where: {
        evaluation: {
          placement: {
            supervisorId: supervisorId
          }
        },
        role: 'SUPERVISOR',
        status: 'LOCKED'
      },
      include: {
        evaluation: {
          include: {
            placement: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                site: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        lockedAt: 'desc'
      }
    })

    const uploadedDocuments = []
    for (const placement of placements) {
      // Only show Placement Checklist - this is relevant to supervisor
      if (placement.checklist) {
        uploadedDocuments.push({
          id: `checklist-${placement.id}`,
          type: 'UPLOADED_DOCUMENT',
          title: 'Placement Checklist',
          siteName: placement.site.name,
          documentPath: placement.checklist,
          uploadedAt: placement.approvedAt || placement.startDate,
          placementId: placement.id,
          student: placement.student
        })
      }
      
      // Note: Cell Phone Policy and Learning Contract are student-faculty only
      // so they are not included in supervisor forms
    }

    // Add completed evaluations to the uploaded documents list
    for (const evaluation of completedEvaluations) {
      uploadedDocuments.push({
        id: `evaluation-${evaluation.id}`,
        type: 'EVALUATION',
        title: `${evaluation.evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation`,
        siteName: evaluation.evaluation.placement.site.name,
        documentPath: evaluation.id, // Use submission ID for the link
        uploadedAt: evaluation.lockedAt,
        placementId: evaluation.evaluation.placement.id,
        student: evaluation.evaluation.placement.student,
        submissionUrl: `/forms/evaluations/${evaluation.id}`
      })
    }

    // Combine form submissions and uploaded documents (which now includes evaluations)
    const allDocuments = [...allForms, ...uploadedDocuments].sort((a, b) => {
      const dateA = new Date('createdAt' in a ? a.createdAt || new Date() : a.uploadedAt || new Date())
      const dateB = new Date('createdAt' in b ? b.createdAt || new Date() : b.uploadedAt || new Date())
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({
      pendingForms,
      allDocuments,
      summary: {
        totalForms: allForms.length,
        pendingForms: pendingForms.length,
        uploadedDocuments: uploadedDocuments.length,
        totalDocuments: allDocuments.length
      }
    })

  } catch (error) {
    console.error('Supervisor forms API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}