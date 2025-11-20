import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/community/{communityId}/announcements/{id}
 * 
 * Gets a single announcement by ID for a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * 
 * The backend will return 403 Forbidden if not authorized.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; id: string }> },
) {
  console.log('[Get Announcement API] ===== Request received =====')
  console.log('[Get Announcement API] Timestamp:', new Date().toISOString())
  console.log('[Get Announcement API] Authorization requirement: User must be a MEMBER of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Announcement API] Authorization header present:', !!authHeader)
    console.log('[Get Announcement API] Token present:', !!token)
    if (token) {
      console.log(
        '[Get Announcement API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Get Announcement API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId, id } = await params
    console.log('[Get Announcement API] Community ID:', communityId)
    console.log('[Get Announcement API] Announcement ID:', id)

    if (!communityId) {
      console.error('[Get Announcement API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    if (!id) {
      console.error('[Get Announcement API] ERROR: No announcement ID provided')
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/community/${communityId}/announcements/${id}`
    console.log('[Get Announcement API] Target URL:', targetUrl)

    console.log('[Get Announcement API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Get Announcement API] External API response received')
    console.log('[Get Announcement API] Response status:', response.status, response.statusText)
    console.log('[Get Announcement API] Response ok:', response.ok)
    console.log('[Get Announcement API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Get Announcement API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Get Announcement API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Announcement API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Announcement API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Announcement API] Request failed with status:', response.status)
      console.error('[Get Announcement API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Get Announcement API] Authorization failed: User must be a MEMBER of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be a member of this community to view announcements.',
            details: errorData?.message || errorData?.error || errorText || 'Insufficient permissions',
            authorizationRequired: {
              isMember: true,
            },
          },
          { status: 403 },
        )
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not Found',
            message: 'Announcement not found',
            details: errorData?.message || errorData?.error || errorText || 'The requested announcement does not exist',
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch announcement',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Get Announcement API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Get Announcement API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Get Announcement API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Get Announcement API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Get Announcement API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Get Announcement API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Get Announcement API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Get Announcement API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Get Announcement API] Error stack:',
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
 * PUT /v1/community/{communityId}/announcements/{id}
 * 
 * Updates an existing announcement for a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; id: string }> },
) {
  console.log('[Update Announcement API] ===== Request received =====')
  console.log('[Update Announcement API] Timestamp:', new Date().toISOString())
  console.log('[Update Announcement API] Authorization requirement: User must be both MEMBER and STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Update Announcement API] Authorization header present:', !!authHeader)
    console.log('[Update Announcement API] Token present:', !!token)
    if (token) {
      console.log(
        '[Update Announcement API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Update Announcement API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId, id } = await params
    console.log('[Update Announcement API] Community ID:', communityId)
    console.log('[Update Announcement API] Announcement ID:', id)

    if (!communityId) {
      console.error('[Update Announcement API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    if (!id) {
      console.error('[Update Announcement API] ERROR: No announcement ID provided')
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 },
      )
    }

    let body: any = null
    try {
      body = await request.json()
      console.log('[Update Announcement API] Request body received:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('[Update Announcement API] ERROR: Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      )
    }

    if (!body || typeof body !== 'object') {
      console.error('[Update Announcement API] ERROR: Invalid request body structure')
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 },
      )
    }

    const title = body?.title?.trim()
    const description = body?.description?.trim()

    console.log('[Update Announcement API] Title:', title)
    console.log('[Update Announcement API] Description:', description)

    if (!title) {
      console.error('[Update Announcement API] ERROR: Title is required')
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      )
    }

    if (!description) {
      console.error('[Update Announcement API] ERROR: Description is required')
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/community/${communityId}/announcements/${id}`
    console.log('[Update Announcement API] Target URL:', targetUrl)

    const payload = {
      title,
      description,
    }
    console.log('[Update Announcement API] Request payload:', JSON.stringify(payload, null, 2))

    console.log('[Update Announcement API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    console.log('[Update Announcement API] External API response received')
    console.log('[Update Announcement API] Response status:', response.status, response.statusText)
    console.log('[Update Announcement API] Response ok:', response.ok)
    console.log('[Update Announcement API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Update Announcement API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Update Announcement API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Update Announcement API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Update Announcement API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Update Announcement API] Request failed with status:', response.status)
      console.error('[Update Announcement API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Update Announcement API] Authorization failed: User must be both MEMBER and STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be both a member and staff of this community to update announcements.',
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
          error: 'Failed to update announcement',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Update Announcement API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Update Announcement API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Update Announcement API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Update Announcement API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Update Announcement API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Update Announcement API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Update Announcement API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Update Announcement API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Update Announcement API] Error stack:',
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
 * DELETE /v1/community/{communityId}/announcements/{id}
 * 
 * Deletes an announcement from a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; id: string }> },
) {
  console.log('[Delete Announcement API] ===== Request received =====')
  console.log('[Delete Announcement API] Timestamp:', new Date().toISOString())
  console.log('[Delete Announcement API] Authorization requirement: User must be both MEMBER and STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Delete Announcement API] Authorization header present:', !!authHeader)
    console.log('[Delete Announcement API] Token present:', !!token)
    if (token) {
      console.log(
        '[Delete Announcement API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Delete Announcement API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId, id } = await params
    console.log('[Delete Announcement API] Community ID:', communityId)
    console.log('[Delete Announcement API] Announcement ID:', id)

    if (!communityId) {
      console.error('[Delete Announcement API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    if (!id) {
      console.error('[Delete Announcement API] ERROR: No announcement ID provided')
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/community/${communityId}/announcements/${id}`
    console.log('[Delete Announcement API] Target URL:', targetUrl)

    console.log('[Delete Announcement API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Delete Announcement API] External API response received')
    console.log('[Delete Announcement API] Response status:', response.status, response.statusText)
    console.log('[Delete Announcement API] Response ok:', response.ok)
    console.log('[Delete Announcement API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Delete Announcement API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Delete Announcement API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Delete Announcement API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Delete Announcement API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Delete Announcement API] Request failed with status:', response.status)
      console.error('[Delete Announcement API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Delete Announcement API] Authorization failed: User must be both MEMBER and STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be both a member and staff of this community to delete announcements.',
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
          error: 'Failed to delete announcement',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // 204 No Content - successful deletion
    console.log('[Delete Announcement API] Success! Announcement deleted (204 No Content)')
    console.log('[Delete Announcement API] ===== Request completed successfully =====')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Delete Announcement API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Delete Announcement API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Delete Announcement API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Delete Announcement API] Error stack:',
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

