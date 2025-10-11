import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')
    
    console.log('📄 Files API called with path:', filePath)
    
    // Check if this is a Blob URL (starts with https://)
    if (filePath.startsWith('https://')) {
      // Redirect to the Blob URL directly
      return NextResponse.redirect(filePath)
    }
    
    // Legacy file path handling - redirect to a helpful message
    return NextResponse.json({ 
      error: 'File storage has been migrated to Vercel Blob. Please contact support if you need to access this file.',
      message: 'This file may be available through the new storage system.'
    }, { status: 410 }) // 410 Gone - indicates the resource is no longer available
    
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
