import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()
    const { id } = await params

    const supervisor = await prisma.user.findUnique({
      where: { id, role: 'SUPERVISOR' },
      include: {
        supervisorProfile: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                active: true
              }
            }
          }
        },
        supervisorPlacements: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    return NextResponse.json(supervisor)

  } catch (error) {
    console.error('Supervisor GET by ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()
    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, email, phone, title, password, licensedSW, licenseNumber, highestDegree, otherDegree } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists for another user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.id !== id) {
      return NextResponse.json(
        { error: 'Email already in use by another user' },
        { status: 400 }
      )
    }

    let passwordHash: string | undefined
    if (password) {
      passwordHash = await bcrypt.hash(password, 12)
    }

    const updatedSupervisor = await prisma.user.update({
      where: { id, role: 'SUPERVISOR' },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        passwordHash: passwordHash || undefined,
        supervisorProfile: {
          update: {
            title: title || null,
            licensedSW: licensedSW || null,
            licenseNumber: licenseNumber || null,
            highestDegree: highestDegree || null,
            otherDegree: otherDegree || null
          }
        }
      },
      include: {
        supervisorProfile: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                active: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedSupervisor)

  } catch (error) {
    console.error('Supervisor PATCH error:', error)
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
  try {
    await requireFacultyOrAdmin()
    const { id: supervisorId } = await params

    // Check if supervisor has any placements
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
      include: {
        supervisorPlacements: true
      }
    })

    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404 }
      )
    }

    if (supervisor.supervisorPlacements.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supervisor with active placements' },
        { status: 400 }
      )
    }

    // Delete supervisor (this will cascade delete the supervisor profile)
    await prisma.user.delete({
      where: { id: supervisorId }
    })

    return NextResponse.json({ message: 'Supervisor deleted successfully' })

  } catch (error) {
    console.error('Delete supervisor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
