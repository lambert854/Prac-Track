import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()

    // Get all supervisors with their placements
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR'
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
        },
        supervisorPlacements: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            site: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    // Get pending supervisors awaiting approval
    const pendingSupervisors = await prisma.pendingSupervisor.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        placement: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      supervisors,
      pendingSupervisors
    })

  } catch (error) {
    console.error('Supervisors GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()

    const body = await request.json()
    const { firstName, lastName, email, password, phone, siteId, title } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create supervisor user
    const supervisor = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'SUPERVISOR',
        supervisorProfile: {
          create: {
            siteId: siteId,
            title: title || null
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

    return NextResponse.json(supervisor, { status: 201 })

  } catch (error) {
    console.error('Create supervisor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
