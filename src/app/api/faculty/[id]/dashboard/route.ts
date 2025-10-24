import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFaculty } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFaculty()
    const { id: facultyId } = await params

    // Ensure faculty can only access their own dashboard
    if (session.user.id !== facultyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get assigned students (through faculty assignments)
    const assignedStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentFacultyAssignments: {
          some: {
            facultyId: facultyId
          }
        }
      },
      include: {
        studentProfile: true,
        studentPlacements: {
          include: {
            site: true
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    // Add activePlacement and document status to each student
    const studentsWithActivePlacement = assignedStudents.map(student => {
      const activePlacement = student.studentPlacements.find(placement => 
        placement.status === 'ACTIVE' || placement.status === 'APPROVED_PENDING_CHECKLIST'
      ) || null
      const approvedPlacement = student.studentPlacements.find(placement => 
        placement.status === 'APPROVED' || placement.status === 'APPROVED_PENDING_CHECKLIST' || placement.status === 'ACTIVE'
      ) || null
      
      // Check document status for approved placements
      let documentStatus = null
      if (approvedPlacement) {
        const hasCellPolicy = !!approvedPlacement.cellPolicy
        const hasLearningContract = !!approvedPlacement.learningContract
        const hasChecklist = !!approvedPlacement.checklist
        
        documentStatus = {
          cellPolicy: hasCellPolicy,
          learningContract: hasLearningContract,
          checklist: hasChecklist,
          allComplete: hasCellPolicy && hasLearningContract && hasChecklist,
          pendingCount: [hasCellPolicy, hasLearningContract, hasChecklist].filter(Boolean).length
        }
      }
      
      return {
        ...student,
        activePlacement,
        approvedPlacement,
        documentStatus
      }
    })

    // Get pending placements that need faculty approval (exclude checklist phase)
    // Only show placements for students currently assigned to this faculty
    const pendingPlacements = await prisma.placement.findMany({
      where: {
        facultyId: facultyId,
        status: 'PENDING', // Only show applications that need initial approval
        student: {
          studentFacultyAssignments: {
            some: {
              facultyId: facultyId
            }
          }
        }
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        site: true,
        class: true,
        pendingSupervisor: true
      },
      orderBy: {
        startDate: 'desc'
      }
    })
    

    // Note: Supervisor assignment is now handled during student application, so no need to check for missing supervisors

    // Get pending forms that need faculty review
    const pendingForms = await prisma.formSubmission.findMany({
      where: {
        placement: {
          facultyId: facultyId
        },
        status: 'SUBMITTED'
      },
      include: {
        template: true,
        placement: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate summary statistics
    // Get pending sites submitted by assigned students
    const pendingSites = await prisma.site.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        placements: {
          some: {
            student: {
              studentFacultyAssignments: {
                some: {
                  facultyId: facultyId
                }
              }
            }
          }
        }
      },
      include: {
        placements: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Get faculty mismatch notifications
    const classMismatchNotifications = await prisma.notification.findMany({
      where: {
        userId: facultyId,
        type: 'FACULTY_CLASS_MISMATCH',
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Limit to 5 most recent
    })

    // Get checklist phase count separately since we removed it from pendingPlacements
    const checklistPhaseCount = await prisma.placement.count({
      where: {
        facultyId: facultyId,
        status: 'APPROVED_PENDING_CHECKLIST',
        checklist: null,
        student: {
          studentFacultyAssignments: {
            some: {
              facultyId: facultyId
            }
          }
        }
      }
    })

    const summaryStats = {
      assignedStudents: studentsWithActivePlacement.length,
      pendingPlacements: pendingPlacements.length, // Now only includes PENDING status
      checklistPhase: checklistPhaseCount, // Count of students waiting on checklist
      pendingForms: pendingForms.length,
      approvedPlacements: studentsWithActivePlacement.filter(student => 
        student.activePlacement !== null
      ).length,
      pendingSites: pendingSites.length,
      classMismatchCount: classMismatchNotifications.length
    }

    return NextResponse.json({
      assignedStudents: studentsWithActivePlacement,
      pendingPlacements,
      pendingForms,
      pendingSites,
      classMismatchNotifications,
      summaryStats
    })

  } catch (error) {
    console.error('Faculty dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
