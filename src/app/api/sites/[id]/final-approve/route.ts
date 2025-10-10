import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    
    // Only faculty and admin can approve sites
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Get the site with learning contract
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        learningContract: true
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.learningContract) {
      return NextResponse.json({ error: 'Learning contract not found' }, { status: 400 })
    }

    if (site.learningContract.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Learning contract must be submitted before final approval' }, { status: 400 })
    }

    // Update the learning contract status
    await prisma.agencyLearningContract.update({
      where: { id: site.learningContract.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: session.user.id
      }
    })

    // Update the site status to active and set agreement dates
    const currentDate = new Date()
    const agreementStartMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    const agreementStartYear = currentDate.getFullYear()
    
    await prisma.site.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        learningContractStatus: 'APPROVED',
        active: true,
        agreementStartMonth: agreementStartMonth,
        agreementStartYear: agreementStartYear,
        agreementExpirationDate: new Date(agreementStartYear + 3, agreementStartMonth - 1, 1) // 3 years from start date
      }
    })

    // Create notifications
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'LEARNING_CONTRACT_APPROVED',
        title: 'Learning Contract Approved',
        message: `Learning contract approved for ${site.name}. Agency is now active.`,
        relatedEntityId: id,
        relatedEntityType: 'SITE'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Site approved successfully' 
    })

  } catch (error) {
    console.error('Error approving site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
