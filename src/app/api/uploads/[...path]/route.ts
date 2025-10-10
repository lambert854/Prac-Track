import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = join(process.cwd(), 'uploads', ...resolvedParams.path)
    
    // Security check: ensure the path is within uploads directory
    const normalizedPath = filePath.replace(/\\/g, '/')
    const uploadsDir = join(process.cwd(), 'uploads').replace(/\\/g, '/')
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const extension = resolvedParams.path[resolvedParams.path.length - 1]?.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'doc':
        contentType = 'application/msword'
        break
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${resolvedParams.path[resolvedParams.path.length - 1]}"`,
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
