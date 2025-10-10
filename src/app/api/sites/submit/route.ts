import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireStudent } from '@/lib/auth-helpers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const siteSubmissionSchema = z.object({
  siteData: z.object({
    name: z.string().min(1, 'Site name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().min(1, 'Contact phone is required'),
    practiceAreas: z.string().min(1, 'Practice areas are required'),
  }),
  placementData: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    classId: z.string().min(1, 'Class is required'),
    requiredHours: z.number().min(1, 'Required hours must be greater than 0'),
    supervisorOption: z.enum(['existing', 'new']),
    supervisorId: z.string().optional(),
    supervisorFirstName: z.string().optional(),
    supervisorLastName: z.string().optional(),
    supervisorEmail: z.string().email().optional(),
    supervisorPhone: z.string().optional(),
    supervisorTitle: z.string().optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students can submit sites
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit new sites' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = siteSubmissionSchema.parse(body)

    // Check if student has faculty assignment
    const facultyAssignment = await prisma.facultyAssignment.findFirst({
      where: {
        studentId: session.user.id,
      },
      include: {
        faculty: {
          include: {
            facultyProfile: true,
          },
        },
      },
    })

    if (!facultyAssignment) {
      return NextResponse.json(
        { error: 'You must be assigned to a faculty member before submitting a site' },
        { status: 400 }
      )
    }

    // Check if site with same name and contact email already exists
    const existingSite = await prisma.site.findFirst({
      where: {
        name: validatedData.siteData.name,
        contactEmail: validatedData.siteData.contactEmail,
      },
    })

    if (existingSite) {
      return NextResponse.json(
        { error: 'A site with this name and contact email already exists' },
        { status: 400 }
      )
    }

    // Create the site with pending status
    const site = await prisma.site.create({
      data: {
        name: validatedData.siteData.name,
        address: validatedData.siteData.address,
        city: validatedData.siteData.city,
        state: validatedData.siteData.state,
        zip: validatedData.siteData.zip,
        contactName: validatedData.siteData.contactName,
        contactEmail: validatedData.siteData.contactEmail,
        contactPhone: validatedData.siteData.contactPhone,
        practiceAreas: validatedData.siteData.practiceAreas,
        active: false, // Site is inactive until approved
        status: 'PENDING_APPROVAL', // Site needs approval
      },
    })

    // Handle supervisor assignment based on student's choice
    let supervisorId: string | null = null
    
    if (validatedData.placementData.supervisorOption === 'new') {
      // Validate required fields for new supervisor
      if (!validatedData.placementData.supervisorFirstName || 
          !validatedData.placementData.supervisorLastName || 
          !validatedData.placementData.supervisorEmail) {
        return NextResponse.json(
          { error: 'First name, last name, and email are required for new supervisor' },
          { status: 400 }
        )
      }
      
      // Check if email already exists as a user
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.placementData.supervisorEmail }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      
      // Check if email already exists as a pending supervisor
      const existingPendingSupervisor = await prisma.pendingSupervisor.findFirst({
        where: { email: validatedData.placementData.supervisorEmail }
      })
      
      if (existingPendingSupervisor) {
        return NextResponse.json(
          { error: 'A pending supervisor with this email already exists' },
          { status: 400 }
        )
      }
      
      // Don't create the supervisor account yet - it will be created after approval
      supervisorId = null
    }

    // Check for faculty-class mismatch
    const selectedClass = await prisma.class.findUnique({
      where: { id: validatedData.placementData.classId },
      include: { faculty: true }
    })

    let facultyMismatch = false
    if (selectedClass && selectedClass.facultyId && selectedClass.facultyId !== facultyAssignment.facultyId) {
      facultyMismatch = true
      
      // Create notifications for faculty mismatch
      await prisma.notification.createMany({
        data: [
          {
            userId: facultyAssignment.facultyId,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Student Applied for Class Not Assigned to You',
            message: `A student has applied for ${selectedClass.name} which is not assigned to you. You may need to reassign the student to the correct faculty member.`,
            relatedEntityId: session.user.id,
            relatedEntityType: 'PLACEMENT',
            priority: 'HIGH',
            metadata: JSON.stringify({
              studentId: session.user.id,
              className: selectedClass.name,
              classFacultyId: selectedClass.facultyId,
              placementClassId: validatedData.placementData.classId
            })
          },
          {
            userId: selectedClass.facultyId,
            type: 'FACULTY_CLASS_MISMATCH',
            title: 'Student Applied for Your Class',
            message: `A student has applied for ${selectedClass.name} but is currently assigned to a different faculty member.`,
            relatedEntityId: session.user.id,
            relatedEntityType: 'PLACEMENT',
            priority: 'MEDIUM',
            metadata: JSON.stringify({
              studentId: session.user.id,
              className: selectedClass.name,
              currentFacultyId: facultyAssignment.facultyId,
              placementClassId: validatedData.placementData.classId
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
            relatedEntityId: session.user.id,
            relatedEntityType: 'PLACEMENT',
            priority: 'HIGH',
            metadata: JSON.stringify({
              studentId: session.user.id,
              className: selectedClass.name,
              currentFacultyId: facultyAssignment.facultyId,
              classFacultyId: selectedClass.facultyId,
              placementClassId: validatedData.placementData.classId
            })
          }))
        })
      }
    }

    // Create placement request linked to the new site
    const placement = await prisma.placement.create({
      data: {
        studentId: session.user.id,
        siteId: site.id,
        supervisorId: supervisorId,
        facultyId: facultyAssignment.facultyId,
        startDate: new Date(validatedData.placementData.startDate),
        endDate: new Date(validatedData.placementData.endDate),
        status: 'PENDING',
        requiredHours: validatedData.placementData.requiredHours,
        classId: validatedData.placementData.classId,
        complianceChecklist: JSON.stringify({
          orientation: false,
          safetyTraining: false,
          confidentiality: false,
          supervisionSchedule: false,
        }),
        // Create pending supervisor if new supervisor was requested
        pendingSupervisor: validatedData.placementData.supervisorOption === 'new' ? {
          create: {
            firstName: validatedData.placementData.supervisorFirstName!,
            lastName: validatedData.placementData.supervisorLastName!,
            email: validatedData.placementData.supervisorEmail!,
            phone: validatedData.placementData.supervisorPhone || null,
            title: validatedData.placementData.supervisorTitle || null,
            licensedSW: validatedData.placementData.supervisorLicensedSW || null,
            licenseNumber: validatedData.placementData.supervisorLicenseNumber || null,
            highestDegree: validatedData.placementData.supervisorHighestDegree || null,
            otherDegree: validatedData.placementData.supervisorOtherDegree || null,
            siteId: site.id,
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
          include: {
            facultyProfile: true,
          },
        },
        pendingSupervisor: true,
      },
    })

    // TODO: Send notification to faculty about new site submission

    return NextResponse.json({
      message: 'Site submitted for approval successfully',
      placement: placement,
      site: site,
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

    console.error('Site submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
