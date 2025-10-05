import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docPath: string[] }> }
) {
  try {
    const { docPath } = await params
    const fullPath = Array.isArray(docPath) ? docPath.join('/') : docPath
    
    console.log('📄 Document API called with path:', docPath, 'fullPath:', fullPath)
    
    // Validate fullPath to prevent directory traversal
    if (!fullPath.match(/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\.pdf$/)) {
      console.log('❌ Invalid document path format:', fullPath)
      return NextResponse.json({ error: 'Invalid document path' }, { status: 400 })
    }

    const filePath = join(process.cwd(), 'uploads', fullPath)
    console.log('📁 Looking for file at:', filePath)
    
    try {
      const fileBuffer = await readFile(filePath)
      console.log('✅ File found, size:', fileBuffer.length)
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${fullPath.split('/').pop()}"`,
        },
      })
    } catch (fileError) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('Document view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
