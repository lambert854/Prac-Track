import { readFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docPath: string }> }
) {
  try {
    const { docPath } = await params
    
    console.log('📄 Document API called with path:', docPath)
    
    // Check if this is a Blob URL (starts with https://)
    if (docPath.startsWith('https://')) {
      // Redirect to the Blob URL directly
      return NextResponse.redirect(docPath)
    }
    
    // Handle local file paths during development
    if (!process.env.BLOB_READ_WRITE_TOKEN && docPath.startsWith('/api/documents/')) {
      // Extract the actual file path from the API route
      const filePath = docPath.replace('/api/documents/', '')
      const fullPath = join(process.cwd(), 'uploads', filePath)
      
      try {
        const fileBuffer = await readFile(fullPath)
        return new NextResponse(fileBuffer as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=3600'
          }
        })
      } catch (fileError) {
        console.error('File not found:', fullPath, fileError)
        return NextResponse.json({ 
          error: 'Document not found',
          message: 'The requested document could not be found on the server.'
        }, { status: 404 })
      }
    }
    
    // Legacy file path handling - redirect to a helpful message
    return NextResponse.json({ 
      error: 'Document storage has been migrated to Vercel Blob. Please contact support if you need to access this document.',
      message: 'This document may be available through the new storage system.'
    }, { status: 410 }) // 410 Gone - indicates the resource is no longer available

  } catch (error) {
    console.error('Document view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
