import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Role-based filtering
    if (session.user.role === 'STUDENT') {
      where.submittedBy = session.user.id
    } else if (session.user.role === 'SUPERVISOR') {
      where.submittedBy = session.user.id
    } else if (session.user.role === 'FACULTY') {
      // Faculty can see forms for their students
      where.placement = {
        facultyId: session.user.id
      }
    }
    // ADMIN can see all

    const formSubmissions = await prisma.formSubmission.findMany({
      where,
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
            site: {
              select: {
                name: true
              }
            }
          }
        },
        approver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // For students, also get their uploaded documents from placements and completed evaluations
    let uploadedDocuments: any[] = []
    
    if (session.user.role === 'STUDENT') {
      const studentPlacements = await prisma.placement.findMany({
        where: {
          studentId: session.user.id
        },
        include: {
          site: {
            select: {
              name: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      })

      // Convert uploaded documents to a unified format
      uploadedDocuments = studentPlacements.flatMap(placement => {
        const docs = []
        
        if (placement.cellPolicy) {
          docs.push({
            id: `cell-policy-${placement.id}`,
            type: 'UPLOADED_DOCUMENT',
            title: 'Cell Phone Usage, Confidentiality, Alcohol/Drug Use, and Safety Policy',
            siteName: placement.site.name,
            documentPath: placement.cellPolicy,
            uploadedAt: placement.approvedAt || placement.startDate,
            placementId: placement.id
          })
        }
        
        if (placement.learningContract) {
          docs.push({
            id: `learning-contract-${placement.id}`,
            type: 'UPLOADED_DOCUMENT',
            title: 'Student Learning Contract',
            siteName: placement.site.name,
            documentPath: placement.learningContract,
            uploadedAt: placement.approvedAt || placement.startDate,
            placementId: placement.id
          })
        }
        
        if (placement.checklist) {
          docs.push({
            id: `checklist-${placement.id}`,
            type: 'UPLOADED_DOCUMENT',
            title: 'Placement Checklist',
            siteName: placement.site.name,
            documentPath: placement.checklist,
            uploadedAt: placement.approvedAt || placement.startDate,
            placementId: placement.id
          })
        }
        
        return docs
      })

      // Get completed evaluations for the student
      const completedEvaluations = await prisma.evaluationSubmission.findMany({
        where: {
          evaluation: {
            placement: {
              studentId: session.user.id
            }
          },
          role: 'STUDENT',
          status: 'LOCKED'
        },
        include: {
          evaluation: {
            include: {
              placement: {
                include: {
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

      // Add completed evaluations to the uploaded documents list
      for (const evaluation of completedEvaluations) {
        uploadedDocuments.push({
          id: `evaluation-${evaluation.id}`,
          type: 'EVALUATION',
          title: `${evaluation.evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Self-Evaluation`,
          siteName: evaluation.evaluation.placement.site.name,
          documentPath: evaluation.id, // Use submission ID for the link
          uploadedAt: evaluation.lockedAt,
          placementId: evaluation.evaluation.placement.id,
          submissionUrl: `/forms/evaluations/${evaluation.id}`
        })
      }
    }

    // Combine form submissions and uploaded documents
    const allDocuments = [
      ...formSubmissions.map(submission => ({
        ...submission,
        type: 'FORM_SUBMISSION'
      })),
      ...uploadedDocuments
    ].sort((a, b) => new Date(b.uploadedAt || b.createdAt).getTime() - new Date(a.uploadedAt || a.createdAt).getTime())

    return NextResponse.json(allDocuments)
  } catch (error) {
    console.error('Form submissions GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
