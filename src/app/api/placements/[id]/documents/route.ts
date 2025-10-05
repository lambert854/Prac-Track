import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params

    // Verify placement exists and user has access
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        faculty: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check if user has permission to upload documents
    const canUpload = session.user.role === 'ADMIN' || 
                     (session.user.role === 'STUDENT' && placement.studentId === session.user.id)

    if (!canUpload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('docType') as string

    if (!file || !docType) {
      return NextResponse.json({ error: 'File and document type are required' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate document type
    const validDocTypes = ['cellPolicy', 'learningContract', 'checklist']
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'uploads', 'placements', placementId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${docType}_${timestamp}.pdf`
    const filePath = join(uploadDir, filename)
    const relativePath = `placements/${placementId}/${filename}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update placement with document path
    const updateData: any = {}
    updateData[docType] = relativePath

    await prisma.placement.update({
      where: { id: placementId },
      data: updateData
    })

    // TODO: Send notification to faculty when documents are uploaded
    console.log(`Document uploaded: ${docType} for placement ${placementId}`)

    return NextResponse.json({ 
      message: 'Document uploaded successfully',
      documentType: docType,
      documentPath: relativePath
    })

  } catch (error) {
    console.error('Document upload error:', error)
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
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params

    // Verify placement exists and user has access
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        faculty: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check if user has permission to delete documents
    const canDelete = session.user.role === 'ADMIN' || 
                     (session.user.role === 'STUDENT' && placement.studentId === session.user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const docType = searchParams.get('docType')

    if (!docType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Validate document type
    const validDocTypes = ['cellPolicy', 'learningContract', 'checklist']
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Get the current document path
    const currentDocPath = placement[docType as keyof typeof placement] as string
    
    if (!currentDocPath) {
      return NextResponse.json({ error: 'No document to delete' }, { status: 404 })
    }

    // Delete the physical file
    const fullPath = join(process.cwd(), 'uploads', currentDocPath)
    try {
      await unlink(fullPath)
    } catch (fileError) {
      console.warn(`Could not delete file ${fullPath}:`, fileError)
      // Continue with database update even if file deletion fails
    }

    // Update placement to remove document path
    const updateData: any = {}
    updateData[docType] = null

    await prisma.placement.update({
      where: { id: placementId },
      data: updateData
    })

    console.log(`Document deleted: ${docType} for placement ${placementId}`)

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      documentType: docType
    })

  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}