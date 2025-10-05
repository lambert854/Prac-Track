import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['STUDENT', 'SUPERVISOR', 'FACULTY', 'ADMIN'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Prevent admin from changing their own role
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        studentProfile: true,
        facultyProfile: true,
        supervisorProfile: true,
      }
    })

    // Log the role change for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_ROLE_CHANGED',
        details: JSON.stringify({
          targetUserId: userId,
          oldRole: 'UNKNOWN', // We could fetch this if needed
          newRole: role,
          changedBy: session.user.email
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
