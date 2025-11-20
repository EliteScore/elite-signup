import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/members/ids
 * 
 * Gets member IDs for a community.
 * 
 * Query Parameters:
 * - status (optional, CSV string, default: "active") - Filter by member status (e.g., "active", "alumni", "active,alumni")
 * - limit (optional, default: 1000, max: 10000) - Maximum number of results
 * - offset (optional, default: 0) - Pagination offset
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT token)
 * 
 * Responses:
 * - 200 OK: { "community_id": number, "user_ids": number[], "total": number, "limit": number, "offset": number } or backend response body
 * - 401 Unauthorized: No token provided
 * - 400 Bad Request: Invalid community ID or query parameters
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Get Community Member IDs API] ===== Request received =====')
  console.log('[Get Community Member IDs API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Community Member IDs API] Authorization header present:', !!authHeader)
    console.log('[Get Community Member IDs API] Token present:', !!token)
    if (token) {
      console.log(
        '[Get Community Member IDs API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Get Community Member IDs API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Get Community Member IDs API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Community Member IDs API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '1000'
    const offset = searchParams.get('offset') || '0'
    const status = searchParams.get('status') || 'active'
    
    console.log('[Get Community Member IDs API] Query params - status:', status, 'limit:', limit, 'offset:', offset)

    // Build query parameters
    const queryParams = new URLSearchParams({
      limit,
      offset,
      status,
    })

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/members/ids?${queryParams.toString()}`
    console.log('[Get Community Member IDs API] Target URL:', targetUrl)

    console.log('[Get Community Member IDs API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Get Community Member IDs API] External API response received')
    console.log('[Get Community Member IDs API] Response status:', response.status, response.statusText)
    console.log('[Get Community Member IDs API] Response ok:', response.ok)

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Get Community Member IDs API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Community Member IDs API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Community Member IDs API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Community Member IDs API] Request failed with status:', response.status)
      console.error('[Get Community Member IDs API] Error details:', errorData || errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch member IDs',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('[Get Community Member IDs API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Get Community Member IDs API] Total members:', data?.total || 0)
    console.log('[Get Community Member IDs API] Member IDs count:', data?.user_ids?.length || 0)
    console.log('[Get Community Member IDs API] Response status:', response.status)
    console.log('[Get Community Member IDs API] ===== Request completed successfully =====')
    
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Get Community Member IDs API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Get Community Member IDs API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Get Community Member IDs API] Error message:',
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

