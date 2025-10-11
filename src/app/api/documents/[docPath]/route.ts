import { NextRequest, NextResponse } from 'next/server'

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
