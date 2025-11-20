import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/tags
 * 
 * Gets tags for a community.
 * 
 * Authorization Requirements:
 * - Auth: Optional (JWT)
 * 
 * Responses:
 * - 200 OK: Tags for the community
 *   {
 *     "community_id": 123,
 *     "tags": ["fitness", "europe", "beginners"]
 *   }
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log('[Get Community Tags API] ===== Request received =====')
  console.log('[Get Community Tags API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Get Community Tags API] Authorization header present:', !!authHeader)
    console.log('[Get Community Tags API] Token present:', !!token)

    const { communityId } = await params
    console.log('[Get Community Tags API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Get Community Tags API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/tags`
    console.log('[Get Community Tags API] Target URL:', targetUrl)

    console.log('[Get Community Tags API] Making fetch request to external API...')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    console.log('[Get Community Tags API] External API response received')
    console.log('[Get Community Tags API] Response status:', response.status, response.statusText)
    console.log('[Get Community Tags API] Response ok:', response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Get Community Tags API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Get Community Tags API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Get Community Tags API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Get Community Tags API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Get Community Tags API] Request failed with status:', response.status)
      console.error('[Get Community Tags API] Error details:', errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tags',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Get Community Tags API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Get Community Tags API] Response status:', response.status)
    console.log('[Get Community Tags API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Get Community Tags API] ===== EXCEPTION OCCURRED =====')
    console.error('[Get Community Tags API] Error:', error)
    console.error('[Get Community Tags API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Get Community Tags API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * POST /v1/communities/{communityId}/tags
 * 
 * Adds tags to a community (admin/owner only).
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT)
 * - User must be the owner/admin of the community
 * 
 * Request Body:
 * {
 *   "tags": ["gaming", "pc", "europe"]
 * }
 * 
 * Responses:
 * - 200 OK: Tags added successfully
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not the owner/admin of this community
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log('[Add Community Tags API] ===== Request received =====')
  console.log('[Add Community Tags API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Add Community Tags API] Authorization header present:', !!authHeader)
    console.log('[Add Community Tags API] Token present:', !!token)

    if (!token) {
      console.error('[Add Community Tags API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId } = await params
    console.log('[Add Community Tags API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Add Community Tags API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    let requestBody: any = null
    try {
      const bodyText = await request.text()
      if (bodyText && bodyText.trim()) {
        try {
          requestBody = JSON.parse(bodyText)
          console.log('[Add Community Tags API] Request body:', JSON.stringify(requestBody, null, 2))
        } catch (parseError) {
          console.error('[Add Community Tags API] ERROR: Invalid JSON in request body:', parseError)
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }
      } else {
        console.error('[Add Community Tags API] ERROR: Empty request body')
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
    } catch (readError) {
      console.error('[Add Community Tags API] ERROR: Failed to read request body:', readError)
      return NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      )
    }

    if (!requestBody.tags || !Array.isArray(requestBody.tags)) {
      console.error('[Add Community Tags API] ERROR: Invalid tags format')
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/tags`
    console.log('[Add Community Tags API] Target URL:', targetUrl)

    console.log('[Add Community Tags API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[Add Community Tags API] External API response received')
    console.log('[Add Community Tags API] Response status:', response.status, response.statusText)
    console.log('[Add Community Tags API] Response ok:', response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Add Community Tags API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Add Community Tags API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Add Community Tags API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Add Community Tags API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Add Community Tags API] Request failed with status:', response.status)
      console.error('[Add Community Tags API] Error details:', errorText)

      // Handle 403 Forbidden - user is not admin/owner
      if (response.status === 403) {
        console.error('[Add Community Tags API] Authorization failed: User must be the owner/admin of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be the owner or admin of this community to add tags.',
            details: errorText?.message || errorText?.error || errorText || 'Insufficient permissions',
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add tags',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null)
    console.log('[Add Community Tags API] Success! Response data:', data ? JSON.stringify(data, null, 2) : 'No content (204)')
    console.log('[Add Community Tags API] Response status:', response.status)
    console.log('[Add Community Tags API] ===== Request completed successfully =====')
    return NextResponse.json(data || { success: true, message: 'Tags added successfully' }, { status: response.status === 204 ? 200 : response.status })
  } catch (error) {
    console.error('[Add Community Tags API] ===== EXCEPTION OCCURRED =====')
    console.error('[Add Community Tags API] Error:', error)
    console.error('[Get Community Tags API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Add Community Tags API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /v1/communities/{communityId}/tags
 * 
 * Updates tags for a community (admin/owner only).
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT)
 * - User must be the owner/admin of the community
 * 
 * Request Body:
 * {
 *   "tags": ["gaming", "pc", "europe"]
 * }
 * 
 * Responses:
 * - 200 OK: Tags updated successfully
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not the owner/admin of this community
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log('[Update Community Tags API] ===== Request received =====')
  console.log('[Update Community Tags API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Update Community Tags API] Authorization header present:', !!authHeader)
    console.log('[Update Community Tags API] Token present:', !!token)

    if (!token) {
      console.error('[Update Community Tags API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId } = await params
    console.log('[Update Community Tags API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Update Community Tags API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    let requestBody: any = null
    try {
      const bodyText = await request.text()
      if (bodyText && bodyText.trim()) {
        try {
          requestBody = JSON.parse(bodyText)
          console.log('[Update Community Tags API] Request body:', JSON.stringify(requestBody, null, 2))
        } catch (parseError) {
          console.error('[Update Community Tags API] ERROR: Invalid JSON in request body:', parseError)
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }
      } else {
        console.error('[Update Community Tags API] ERROR: Empty request body')
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
    } catch (readError) {
      console.error('[Update Community Tags API] ERROR: Failed to read request body:', readError)
      return NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      )
    }

    if (!requestBody.tags || !Array.isArray(requestBody.tags)) {
      console.error('[Update Community Tags API] ERROR: Invalid tags format')
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/tags`
    console.log('[Update Community Tags API] Target URL:', targetUrl)

    console.log('[Update Community Tags API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[Update Community Tags API] External API response received')
    console.log('[Update Community Tags API] Response status:', response.status, response.statusText)
    console.log('[Update Community Tags API] Response ok:', response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Update Community Tags API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Update Community Tags API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Update Community Tags API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Update Community Tags API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Update Community Tags API] Request failed with status:', response.status)
      console.error('[Update Community Tags API] Error details:', errorText)

      // Handle 403 Forbidden - user is not admin/owner
      if (response.status === 403) {
        console.error('[Update Community Tags API] Authorization failed: User must be the owner/admin of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be the owner or admin of this community to update tags.',
            details: errorText?.message || errorText?.error || errorText || 'Insufficient permissions',
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update tags',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null)
    console.log('[Update Community Tags API] Success! Response data:', data ? JSON.stringify(data, null, 2) : 'No content (204)')
    console.log('[Update Community Tags API] Response status:', response.status)
    console.log('[Update Community Tags API] ===== Request completed successfully =====')
    return NextResponse.json(data || { success: true, message: 'Tags updated successfully' }, { status: response.status === 204 ? 200 : response.status })
  } catch (error) {
    console.error('[Update Community Tags API] ===== EXCEPTION OCCURRED =====')
    console.error('[Update Community Tags API] Error:', error)
    console.error('[Update Community Tags API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Update Community Tags API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

