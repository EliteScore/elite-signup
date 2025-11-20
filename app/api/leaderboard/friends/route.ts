import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /leaderboard/friends
 * 
 * Return a leaderboard composed of the current user and their mutual friends, sorted by XP descending.
 * 
 * Query Parameters:
 * - limit (int) — default 50
 */
export async function GET(request: NextRequest) {
  console.log('[Leaderboard Friends API] ===== Request received =====')
  console.log('[Leaderboard Friends API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Leaderboard Friends API] Authorization header present:', !!authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '50'

    const targetUrl = new URL(`${API_BASE_URL}v1/leaderboard/friends`)
    targetUrl.searchParams.set('limit', limit)

    console.log('[Leaderboard Friends API] Target URL:', targetUrl.toString())

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    console.log('[Leaderboard Friends API] Making fetch request with headers:', JSON.stringify(headers, null, 2))
    
    let response: Response
    try {
      response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
      })
    } catch (fetchError) {
      console.error('[Leaderboard Friends API] Fetch error:', fetchError)
      return NextResponse.json(
        {
          error: 'Failed to connect to external API',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 502 },
      )
    }

    console.log('[Leaderboard Friends API] External API response status:', response.status, response.statusText)
    console.log('[Leaderboard Friends API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData: any = null
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('[Leaderboard Friends API] Error response text:', errorText)
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
            console.error('[Leaderboard Friends API] Error response JSON:', JSON.stringify(errorData, null, 2))
          } catch {
            errorData = { message: errorText }
          }
        }
      } catch (readError) {
        console.error('[Leaderboard Friends API] Error reading response:', readError)
        errorData = { message: `Status ${response.status}: ${response.statusText}` }
      }

      return NextResponse.json(
        {
          error: errorData?.message || errorData?.error || 'Failed to fetch friends leaderboard',
          status: response.status,
          details: errorText || undefined,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('[Leaderboard Friends API] Successfully fetched friends leaderboard')
    console.log('[Leaderboard Friends API] Response data:', data)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Leaderboard Friends API] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

