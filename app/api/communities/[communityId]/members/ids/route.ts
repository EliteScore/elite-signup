import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/members/ids
 * 
 * Gets all member IDs for a community.
 * 
 * Query Parameters:
 * - limit (optional, default 1000)
 * - offset (optional, default 0)
 * 
 * Authorization: Required (JWT token)
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
    
    console.log('[Get Community Member IDs API] Query params - limit:', limit, 'offset:', offset)

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/members/ids?limit=${limit}&offset=${offset}`
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
    console.log('[Get Community Member IDs API] ===== Request completed successfully =====')
    
    return NextResponse.json(data, { status: 200 })
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

