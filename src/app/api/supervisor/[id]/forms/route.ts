import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Supervisor forms API: Starting request')
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('Supervisor forms API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Supervisor forms API: Session found for user:', session.user.id, 'role:', session.user.role)

    // Only supervisors can access this endpoint
    if (session.user.role !== 'SUPERVISOR') {
      console.log('Supervisor forms API: Access denied for role:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: supervisorId } = await params
    console.log('Supervisor forms API: Fetching forms for supervisor:', supervisorId)

    // Verify supervisor exists
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    })

    if (!supervisor) {
      console.log('Supervisor forms API: Supervisor not found:', supervisorId)
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    console.log('Supervisor forms API: Supervisor found:', supervisor.firstName, supervisor.lastName)

    // Get form submissions where this supervisor was involved
    console.log('Supervisor forms API: Querying database...')
    const supervisorForms = await prisma.formSubmission.findMany({
      where: {
        placement: {
          supervisorId: supervisorId
        }
      },
      include: {
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        placement: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            site: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      }
    })

    console.log('Supervisor forms API: Found', supervisorForms.length, 'forms')

    // Process forms to add status and metadata
    const processedForms = supervisorForms.map(form => ({
      id: form.id,
      template: form.template,
      status: form.status,
      role: form.role,
      data: form.data,
      locked: form.locked,
      student: form.placement.student,
      placement: form.placement,
      faculty: form.placement.faculty,
      site: form.placement.site,
      submitter: form.submitter,
      approver: form.approver,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      // Add computed status for display
      displayStatus: getFormDisplayStatus(form),
    }))

    console.log('Supervisor forms API: Returning', processedForms.length, 'processed forms')

    return NextResponse.json({
      forms: processedForms,
      totalForms: supervisorForms.length,
    })

  } catch (error) {
    console.error('Supervisor forms GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getFormDisplayStatus(form: any): string {
  if (form.status === 'SUBMITTED') {
    return 'Pending Signature'
  } else if (form.status === 'SUPERVISOR_SIGNED') {
    return 'Supervisor Signed'
  } else if (form.status === 'FACULTY_SIGNED') {
    return 'Faculty Signed'
  } else if (form.status === 'COMPLETED') {
    return 'Completed'
  } else if (form.status === 'REJECTED') {
    return 'Rejected'
  }
  return 'Unknown'
}
