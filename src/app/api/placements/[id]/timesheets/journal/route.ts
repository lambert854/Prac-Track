import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    // Verify the placement belongs to the user
    const placement = await prisma.placement.findFirst({
      where: {
        id,
        studentId: session.user.id,
      },
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

          // Find the journal entry that overlaps with the specified date range
          // Use a simple overlap check: any overlap between the two date ranges
          const journalEntry = await prisma.timesheetJournal.findFirst({
            where: {
              placementId: id,
              startDate: {
                lte: new Date(endDate),
              },
              endDate: {
                gte: new Date(startDate),
              },
            },
          })

    if (!journalEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json(journalEntry)
  } catch (error) {
    console.error('Journal API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entry' },
      { status: 500 }
    )
  }
}
