import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()

    // Check if learning contract exists and is in correct status
    const learningContract = await prisma.agencyLearningContract.findUnique({
      where: { id },
      include: { site: true }
    })

    if (!learningContract) {
      return NextResponse.json({ error: 'Learning contract not found' }, { status: 404 })
    }

    if (learningContract.status !== 'SENT') {
      return NextResponse.json({ error: 'Learning contract has already been submitted' }, { status: 400 })
    }

    // Check if token is still valid
    if (learningContract.tokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Learning contract link has expired' }, { status: 400 })
    }

    // Handle file uploads
    const filePaths: { [key: string]: string } = {}
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        const bytes = await value.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Create directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'uploads', 'learning-contracts', id)
        await mkdir(uploadDir, { recursive: true })
        
        // Save file
        const fileName = `${key}_${Date.now()}_${value.name}`
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, buffer)
        
        // Store relative path
        filePaths[key] = `uploads/learning-contracts/${id}/${fileName}`
      }
    }

    // Extract form data
    const formFields = {
      agencyEmail: formData.get('agencyEmail') as string,
      agencyName: formData.get('agencyName') as string,
      agencyAddress: formData.get('agencyAddress') as string,
      agencyCity: formData.get('agencyCity') as string,
      agencyState: formData.get('agencyState') as string,
      agencyZip: formData.get('agencyZip') as string,
      agencyTelephone: formData.get('agencyTelephone') as string,
      agencyDirector: formData.get('agencyDirector') as string,
      fieldInstructorName: formData.get('fieldInstructorName') as string,
      fieldInstructorFirstName: formData.get('fieldInstructorFirstName') as string,
      fieldInstructorLastName: formData.get('fieldInstructorLastName') as string,
      fieldInstructorDegree: formData.get('fieldInstructorDegree') as string,
      fieldInstructorLicense: formData.get('fieldInstructorLicense') as string,
      fieldInstructorLicenseType: formData.get('fieldInstructorLicenseType') as string,
      fieldInstructorResume: filePaths.fieldInstructorResume || null,
      resourcesAvailable: formData.get('resourcesAvailable') as string,
      servicesProvided: formData.get('servicesProvided') as string,
      learningPlan: formData.get('learningPlan') as string,
      learningOpportunities: formData.get('learningOpportunities') as string,
      supervisionArrangement: formData.get('supervisionArrangement') as string,
      instructionMethods: formData.get('instructionMethods') as string,
      orientationArrangements: formData.get('orientationArrangements') as string,
      specialRequirements: formData.get('specialRequirements') as string,
      handicapAccommodations: formData.get('handicapAccommodations') as string,
      handicapAccommodationsDetails: formData.get('handicapAccommodationsDetails') as string,
      promotionalMaterials: filePaths.promotionalMaterials || null,
      comments: formData.get('comments') as string,
      completedByName: formData.get('completedByName') as string,
      completedByTitle: formData.get('completedByTitle') as string,
    }

    // Update the learning contract
    await prisma.agencyLearningContract.update({
      where: { id },
      data: {
        ...formFields,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      }
    })

    // Create supervisor account if field instructor information is provided
    if (formFields.fieldInstructorName && formFields.fieldInstructorFirstName && formFields.fieldInstructorLastName) {
      // Check if supervisor already exists
      const existingSupervisor = await prisma.user.findFirst({
        where: {
          email: formFields.agencyEmail, // Using agency email as supervisor email
          role: 'SUPERVISOR'
        }
      })

      if (!existingSupervisor) {
        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        // Create supervisor user
        const supervisorUser = await prisma.user.create({
          data: {
            email: formFields.agencyEmail,
            firstName: formFields.fieldInstructorFirstName,
            lastName: formFields.fieldInstructorLastName,
            role: 'SUPERVISOR',
            active: true,
            password: hashedPassword,
          }
        })

        // Create supervisor profile
        await prisma.supervisorProfile.create({
          data: {
            userId: supervisorUser.id,
            siteId: learningContract.siteId,
            title: formFields.completedByTitle || 'Field Instructor',
            licensedSW: formFields.fieldInstructorLicense ? 'YES' : 'NO',
            licenseNumber: formFields.fieldInstructorLicense || null,
            highestDegree: formFields.fieldInstructorDegree || null,
            otherDegree: null,
            resume: formFields.fieldInstructorResume || null,
          }
        })

        console.log(`Created supervisor account for ${formFields.fieldInstructorFirstName} ${formFields.fieldInstructorLastName} with temporary password: ${tempPassword}`)
      }
    }

    // Update site status to pending agreement review
    await prisma.site.update({
      where: { id: learningContract.siteId },
      data: {
        status: 'PENDING_APPROVAL', // Back to pending for final faculty approval
        learningContractStatus: 'SUBMITTED'
      }
    })

    // Create notifications for faculty and admin users
    const facultyAndAdmins = await prisma.user.findMany({
      where: {
        role: { in: ['FACULTY', 'ADMIN'] },
        active: true
      }
    })

    for (const user of facultyAndAdmins) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'LEARNING_CONTRACT_SUBMITTED',
          title: 'Learning Contract Submitted',
          message: `Learning contract submitted for ${learningContract.site.name}. Ready for review.`,
          relatedEntityId: learningContract.siteId,
          relatedEntityType: 'SITE',
          priority: 'HIGH'
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Learning contract submitted successfully' 
    })

  } catch (error) {
    console.error('Error submitting learning contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
