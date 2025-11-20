import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * PUT /v1/communities/{communityId}/pfp
 * 
 * Updates the profile picture for a community.
 * 
 * Request: multipart/form-data with a "file" field containing the image
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Update Community PFP API] ===== Request received =====')
  console.log('[Update Community PFP API] Timestamp:', new Date().toISOString())
  console.log('[Update Community PFP API] Authorization requirement: User must be both MEMBER and STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Update Community PFP API] Authorization header present:', !!authHeader)
    console.log('[Update Community PFP API] Token present:', !!token)
    if (token) {
      console.log(
        '[Update Community PFP API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Update Community PFP API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Update Community PFP API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Update Community PFP API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    console.log('[Update Community PFP API] File received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    })

    if (!file) {
      console.error('[Update Community PFP API] ERROR: No file provided')
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 },
      )
    }

    // Validate file type (images only)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(file.type)) {
      console.error('[Update Community PFP API] ERROR: Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 },
      )
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('[Update Community PFP API] ERROR: File too large:', file.size)
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/pfp`
    console.log('[Update Community PFP API] Target URL:', targetUrl)

    // Create FormData for the backend request
    const backendFormData = new FormData()
    backendFormData.append('file', file)

    console.log('[Update Community PFP API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - let fetch set it with boundary for FormData
      },
      body: backendFormData,
    })

    console.log('[Update Community PFP API] External API response received')
    console.log('[Update Community PFP API] Response status:', response.status, response.statusText)
    console.log('[Update Community PFP API] Response ok:', response.ok)
    console.log('[Update Community PFP API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Update Community PFP API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Update Community PFP API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Update Community PFP API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Update Community PFP API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Update Community PFP API] Request failed with status:', response.status)
      console.error('[Update Community PFP API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Update Community PFP API] Authorization failed: User must be both MEMBER and STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be both a member and staff of this community to update the profile picture.',
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
          error: 'Failed to update profile picture',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Update Community PFP API] Response content-type:', contentType)

    // Handle different response types
    let data: any = null
    if (contentType?.includes('application/json')) {
      data = await response.json().catch((err) => {
        console.error('[Update Community PFP API] ERROR: Failed to parse JSON:', err)
        return null
      })
    } else {
      // If not JSON, might be text or empty
      const text = await response.text().catch(() => '')
      console.log('[Update Community PFP API] Response text:', text)
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: 'Profile picture updated successfully' }
        }
      } else {
        data = { message: 'Profile picture updated successfully' }
      }
    }

    console.log('[Update Community PFP API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Update Community PFP API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Update Community PFP API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Update Community PFP API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Update Community PFP API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Update Community PFP API] Error stack:',
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
 * DELETE /v1/communities/{communityId}/pfp
 * 
 * Deletes the profile picture for a community.
 * 
 * Authorization Requirements (enforced by backend):
 * - User must be a member of the community (RoleGuard.isMember(userId, communityId))
 * - User must be staff of the community (RoleGuard.isStaff(userId, communityId))
 * 
 * Both conditions must be satisfied. The backend will return 403 Forbidden if not authorized.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Delete Community PFP API] ===== Request received =====')
  console.log('[Delete Community PFP API] Timestamp:', new Date().toISOString())
  console.log('[Delete Community PFP API] Authorization requirement: User must be both MEMBER and STAFF of the community')

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Delete Community PFP API] Authorization header present:', !!authHeader)
    console.log('[Delete Community PFP API] Token present:', !!token)
    if (token) {
      console.log(
        '[Delete Community PFP API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Delete Community PFP API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params
    console.log('[Delete Community PFP API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Delete Community PFP API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/pfp`
    console.log('[Delete Community PFP API] Target URL:', targetUrl)

    console.log('[Delete Community PFP API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Delete Community PFP API] External API response received')
    console.log('[Delete Community PFP API] Response status:', response.status, response.statusText)
    console.log('[Delete Community PFP API] Response ok:', response.ok)
    console.log('[Delete Community PFP API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null

      try {
        const contentType = response.headers.get('content-type')
        console.log('[Delete Community PFP API] Error response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Delete Community PFP API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Delete Community PFP API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Delete Community PFP API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Delete Community PFP API] Request failed with status:', response.status)
      console.error('[Delete Community PFP API] Error details:', errorData || errorText)

      // Handle 403 Forbidden - user doesn't have required roles
      if (response.status === 403) {
        console.error('[Delete Community PFP API] Authorization failed: User must be both MEMBER and STAFF of the community')
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be both a member and staff of this community to delete the profile picture.',
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
          error: 'Failed to delete profile picture',
          message: errorData?.message || errorData?.error || errorText || response.statusText,
          details: errorData?.details || errorData?.message || errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // 204 No Content is a successful response for DELETE
    if (response.status === 204) {
      console.log('[Delete Community PFP API] Success! Profile picture deleted (204 No Content)')
      return new NextResponse(null, { status: 204 })
    }

    const contentType = response.headers.get('content-type')
    console.log('[Delete Community PFP API] Response content-type:', contentType)

    const data = await response.json().catch((err) => {
      console.error('[Delete Community PFP API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Delete Community PFP API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        {
          success: false,
          error: 'Empty response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Delete Community PFP API] Success! Response data:', JSON.stringify(data, null, 2))
    console.log('[Delete Community PFP API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Delete Community PFP API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Delete Community PFP API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Delete Community PFP API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Delete Community PFP API] Error stack:',
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

