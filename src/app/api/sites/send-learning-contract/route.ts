import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Only faculty and admin can send learning contracts
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { siteId, email, name } = await request.json()

    if (!siteId || !email) {
      return NextResponse.json({ error: 'Site ID and email are required' }, { status: 400 })
    }

    // Get the site with supervisors
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        supervisors: {
          include: {
            user: true
          }
        },
        pendingSupervisors: true
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Generate a unique token for this learning contract
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 30) // 30 days expiry

    // Check if a learning contract already exists for this site
    const existingContract = await prisma.agencyLearningContract.findUnique({
      where: { siteId }
    })

    if (existingContract) {
      // Update existing contract with new token
      await prisma.agencyLearningContract.update({
        where: { id: existingContract.id },
        data: {
          token,
          tokenExpiry,
          sentToEmail: email,
          sentToName: name || null,
          status: 'SENT',
          // Pre-populate with site data
          agencyEmail: site.contactEmail,
          agencyName: site.name,
          agencyAddress: site.address,
          agencyCity: site.city,
          agencyState: site.state,
          agencyZip: site.zip,
          agencyTelephone: site.contactPhone,
          agencyDirector: site.contactName, // Use contact name as director
        }
      })
    } else {
      // Create new learning contract
      await prisma.agencyLearningContract.create({
        data: {
          siteId,
          token,
          tokenExpiry,
          sentToEmail: email,
          sentToName: name || null,
          status: 'SENT',
          // Pre-populate with site data
          agencyEmail: site.contactEmail,
          agencyName: site.name,
          agencyAddress: site.address,
          agencyCity: site.city,
          agencyState: site.state,
          agencyZip: site.zip,
          agencyTelephone: site.contactPhone,
          agencyDirector: site.contactName, // Use contact name as director
        }
      })
    }

    // Update site status to pending learning contract
    await prisma.site.update({
      where: { id: siteId },
      data: {
        status: 'PENDING_LEARNING_CONTRACT',
        learningContractStatus: 'SENT'
      }
    })

    // TODO: Send actual email in production
    // For now, just log the action
    console.log(`Learning contract sent to ${email} for site ${site.name}`)
    console.log(`Token: ${token}`)
    console.log(`Link: ${process.env.NEXTAUTH_URL}/agency-learning-contract/${token}`)

    // Create notification for faculty/admin
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'LEARNING_CONTRACT_SENT',
        title: 'Learning Contract Sent',
        message: `Learning contract sent to ${email} for ${site.name}`,
        relatedEntityId: siteId,
        relatedEntityType: 'SITE'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Learning contract sent successfully',
      token // Include token for testing purposes
    })

  } catch (error) {
    console.error('Error sending learning contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
