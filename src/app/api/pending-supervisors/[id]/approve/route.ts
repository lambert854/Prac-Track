import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()

    const { id } = await params

    // Get the pending supervisor with placement info
    const pendingSupervisor = await prisma.pendingSupervisor.findUnique({
      where: { id },
      include: {
        placement: {
          include: {
            student: true,
            site: true,
          },
        },
      },
    })

    if (!pendingSupervisor) {
      return NextResponse.json(
        { error: 'Pending supervisor not found' },
        { status: 404 }
      )
    }

    if (pendingSupervisor.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Supervisor has already been processed' },
        { status: 400 }
      )
    }

    // Check if email already exists as a user
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingSupervisor.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.default.hash(tempPassword, 12)

    // Create the supervisor account
    const newSupervisor = await prisma.user.create({
      data: {
        email: pendingSupervisor.email,
        passwordHash,
        firstName: pendingSupervisor.firstName,
        lastName: pendingSupervisor.lastName,
        phone: pendingSupervisor.phone || null,
        role: 'SUPERVISOR',
        supervisorProfile: {
          create: {
            siteId: pendingSupervisor.siteId,
            title: pendingSupervisor.title || null,
            licensedSW: pendingSupervisor.licensedSW || null,
            licenseNumber: pendingSupervisor.licenseNumber || null,
            highestDegree: pendingSupervisor.highestDegree || null,
            otherDegree: pendingSupervisor.otherDegree || null
          }
        }
      }
    })

    // Update the pending supervisor status
    await prisma.pendingSupervisor.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: (await getServerSession(authOptions))?.user?.id,
      },
    })

    // Update the placement to assign the new supervisor
    await prisma.placement.update({
      where: { id: pendingSupervisor.placementId },
      data: {
        supervisorId: newSupervisor.id,
      },
    })

    // TODO: Send email to supervisor with login credentials
    console.log(`Supervisor approved and account created: ${pendingSupervisor.email} with temp password: ${tempPassword}`)

    return NextResponse.json({
      message: 'Supervisor approved and account created successfully',
      supervisorId: newSupervisor.id,
    })

  } catch (error) {
    console.error('Pending supervisor approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
