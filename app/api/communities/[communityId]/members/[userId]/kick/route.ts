import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * POST /v1/communities/{communityId}/members/{userId}/kick
 * 
 * Kicks a member out of a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * The backend will return 403 Forbidden if not authorized.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; userId: string }> },
) {
  console.log('[Kick Member API] ===== Request received =====')
  console.log('[Kick Member API] Timestamp:', new Date().toISOString())
  console.log('[Kick Member API] Authorization requirement: User must be STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Kick Member API] Authorization header present:', !!authHeader)
    console.log('[Kick Member API] Token present:', !!token)
    if (token) {
      console.log(
        '[Kick Member API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Kick Member API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId, userId } = await params
    console.log('[Kick Member API] Community ID:', communityId)
    console.log('[Kick Member API] User ID to kick:', userId)

    if (!communityId) {
      console.error('[Kick Member API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    if (!userId) {
      console.error('[Kick Member API] ERROR: No userId provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/members/${userId}/kick`
    console.log('[Kick Member API] Target URL:', targetUrl)

    console.log('[Kick Member API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Kick Member API] External API response received')
    console.log('[Kick Member API] Response status:', response.status, response.statusText)
    console.log('[Kick Member API] Response ok:', response.ok)
    console.log('[Kick Member API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Kick Member API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Kick Member API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Kick Member API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Kick Member API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Kick Member API] Request failed with status:', response.status)
      console.error('[Kick Member API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Kick Member API] Authorization failed: User must be STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be staff of this community to kick members.',
            details: errorData?.message || errorData?.error || errorText || 'Insufficient permissions',
            authorizationRequired: {
              isStaff: true,
            },
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to kick member',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // 204 No Content is a successful response for POST
    if (response.status === 204) {
      console.log('[Kick Member API] Success! Member kicked (204 No Content)')
      return new NextResponse(null, { status: 204 })
    }

    const contentType = response.headers.get('content-type')
    console.log('[Kick Member API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Kick Member API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Kick Member API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Kick Member API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Kick Member API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Kick Member API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Kick Member API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Kick Member API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Kick Member API] Error stack:',
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

