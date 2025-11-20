import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * POST /v1/communities/{communityId}/join-requests/{requestId}/approve
 * 
 * Approves a join request for a community (admin only).
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT)
 * - User must be the owner/admin of the community
 * 
 * Responses:
 * - 200 OK: Request approved successfully
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not the owner/admin of this community
 * - 404 Not Found: Community or request not found
 * - 500 Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; requestId: string }> }
) {
  console.log('[Approve Join Request API] ===== Request received =====')
  console.log('[Approve Join Request API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Approve Join Request API] Authorization header present:', !!authHeader)
    console.log('[Approve Join Request API] Token present:', !!token)

    if (!token) {
      console.error('[Approve Join Request API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId, requestId } = await params
    console.log('[Approve Join Request API] Community ID:', communityId)
    console.log('[Approve Join Request API] Request ID:', requestId)

    if (!communityId) {
      console.error('[Approve Join Request API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    if (!requestId) {
      console.error('[Approve Join Request API] ERROR: No requestId provided')
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/join-requests/${requestId}/approve`
    console.log('[Approve Join Request API] Target URL:', targetUrl)

    console.log('[Approve Join Request API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log('[Approve Join Request API] External API response received')
    console.log('[Approve Join Request API] Response status:', response.status, response.statusText)
    console.log('[Approve Join Request API] Response ok:', response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Approve Join Request API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Approve Join Request API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Approve Join Request API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Approve Join Request API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Approve Join Request API] Request failed with status:', response.status)
      console.error('[Approve Join Request API] Error details:', errorText)

      // Handle 403 Forbidden - user is not admin/owner
      if (response.status === 403) {
        console.error('[Approve Join Request API] Authorization failed: User must be the owner/admin of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be the owner or admin of this community to approve join requests.',
            details: errorText?.message || errorText?.error || errorText || 'Insufficient permissions',
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to approve join request',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null)
    console.log('[Approve Join Request API] Success! Response data:', data ? JSON.stringify(data, null, 2) : 'No content (204)')
    console.log('[Approve Join Request API] Response status:', response.status)
    console.log('[Approve Join Request API] ===== Request completed successfully =====')
    return NextResponse.json(data || { success: true, message: 'Join request approved' }, { status: response.status === 204 ? 200 : response.status })
  } catch (error) {
    console.error('[Approve Join Request API] ===== EXCEPTION OCCURRED =====')
    console.error('[Approve Join Request API] Error:', error)
    console.error('[Approve Join Request API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Approve Join Request API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

