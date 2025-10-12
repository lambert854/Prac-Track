import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createJournalSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  tasksSummary: z.string().min(1, 'Tasks summary is required'),
  highLowPoints: z.string().optional(),
  competencies: z.array(z.string()).min(1, 'At least one competency must be selected'),
  practiceBehaviors: z.array(z.string()).min(1, 'At least one practice behavior must be selected'),
  reaction: z.string().min(1, 'Reaction is required'),
  otherComments: z.string().optional(),
})

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = createJournalSchema.parse(body)

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

    // Create the journal entry
    const journalEntry = await prisma.timesheetJournal.create({
      data: {
        placementId: id,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        tasksSummary: validatedData.tasksSummary,
        highLowPoints: validatedData.highLowPoints,
        competencies: JSON.stringify(validatedData.competencies),
        practiceBehaviors: JSON.stringify(validatedData.practiceBehaviors),
        reaction: validatedData.reaction,
        otherComments: validatedData.otherComments,
      },
    })

    return NextResponse.json({
      message: 'Journal submitted successfully',
      journalEntry,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Journal POST error:', error)
    return NextResponse.json(
      { error: 'Failed to submit journal' },
      { status: 500 }
    )
  }
}
