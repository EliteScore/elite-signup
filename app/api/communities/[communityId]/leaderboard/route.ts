import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}/leaderboard
 * 
 * Return an XP leaderboard for users in a community.
 * 
 * Query Parameters:
 * - from (string, optional): ISO8601 timestamp (inclusive). Default: "1970-01-01T00:00:00Z"
 * - to (string, optional): ISO8601 timestamp (exclusive). Default: now
 * - roles (list of string, optional): Roles filter for members. Default: ["leader", "officer", "member"]
 * - statuses (list of string, optional): Membership status filter. Default: ["active"]
 * - limit (int, default 100, clamped to 1..500)
 * - offset (int, default 0, min 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log('[Community Leaderboard API] ===== Request received =====')
  console.log('[Community Leaderboard API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Community Leaderboard API] Authorization header present:', !!authHeader)

    const { communityId } = await params
    const communityIdNum = Number(communityId)
    
    if (Number.isNaN(communityIdNum)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 },
      )
    }

    const targetUrl = new URL(`${API_BASE_URL}v1/communities/${communityIdNum}/leaderboard`)
    const searchParams = request.nextUrl.searchParams

    // Add query parameters
    const from = searchParams.get('from')
    if (from) {
      targetUrl.searchParams.set('from', from)
    }

    const to = searchParams.get('to')
    if (to) {
      targetUrl.searchParams.set('to', to)
    }

    const roles = searchParams.getAll('roles')
    if (roles.length > 0) {
      roles.forEach(role => targetUrl.searchParams.append('roles', role))
    }

    const statuses = searchParams.getAll('statuses')
    if (statuses.length > 0) {
      statuses.forEach(status => targetUrl.searchParams.append('statuses', status))
    }

    const limit = searchParams.get('limit')
    if (limit) {
      const limitNum = Number(limit)
      if (!Number.isNaN(limitNum) && limitNum >= 1 && limitNum <= 500) {
        targetUrl.searchParams.set('limit', limitNum.toString())
      }
    }

    const offset = searchParams.get('offset')
    if (offset) {
      const offsetNum = Number(offset)
      if (!Number.isNaN(offsetNum) && offsetNum >= 0) {
        targetUrl.searchParams.set('offset', offsetNum.toString())
      }
    }

    console.log('[Community Leaderboard API] Target URL:', targetUrl.toString())

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    console.log('[Community Leaderboard API] External API response status:', response.status, response.statusText)

    if (!response.ok) {
      let errorData: any = null
      try {
        const errorText = await response.text()
        if (errorText) {
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
        }
      } catch {
        // Ignore parse errors
      }

      return NextResponse.json(
        {
          error: errorData?.message || errorData?.error || 'Failed to fetch leaderboard',
          status: response.status,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('[Community Leaderboard API] Successfully fetched leaderboard')

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Community Leaderboard API] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

