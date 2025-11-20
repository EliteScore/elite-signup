import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/members/active-count
 * 
 * Gets the count of active members in a community.
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT token)
 * 
 * Responses:
 * - 200 OK: { "active_members": number } or backend response body
 * - 401 Unauthorized: No token provided
 * - 400 Bad Request: Invalid community ID
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Get Active Members Count API] ===== Request received =====')
  console.log('[Get Active Members Count API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Active Members Count API] Authorization header present:', !!authHeader)
    console.log('[Get Active Members Count API] Token present:', !!token)
    if (token) {
      console.log(
        '[Get Active Members Count API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Get Active Members Count API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Get Active Members Count API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Active Members Count API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/members/active-count`
    console.log('[Get Active Members Count API] Target URL:', targetUrl)

    console.log('[Get Active Members Count API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Get Active Members Count API] External API response received')
    console.log('[Get Active Members Count API] Response status:', response.status, response.statusText)
    console.log('[Get Active Members Count API] Response ok:', response.ok)

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Get Active Members Count API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Active Members Count API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Active Members Count API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Active Members Count API] Request failed with status:', response.status)
      console.error('[Get Active Members Count API] Error details:', errorData || errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch active members count',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('[Get Active Members Count API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Get Active Members Count API] Response status:', response.status)
    console.log('[Get Active Members Count API] ===== Request completed successfully =====')
    
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Get Active Members Count API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Get Active Members Count API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Get Active Members Count API] Error message:',
      error instanceof Error ? error.message : String(error),
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

