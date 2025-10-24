import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id: studentId } = await params
    const body = await request.json()
    const { firstName, lastName, email, aNumber, program, cohort, password, active } = body

    // If updating active status only, skip other validations
    const isActiveStatusUpdate = active !== undefined && !firstName && !lastName && !email && !aNumber && !program && !cohort

    // Validate required fields (unless it&apos;s just an active status update)
    if (!isActiveStatusUpdate && (!firstName || !lastName || !email || !aNumber || !program || !cohort)) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate A number format (unless it&apos;s just an active status update)
    if (!isActiveStatusUpdate && aNumber && !/^A[0-9]{7}$/.test(aNumber)) {
      return NextResponse.json(
        { error: 'A number must be in format A followed by 7 digits (e.g., A0001234)' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: { studentProfile: true }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if email already exists for another user (unless it&apos;s just an active status update)
    if (!isActiveStatusUpdate && email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: studentId }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Check if A number already exists for another student (unless it&apos;s just an active status update)
    if (!isActiveStatusUpdate && aNumber) {
      const aNumberExists = await prisma.studentProfile.findFirst({
        where: { 
          aNumber,
          userId: { not: studentId }
        }
      })

      if (aNumberExists) {
        return NextResponse.json(
          { error: 'A number already in use by another student' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    // Add active status if provided
    if (active !== undefined) {
      updateData.active = active
    }

    // Add other fields only if they&apos;re provided (not for active status updates)
    if (!isActiveStatusUpdate) {
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (email) updateData.email = email

      // Add student profile updates if any profile fields are provided
      if (aNumber || program || cohort) {
        const profileUpdate: {
          aNumber?: string
          program?: string
          cohort?: string
        } = {}
        
        if (aNumber) profileUpdate.aNumber = aNumber
        if (program) profileUpdate.program = program
        if (cohort) profileUpdate.cohort = cohort
        
        updateData.studentProfile = {
          update: profileUpdate
        }
      }
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    // If deactivating student, also remove faculty assignments
    if (active === false) {
      await prisma.facultyAssignment.deleteMany({
        where: { studentId: studentId }
      })
    }

    // Update student
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      include: {
        studentProfile: true,
        studentFacultyAssignments: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedStudent)

  } catch (error) {
    console.error('Student PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ DELETE API route called')
  
  try {
    console.log('🗑️ Step 1: Getting session...')
    const session = await requireFacultyOrAdmin()
    console.log('🗑️ Step 2: Session obtained, user:', session.user.email, 'role:', session.user.role)
    
    if (session.user.role !== 'ADMIN') {
      console.log('🗑️ Step 3: Access denied - not admin')
      return NextResponse.json({ error: 'Only admin users can delete students' }, { status: 403 })
    }

    console.log('🗑️ Step 4: Getting student ID from params...')
    const { id: studentId } = await params
    console.log('🗑️ Step 5: Student ID:', studentId)

    console.log('🗑️ Step 6: Checking if student exists...')
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!existingStudent) {
      console.log('🗑️ Step 7: Student not found')
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.log('🗑️ Step 8: Student found:', existingStudent.firstName, existingStudent.lastName)

    // First, collect all blob URLs for file deletion
    console.log('🗑️ Step 9: Collecting blob URLs for deletion...')
    const placements = await prisma.placement.findMany({
      where: { studentId: studentId },
      select: {
        cellPolicy: true,
        learningContract: true,
        checklist: true
      }
    })

    const blobUrlsToDelete: string[] = []
    placements.forEach(placement => {
      if (placement.cellPolicy && placement.cellPolicy.startsWith('https://')) {
        blobUrlsToDelete.push(placement.cellPolicy)
      }
      if (placement.learningContract && placement.learningContract.startsWith('https://')) {
        blobUrlsToDelete.push(placement.learningContract)
      }
      if (placement.checklist && placement.checklist.startsWith('https://')) {
        blobUrlsToDelete.push(placement.checklist)
      }
    })
    console.log('🗑️ Found', blobUrlsToDelete.length, 'blob files to delete')

    // Delete blob files from Vercel Blob storage
    const blobDeletionResults = []
    for (const blobUrl of blobUrlsToDelete) {
      try {
        console.log('🗑️ Deleting blob file:', blobUrl)
        await del(blobUrl)
        blobDeletionResults.push({ url: blobUrl, status: 'deleted' })
      } catch (error) {
        console.error('🗑️ Failed to delete blob:', blobUrl, error)
        blobDeletionResults.push({ url: blobUrl, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    // Use a transaction to delete all database records
    console.log('🗑️ Step 10: Starting database deletion transaction...')
    const deletionResults = await prisma.$transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      
      // 1. Delete timesheet entries (through placement relationship)
      const deletedTimesheets = await tx.timesheetEntry.deleteMany({
        where: { placement: { studentId: studentId } }
      })
      console.log('🗑️ Deleted', deletedTimesheets.count, 'timesheet entries')

      // 2. Delete timesheet journals (through placement relationship)
      const deletedJournals = await tx.timesheetJournal.deleteMany({
        where: { placement: { studentId: studentId } }
      })
      console.log('🗑️ Deleted', deletedJournals.count, 'timesheet journals')

      // 3. Delete evaluation submissions (through evaluation -> placement relationship)
      const deletedEvaluations = await tx.evaluationSubmission.deleteMany({
        where: { evaluation: { placement: { studentId: studentId } } }
      })
      console.log('🗑️ Deleted', deletedEvaluations.count, 'evaluation submissions')

      // 4. Delete form submissions (through placement relationship)
      const deletedForms = await tx.formSubmission.deleteMany({
        where: { placement: { studentId: studentId } }
      })
      console.log('🗑️ Deleted', deletedForms.count, 'form submissions')

      // 5. Delete pending supervisors (references placements)
      const deletedPendingSupervisors = await tx.pendingSupervisor.deleteMany({
        where: { placement: { studentId: studentId } }
      })
      console.log('🗑️ Deleted', deletedPendingSupervisors.count, 'pending supervisors')

      // 6. Delete placements (references student)
      const deletedPlacements = await tx.placement.deleteMany({
        where: { studentId: studentId }
      })
      console.log('🗑️ Deleted', deletedPlacements.count, 'placements')

      // 7. Delete notifications (references user)
      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId: studentId }
      })
      console.log('🗑️ Deleted', deletedNotifications.count, 'notifications')

      // 8. Delete faculty assignments (references student)
      const deletedAssignments = await tx.facultyAssignment.deleteMany({
        where: { studentId: studentId }
      })
      console.log('🗑️ Deleted', deletedAssignments.count, 'faculty assignments')

      // 9. Delete audit logs (references user)
      const deletedAuditLogs = await tx.auditLog.deleteMany({
        where: { userId: studentId }
      })
      console.log('🗑️ Deleted', deletedAuditLogs.count, 'audit logs')

      // 10. Delete student profile
      const deletedProfile = await tx.studentProfile.deleteMany({
        where: { userId: studentId }
      })
      console.log('🗑️ Deleted', deletedProfile.count, 'student profile')

      // 11. Finally, delete the user
      const deletedUser = await tx.user.delete({
        where: { id: studentId }
      })
      console.log('🗑️ Deleted user:', deletedUser.firstName, deletedUser.lastName)

      return {
        timesheets: deletedTimesheets.count,
        journals: deletedJournals.count,
        evaluations: deletedEvaluations.count,
        forms: deletedForms.count,
        pendingSupervisors: deletedPendingSupervisors.count,
        placements: deletedPlacements.count,
        notifications: deletedNotifications.count,
        assignments: deletedAssignments.count,
        auditLogs: deletedAuditLogs.count,
        profile: deletedProfile.count,
        user: deletedUser
      }
    })

    console.log('🗑️ Step 11: Complete deletion successful!')
    console.log('🗑️ Database deletion results:', deletionResults)
    console.log('🗑️ Blob deletion results:', blobDeletionResults)

    return NextResponse.json({ 
      message: 'Student and all associated data deleted successfully',
      studentName: `${existingStudent.firstName} ${existingStudent.lastName}`,
      databaseResults: deletionResults,
      blobResults: blobDeletionResults
    })

  } catch (error) {
    console.error('🗑️ ERROR in DELETE function:', error)
    console.error('🗑️ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id: studentId } = await params

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: {
        studentProfile: true,
        studentFacultyAssignments: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyProfile: {
                  select: {
                    honorific: true
                  }
                }
              }
            }
          }
        },
        studentPlacements: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            requiredHours: true,
            approvedAt: true,
            cellPolicy: true,
            learningContract: true,
            checklist: true,
            class: {
              select: {
                id: true,
                name: true
              }
            },
            site: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zip: true
              }
            },
            supervisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyProfile: {
                  select: {
                    honorific: true
                  }
                }
              }
            },
            timesheetEntries: {
              select: {
                id: true,
                date: true,
                hours: true,
                category: true,
                status: true,
                rejectionReason: true,
                rejectedAt: true,
                rejector: {
                  select: {
                    firstName: true,
                    lastName: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(student)

  } catch (error) {
    console.error('Student GET by ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
