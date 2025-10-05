import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    console.log('Debug - Session user ID:', session.user.id)
    console.log('Debug - Session user role:', session.user.role)

    // Test basic database connection
    const userCount = await prisma.user.count()
    console.log('Debug - Total users in database:', userCount)

    // Test placements query
    const placements = await prisma.placement.findMany({
      where: {
        studentId: session.user.id
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
      },
      orderBy: { startDate: 'desc' },
    })

    console.log('Debug - Found placements:', placements.length)

    return NextResponse.json({
      session: {
        userId: session.user.id,
        role: session.user.role
      },
      userCount,
      placements
    })
  } catch (error) {
    console.error('Debug placements error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}