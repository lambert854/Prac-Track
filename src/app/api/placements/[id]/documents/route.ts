import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { del, put } from '@vercel/blob'
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

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${docType}_${timestamp}.pdf`
    const blobPath = `placements/${placementId}/${filename}`

    let documentUrl: string

    // Try Vercel Blob first, fallback to local storage for development
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Upload file to Vercel Blob
      const blob = await put(blobPath, file, {
        access: 'public',
        contentType: 'application/pdf'
      })
      documentUrl = blob.url
    } else {
      // Fallback to local file system for development
      const fs = await import('fs/promises')
      const path = await import('path')
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'placements', placementId)
      await fs.mkdir(uploadsDir, { recursive: true })
      
      // Save file locally
      const filePath = path.join(uploadsDir, filename)
      const buffer = await file.arrayBuffer()
      await fs.writeFile(filePath, Buffer.from(buffer))
      
      // Create URL for local file access
      documentUrl = `/api/documents/placements/${placementId}/${filename}`
    }

    // Update placement with document URL
    const updateData: { [key: string]: unknown } = {}
    updateData[docType] = documentUrl

    await prisma.placement.update({
      where: { id: placementId },
      data: updateData
    })

    // TODO: Send notification to faculty when documents are uploaded
    console.log(`Document uploaded: ${docType} for placement ${placementId}`)

    return NextResponse.json({ 
      message: 'Document uploaded successfully',
      documentType: docType,
      documentUrl: documentUrl
    })

  } catch (error) {
    console.error('Document upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      placementId: (await params).id,
      docType: formData?.get('docType'),
      fileName: formData?.get('file') instanceof File ? (formData.get('file') as File).name : 'unknown'
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Get the current document URL
    const currentDocUrl = placement[docType as keyof typeof placement] as string
    
    if (!currentDocUrl) {
      return NextResponse.json({ error: 'No document to delete' }, { status: 404 })
    }

    // Delete the file from Vercel Blob
    try {
      await del(currentDocUrl)
    } catch (fileError) {
      console.warn(`Could not delete blob ${currentDocUrl}:`, fileError)
      // Continue with database update even if blob deletion fails
    }

    // Update placement to remove document path
    const updateData: { [key: string]: unknown } = {}
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