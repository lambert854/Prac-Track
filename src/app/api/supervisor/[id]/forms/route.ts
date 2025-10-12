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

    const uploadedDocuments = []
    for (const placement of placements) {
      if (placement.cellPolicy) {
        uploadedDocuments.push({
          id: `cell-policy-${placement.id}`,
          type: 'UPLOADED_DOCUMENT',
          title: 'Cell Phone Usage, Confidentiality, Alcohol/Drug Use, and Safety Policy',
          siteName: placement.site.name,
          documentPath: placement.cellPolicy,
          uploadedAt: placement.approvedAt || placement.startDate,
          placementId: placement.id,
          student: placement.student
        })
      }
      
      if (placement.learningContract) {
        uploadedDocuments.push({
          id: `learning-contract-${placement.id}`,
          type: 'UPLOADED_DOCUMENT',
          title: 'Student Learning Contract',
          siteName: placement.site.name,
          documentPath: placement.learningContract,
          uploadedAt: placement.approvedAt || placement.startDate,
          placementId: placement.id,
          student: placement.student
        })
      }
      
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
    }

    // Combine form submissions and uploaded documents
    const allDocuments = [...allForms, ...uploadedDocuments].sort((a, b) => {
      const dateA = new Date('createdAt' in a ? a.createdAt : a.uploadedAt)
      const dateB = new Date('createdAt' in b ? b.createdAt : b.uploadedAt)
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