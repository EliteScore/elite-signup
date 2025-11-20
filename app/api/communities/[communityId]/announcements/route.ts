import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/community/{communityId}/announcements
 * 
 * Fetches all announcements for a community.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Get Announcements API] ===== Request received =====')
  console.log('[Get Announcements API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Announcements API] Authorization header present:', !!authHeader)
    console.log('[Get Announcements API] Token present:', !!token)
    if (token) {
      console.log(
        '[Get Announcements API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Get Announcements API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Get Announcements API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Announcements API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/community/${communityId}/announcements`
    console.log('[Get Announcements API] Target URL:', targetUrl)

    console.log('[Get Announcements API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Get Announcements API] External API response received')
    console.log('[Get Announcements API] Response status:', response.status, response.statusText)
    console.log('[Get Announcements API] Response ok:', response.ok)
    console.log('[Get Announcements API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Get Announcements API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Get Announcements API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Announcements API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Announcements API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Announcements API] Request failed with status:', response.status)
      console.error('[Get Announcements API] Error details:', errorData || errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch announcements',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Get Announcements API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Get Announcements API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Get Announcements API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Get Announcements API] Success! Response data structure:', {
      hasSuccess: 'success' in data,
      success: data?.success,
      hasData: 'data' in data,
      dataIsArray: Array.isArray(data?.data),
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
      isArray: Array.isArray(data),
      arrayLength: Array.isArray(data) ? data.length : 'N/A',
    })
    
    if (data && typeof data === 'object' && 'data' in data) {
      console.log('[Get Announcements API] Response data count:', Array.isArray(data.data) ? data.data.length : 'N/A')
    } else if (Array.isArray(data)) {
      console.log('[Get Announcements API] Response array count:', data.length)
    }
    
    console.log('[Get Announcements API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Get Announcements API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Get Announcements API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Get Announcements API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Get Announcements API] Error stack:',
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

/**
 * POST /v1/community/{communityId}/announcements
 * 
 * Creates a new announcement for a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Create Announcement API] ===== Request received =====')
  console.log('[Create Announcement API] Timestamp:', new Date().toISOString())
  console.log('[Create Announcement API] Authorization requirement: User must be both MEMBER and STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Create Announcement API] Authorization header present:', !!authHeader)
    console.log('[Create Announcement API] Token present:', !!token)
    if (token) {
      console.log(
        '[Create Announcement API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Create Announcement API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Create Announcement API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Create Announcement API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    let body: any = null
    try {
      body = await request.json()
      console.log('[Create Announcement API] Request body received:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('[Create Announcement API] ERROR: Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      )
    }

    if (!body || typeof body !== 'object') {
      console.error('[Create Announcement API] ERROR: Invalid request body structure')
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 },
      )
    }

    const title = body?.title?.trim()
    const description = body?.description?.trim()

    console.log('[Create Announcement API] Title:', title)
    console.log('[Create Announcement API] Description:', description)

    if (!title) {
      console.error('[Create Announcement API] ERROR: Title is required')
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      )
    }

    if (!description) {
      console.error('[Create Announcement API] ERROR: Description is required')
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/community/${communityId}/announcements`
    console.log('[Create Announcement API] Target URL:', targetUrl)

    const payload = {
      title,
      description,
    }
    console.log('[Create Announcement API] Request payload:', JSON.stringify(payload, null, 2))

    console.log('[Create Announcement API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    console.log('[Create Announcement API] External API response received')
    console.log('[Create Announcement API] Response status:', response.status, response.statusText)
    console.log('[Create Announcement API] Response ok:', response.ok)
    console.log('[Create Announcement API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Create Announcement API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Create Announcement API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Create Announcement API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Create Announcement API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Create Announcement API] Request failed with status:', response.status)
      console.error('[Create Announcement API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Create Announcement API] Authorization failed: User must be both MEMBER and STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be both a member and staff of this community to create announcements.',
            details: errorData?.message || errorData?.error || errorText || 'Insufficient permissions',
            authorizationRequired: {
              isMember: true,
              isStaff: true,
            },
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create announcement',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Create Announcement API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Create Announcement API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Create Announcement API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Create Announcement API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Create Announcement API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Create Announcement API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Create Announcement API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Create Announcement API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Create Announcement API] Error stack:',
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

