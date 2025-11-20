import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/join-requests
 * 
 * Gets all join requests for a community (admin only).
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT)
 * - User must be the owner/admin of the community
 * 
 * Query Parameters:
 * - limit: number (optional, default: 50)
 * - offset: number (optional, default: 0)
 * 
 * Responses:
 * - 200 OK: List of join requests
 *   {
 *     "items": [
 *       {
 *         "id": 123,
 *         "requester_id": 456,
 *         "message": "I'd like to join",
 *         "status": "pending",
 *         "decided_by": null,
 *         "decided_at": null,
 *         "created_at": "2025-01-01T12:34:56Z"
 *       }
 *     ],
 *     "total": 1,
 *     "limit": 50,
 *     "offset": 0
 *   }
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not the owner/admin of this community
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log('[Get Join Requests API] ===== Request received =====')
  console.log('[Get Join Requests API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Join Requests API] Authorization header present:', !!authHeader)
    console.log('[Get Join Requests API] Token present:', !!token)

    if (!token) {
      console.error('[Get Join Requests API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId } = await params
    console.log('[Get Join Requests API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Join Requests API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/join-requests?limit=${limit}&offset=${offset}`
    console.log('[Get Join Requests API] Target URL:', targetUrl)

    console.log('[Get Join Requests API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Get Join Requests API] External API response received')
    console.log('[Get Join Requests API] Response status:', response.status, response.statusText)
    console.log('[Get Join Requests API] Response ok:', response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Get Join Requests API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Get Join Requests API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Join Requests API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Join Requests API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Join Requests API] Request failed with status:', response.status)
      console.error('[Get Join Requests API] Error details:', errorText)

      // Handle 403 Forbidden - user is not admin/owner
      if (response.status === 403) {
        console.error('[Get Join Requests API] Authorization failed: User must be the owner/admin of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be the owner or admin of this community to view join requests.',
            details: errorText?.message || errorText?.error || errorText || 'Insufficient permissions',
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch join requests',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Get Join Requests API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Get Join Requests API] Response status:', response.status)
    console.log('[Get Join Requests API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Get Join Requests API] ===== EXCEPTION OCCURRED =====')
    console.error('[Get Join Requests API] Error:', error)
    console.error('[Get Join Requests API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Get Join Requests API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

