import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireStudent, requireFacultyOrAdmin, requireStudentFacultyOrAdmin } from '@/lib/auth-helpers'
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

    let where: any = {}

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
      where.status = status
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
    const validatedData = createPlacementRequestSchema.parse(body)

    // Determine the student ID - use provided studentId for Faculty/Admin, or session user for students
    const studentId = validatedData.studentId || session.user.id
    
    // If Faculty/Admin is creating for a student, validate the student exists
    if (validatedData.studentId) {
      const student = await prisma.user.findUnique({
        where: { id: validatedData.studentId, role: 'STUDENT' }
      })
      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
    }

    // Check if student already has an active placement
    const existingActivePlacement = await prisma.placement.findFirst({
      where: {
        studentId: studentId,
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
    })

    if (existingActivePlacement) {
      return NextResponse.json(
        { error: 'You already have an active or approved placement' },
        { status: 400 }
      )
    }

    // Check if student already has a placement application for the same term
    const existingTermPlacement = await prisma.placement.findFirst({
      where: {
        studentId: studentId,
        term: validatedData.term,
        status: { in: ['PENDING', 'APPROVED_PENDING_CHECKLIST', 'APPROVED', 'ACTIVE'] },
      },
    })

    if (existingTermPlacement) {
      return NextResponse.json(
        { error: `You already have a placement application for ${validatedData.term.replace('_', ' ')} term` },
        { status: 400 }
      )
    }

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

    // Handle supervisor assignment based on student's choice
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
      
      // Create notifications for faculty mismatch
      await prisma.notification.createMany({
        data: [
          {
            userId: faculty.id,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Student Applied for Class Not Assigned to You',
            message: `A student has applied for ${selectedClass.name} which is not assigned to you. You may need to reassign the student to the correct faculty member.`,
            relatedEntityId: studentId,
            relatedEntityType: 'STUDENT',
            priority: 'HIGH',
            metadata: JSON.stringify({
              studentId,
              className: selectedClass.name,
              classFacultyId: selectedClass.facultyId,
              placementClassId: validatedData.classId
            })
          },
          {
            userId: selectedClass.facultyId,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Student Applied for Your Class',
            message: `A student has applied for ${selectedClass.name} but is currently assigned to a different faculty member.`,
            relatedEntityId: studentId,
            relatedEntityType: 'STUDENT',
            priority: 'MEDIUM',
            metadata: JSON.stringify({
              studentId,
              className: selectedClass.name,
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
            relatedEntityType: 'STUDENT',
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
