import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    // Get the user to send password reset for
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a secure reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store the reset token in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Log the password reset for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSWORD_RESET_LINK_SENT',
        details: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: user.email,
          sentBy: session.user.email,
          resetLink: `https://prac-track.com/forgot-password?token=${resetToken}`
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // TODO: Send email with reset link
    // For now, we'll just return success
    // In production, you would send an email with the reset link:
    // https://prac-track.com/forgot-password?token=${resetToken}

    console.log(`Password reset link sent to ${user.email}. Reset token: ${resetToken}`)
    console.log(`Reset link: https://prac-track.com/forgot-password?token=${resetToken}`)

    return NextResponse.json({ 
      message: 'Password reset link sent successfully',
      resetLink: `https://prac-track.com/forgot-password?token=${resetToken}`,
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    })

  } catch (error) {
    console.error('Send password reset link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


