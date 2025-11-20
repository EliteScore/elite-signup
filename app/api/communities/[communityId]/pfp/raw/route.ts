import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/pfp/raw
 * 
 * Gets the raw image bytes for a community's profile picture.
 * 
 * This endpoint proxies the backend API and adds authentication headers.
 * The response is the actual image file (JPEG, PNG, etc.) that can be displayed directly.
 * 
 * Authorization: Optional (JWT token - behavior same as the rest of the API)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Get Community PFP Raw API] ===== Request received =====')
  console.log('[Get Community PFP Raw API] Timestamp:', new Date().toISOString())

  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '') || null

    // If no token in header, try to get it from query parameter (for img tag requests)
    if (!token) {
      const { searchParams } = new URL(request.url)
      token = searchParams.get('token') || null
    }

    console.log('[Get Community PFP Raw API] Authorization header present:', !!authHeader)
    console.log('[Get Community PFP Raw API] Token present:', !!token)
    if (token) {
      console.log(
        '[Get Community PFP Raw API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    const { communityId } = await params
    console.log('[Get Community PFP Raw API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Community PFP Raw API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/pfp/raw`
    console.log('[Get Community PFP Raw API] Target URL:', targetUrl)

    // Prepare headers for the backend request
    const headers: HeadersInit = {
      'Accept': '*/*',  // More permissive - accepts any content type (fixes 406 Not Acceptable)
    }

    // Add authorization if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    console.log('[Get Community PFP Raw API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    console.log('[Get Community PFP Raw API] External API response received')
    console.log('[Get Community PFP Raw API] Response status:', response.status, response.statusText)
    console.log('[Get Community PFP Raw API] Response ok:', response.ok)
    console.log('[Get Community PFP Raw API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Get Community PFP Raw API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Get Community PFP Raw API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Community PFP Raw API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Community PFP Raw API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Community PFP Raw API] Request failed with status:', response.status)
      console.error('[Get Community PFP Raw API] Error details:', errorData || errorText)

      // For 404, return a 404 (community might not have a profile picture)
      if (response.status === 404) {
        return new NextResponse(null, { status: 404 })
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch profile picture',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // Get the content type from the backend response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    console.log('[Get Community PFP Raw API] Response content-type:', contentType)

    // Get the image bytes
    const imageBuffer = await response.arrayBuffer()
    console.log('[Get Community PFP Raw API] Image size:', imageBuffer.byteLength, 'bytes')

    // Return the image with proper headers
    console.log('[Get Community PFP Raw API] Success! Returning image')
    console.log('[Get Community PFP Raw API] ===== Request completed successfully =====')
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('[Get Community PFP Raw API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Get Community PFP Raw API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Get Community PFP Raw API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Get Community PFP Raw API] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
