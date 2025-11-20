import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * POST /v1/communities/{communityId}/join
 * 
 * Joins a community or creates a join request.
 * 
 * For public communities:
 * - Directly joins (with capacity check) and is idempotent.
 * 
 * For non-public communities:
 * - Creates a join request (pending), and requires a message.
 * 
 * Request Body (optional for public, required for private):
 * {
 *   "message": "string" // Required for private communities
 * }
 * 
 * Authorization: Required (JWT token)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Join Community API] ===== Request received =====')
  console.log('[Join Community API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Join Community API] Authorization header present:', !!authHeader)
    console.log('[Join Community API] Token present:', !!token)
    if (token) {
      console.log(
        '[Join Community API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Join Community API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Join Community API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Join Community API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    // Parse request body (optional for public communities, required for private)
    let requestBody: any = null
    try {
      const bodyText = await request.text()
      if (bodyText && bodyText.trim()) {
        try {
          requestBody = JSON.parse(bodyText)
          console.log('[Join Community API] Request body:', requestBody)
        } catch (parseError) {
          console.error('[Join Community API] ERROR: Invalid JSON in request body:', parseError)
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 },
          )
        }
      }
    } catch (readError) {
      console.warn('[Join Community API] No request body or failed to read:', readError)
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/join`
    console.log('[Join Community API] Target URL:', targetUrl)

    console.log('[Join Community API] Making fetch request to external API...')
    // Always send a body: empty object {} for public communities, or { message: "..." } for private
    const bodyToSend = requestBody || {}
    console.log('[Join Community API] Request body to send:', bodyToSend)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyToSend),
      cache: 'no-store',
    })

    console.log('[Join Community API] External API response received')
    console.log('[Join Community API] Response status:', response.status, response.statusText)
    console.log('[Join Community API] Response ok:', response.ok)
    console.log('[Join Community API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Join Community API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Join Community API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Join Community API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Join Community API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Join Community API] Request failed with status:', response.status)
      console.error('[Join Community API] Error details:', errorData || errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to join community',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // Handle 204 No Content (if backend sends it)
    if (response.status === 204) {
      console.log('[Join Community API] Success! Joined community (204 No Content)')
      return new NextResponse(null, { status: 204 })
    }

    const contentType = response.headers.get('content-type')
    console.log('[Join Community API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Join Community API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Join Community API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Join Community API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Join Community API] Response status:', response.status)
    console.log('[Join Community API] ===== Request completed successfully =====')
    // Preserve the original response status (200 for joined, 202 for pending_request, etc.)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Join Community API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Join Community API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Join Community API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Join Community API] Error stack:',
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

