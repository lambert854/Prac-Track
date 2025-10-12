import { authOptions } from '@/lib/auth'
import { requireStudentFacultyOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { PlacementStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createPlacementRequestSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  requiredHours: z.number().min(1, 'Required hours is required'),
  classId: z.string().min(1, 'Class is required'),
  studentId: z.string().optional(), // For Faculty/Admin creating placements for students
  supervisorOption: z.enum(['existing', 'new']),
  supervisorId: z.string().optional(),
  supervisorFirstName: z.string().optional(),
  supervisorLastName: z.string().optional(),
  supervisorEmail: z.string().email().optional(),
  supervisorPhone: z.string().optional(),
  supervisorTitle: z.string().optional(),
  supervisorLicensedSW: z.enum(['YES', 'NO']).optional(),
  supervisorLicenseNumber: z.string().optional(),
  supervisorHighestDegree: z.enum(['BSW', 'MSW', 'OTHER']).optional(),
  supervisorOtherDegree: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    const where: {
      studentId?: string
      supervisorId?: string
      facultyId?: string
      status?: PlacementStatus
    } = {}

    // Role-based filtering
    if (session.user.role === 'STUDENT') {
      where.studentId = session.user.id
    } else if (session.user.role === 'SUPERVISOR') {
      where.supervisorId = session.user.id
    } else if (session.user.role === 'FACULTY') {
      where.facultyId = session.user.id
    }
    // ADMIN can see all

    if (studentId) {
      where.studentId = studentId
    }

    if (status) {
      where.status = status as PlacementStatus
    }

    const placements = await prisma.placement.findMany({
      where,
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        site: true,
        supervisor: {
          include: {
            supervisorProfile: true,
          },
        },
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyProfile: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            hours: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(placements)

  } catch (error) {
    console.error('Placements GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudentFacultyOrAdmin()
    
    const body = await request.json()
    console.log('Placement request body:', JSON.stringify(body, null, 2))
    
    const validatedData = createPlacementRequestSchema.parse(body)

    // Determine the student ID - use provided studentId for Faculty/Admin, or session user for students
    let studentId = validatedData.studentId || session.user.id
    
    // If Faculty/Admin is creating for a student, validate the student exists
    if (validatedData.studentId) {
      const student = await prisma.user.findUnique({
        where: { id: validatedData.studentId, role: 'STUDENT' },
        include: { studentProfile: true }
      })
      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      // Keep the user ID for FacultyAssignment lookup
      studentId = validatedData.studentId
    }
    // For students creating their own placement, studentId is already set to session.user.id

    // Check if student already has a placement for this specific class
    const existingPlacementForClass = await prisma.placement.findFirst({
      where: {
        studentId: studentId,
        classId: validatedData.classId,
      },
      include: {
        class: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingPlacementForClass) {
      return NextResponse.json(
        { 
          error: `You already have a placement request for ${existingPlacementForClass.class.name}. You cannot request another placement for the same class.`,
          existingPlacement: {
            class: existingPlacementForClass.class.name,
            status: existingPlacementForClass.status
          }
        },
        { status: 400 }
      )
    }

    // Note: Term-based validation removed as term field is not in current schema

    // Get the site to find a supervisor
    const site = await prisma.site.findUnique({
      where: { id: validatedData.siteId },
    })

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Handle supervisor assignment based on student&apos;s choice
    let supervisorId: string | null = null
    
    if (validatedData.supervisorOption === 'existing') {
      if (!validatedData.supervisorId) {
        return NextResponse.json(
          { error: 'Supervisor selection is required' },
          { status: 400 }
        )
      }
      
      // Verify the supervisor exists and is assigned to this site
      const supervisor = await prisma.user.findFirst({
        where: {
          id: validatedData.supervisorId,
          role: 'SUPERVISOR',
          supervisorProfile: {
            siteId: validatedData.siteId
          }
        }
      })
      
      if (!supervisor) {
        return NextResponse.json(
          { error: 'Selected supervisor is not available for this site' },
          { status: 400 }
        )
      }
      
      supervisorId = validatedData.supervisorId
    } else if (validatedData.supervisorOption === 'new') {
      // Validate required fields for new supervisor
      if (!validatedData.supervisorFirstName || !validatedData.supervisorLastName || !validatedData.supervisorEmail) {
        return NextResponse.json(
          { error: 'First name, last name, and email are required for new supervisor' },
          { status: 400 }
        )
      }
      
      // Check if email already exists as a user
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.supervisorEmail }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      
      // Check if email already exists as a pending supervisor
      const existingPendingSupervisor = await prisma.pendingSupervisor.findFirst({
        where: { email: validatedData.supervisorEmail }
      })
      
      if (existingPendingSupervisor) {
        return NextResponse.json(
          { error: 'A pending supervisor with this email already exists' },
          { status: 400 }
        )
      }
      
      // Don't create the supervisor account yet - it will be created after approval
      // The supervisor will be associated with the placement but cannot log in until approved
      supervisorId = null
    }

    // Get the faculty member assigned to this student
    const facultyAssignment = await prisma.facultyAssignment.findFirst({
      where: { studentId: studentId },
      include: {
        faculty: {
          include: { facultyProfile: true }
        }
      }
    })

    if (!facultyAssignment) {
      return NextResponse.json(
        { error: 'No faculty member assigned to this student' },
        { status: 400 }
      )
    }

    const faculty = facultyAssignment.faculty

    // Check for faculty-class mismatch
    const selectedClass = await prisma.class.findUnique({
      where: { id: validatedData.classId },
      include: { faculty: true }
    })

    let facultyMismatch = false
    if (selectedClass && selectedClass.facultyId && selectedClass.facultyId !== faculty.id) {
      facultyMismatch = true
      
      // Create notification for the student&apos;s assigned faculty about the mismatch
      await prisma.notification.createMany({
        data: [
          {
            userId: faculty.id,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Pending Application Assigned to Different Faculty',
            message: `Pending Application is assigned to a different faculty member. Reassign the student&apos;s faculty assignment.`,
            relatedEntityId: studentId,
            relatedEntityType: 'PLACEMENT',
            priority: 'HIGH',
            metadata: JSON.stringify({
              studentId,
              className: selectedClass.name,
              classFacultyId: selectedClass.facultyId,
              currentFacultyId: faculty.id,
              placementClassId: validatedData.classId
            })
          }
        ]
      })

      // Also notify admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Faculty-Class Mismatch Detected',
            message: `A student has applied for ${selectedClass.name} but is assigned to a different faculty member. Review the faculty assignment.`,
            relatedEntityId: studentId,
            relatedEntityType: 'PLACEMENT',
            priority: 'HIGH',
            metadata: JSON.stringify({
              studentId,
              className: selectedClass.name,
              currentFacultyId: faculty.id,
              classFacultyId: selectedClass.facultyId,
              placementClassId: validatedData.classId
            })
          }))
        })
      }
    }

    // Clear any existing rejection notices when a new placement is applied
    await prisma.placement.updateMany({
      where: {
        studentId: studentId,
        status: 'DECLINED'
      },
      data: {
        facultyNotes: null // Clear the rejection reason to hide the notice
      }
    })

    const placement = await prisma.placement.create({
      data: {
        studentId: studentId,
        siteId: validatedData.siteId,
        supervisorId: supervisorId, // Supervisor is now assigned during application
        facultyId: faculty.id,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: 'PENDING',
        requiredHours: validatedData.requiredHours,
        classId: validatedData.classId,
        complianceChecklist: JSON.stringify({
          orientation: false,
          safetyTraining: false,
          confidentiality: false,
          supervisionSchedule: false,
        }),
        // Create pending supervisor if new supervisor was requested
        pendingSupervisor: validatedData.supervisorOption === 'new' ? {
          create: {
            firstName: validatedData.supervisorFirstName!,
            lastName: validatedData.supervisorLastName!,
            email: validatedData.supervisorEmail!,
            phone: validatedData.supervisorPhone || null,
            title: validatedData.supervisorTitle || null,
            licensedSW: validatedData.supervisorLicensedSW || null,
            licenseNumber: validatedData.supervisorLicenseNumber || null,
            highestDegree: validatedData.supervisorHighestDegree || null,
            otherDegree: validatedData.supervisorOtherDegree || null,
            siteId: validatedData.siteId,
            status: 'PENDING'
          }
        } : undefined,
      },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        site: true,
        supervisor: {
          include: {
            supervisorProfile: true,
          },
        },
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyProfile: true,
          },
        },
        pendingSupervisor: true,
      },
    })

    return NextResponse.json({
      ...placement,
      facultyMismatch,
      mismatchMessage: facultyMismatch 
        ? `Student applied for ${selectedClass?.name} but is assigned to different faculty. Notifications sent to relevant parties.`
        : null
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.issues)
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Placements POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
