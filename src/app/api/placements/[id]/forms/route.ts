import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params

    // Get placement to verify it exists and get student info
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: { select: { id: true } },
        site: { select: { name: true } }
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Get form submissions for this placement
    const formSubmissions = await prisma.formSubmission.findMany({
      where: {
        placementId: placementId,
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
            site: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check for uploaded documents in the placement record
    const uploadedDocuments = []
    if (placement.cellPolicy) {
      uploadedDocuments.push({
        id: `cell-policy-${placementId}`,
        title: 'Cell Policy',
        documentPath: placement.cellPolicy,
        uploadedAt: placement.approvedAt || placement.createdAt,
        type: 'UPLOADED_DOCUMENT',
        placement: {
          site: {
            name: placement.site.name
          }
        }
      })
    }
    if (placement.learningContract) {
      uploadedDocuments.push({
        id: `learning-contract-${placementId}`,
        title: 'Learning Contract',
        documentPath: placement.learningContract,
        uploadedAt: placement.approvedAt || placement.createdAt,
        type: 'UPLOADED_DOCUMENT',
        placement: {
          site: {
            name: placement.site.name
          }
        }
      })
    }
    if (placement.checklist) {
      uploadedDocuments.push({
        id: `checklist-${placementId}`,
        title: 'Placement Checklist',
        documentPath: placement.checklist,
        uploadedAt: placement.approvedAt || placement.createdAt,
        type: 'UPLOADED_DOCUMENT',
        placement: {
          site: {
            name: placement.site.name
          }
        }
      })
    }


    // Combine form submissions and uploaded documents
    const allDocuments = [
      ...formSubmissions.map(submission => ({
        ...submission,
        type: 'FORM_SUBMISSION'
      })),
      ...uploadedDocuments
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.uploadedAt)
      const dateB = new Date(b.createdAt || b.uploadedAt)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(allDocuments)
  } catch (error) {
    console.error('Error fetching placement forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch placement forms' },
      { status: 500 }
    )
  }
}
