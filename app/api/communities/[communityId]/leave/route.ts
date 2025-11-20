import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * POST /v1/communities/{communityId}/leave
 * 
 * Leaves a community.
 * 
 * Authorization: Required (JWT token)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Leave Community API] ===== Request received =====')
  console.log('[Leave Community API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Leave Community API] Authorization header present:', !!authHeader)
    console.log('[Leave Community API] Token present:', !!token)
    if (token) {
      console.log(
        '[Leave Community API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Leave Community API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { communityId } = await params

    console.log('[Leave Community API] Community ID:', communityId)

    if (!communityId) {
      console.error('[Leave Community API] ERROR: No communityId provided')
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}/leave`
    console.log('[Leave Community API] Target URL:', targetUrl)

    console.log('[Leave Community API] Making fetch request to external API...')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    console.log('[Leave Community API] External API response received')
    console.log('[Leave Community API] Response status:', response.status, response.statusText)
    console.log('[Leave Community API] Response ok:', response.ok)
    console.log('[Leave Community API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Leave Community API] Response content-type:', contentType)

        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log('[Leave Community API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Leave Community API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Leave Community API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      console.error('[Leave Community API] Request failed with status:', response.status)
      console.error('[Leave Community API] Error details:', errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to leave community',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    // Handle 204 No Content or 200 OK
    let data: any = null
    if (response.status === 204) {
      console.log('[Leave Community API] Success! (204 No Content)')
      data = { success: true, message: 'Successfully left community' }
    } else {
      try {
        data = await response.json()
        console.log('[Leave Community API] Success! Response data:', JSON.stringify(data, null, 2))
      } catch (parseError) {
        console.log('[Leave Community API] Success! (No response body)')
        data = { success: true, message: 'Successfully left community' }
      }
    }

    console.log('[Leave Community API] ===== Request completed successfully =====')
    return NextResponse.json(data, { status: response.status === 204 ? 200 : response.status })
  } catch (error) {
    console.error('[Leave Community API] ===== EXCEPTION OCCURRED =====')
    console.error('[Leave Community API] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Leave Community API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Leave Community API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')

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

