import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

/**
 * GET /v1/users/social/get_streaks_feed
 * 
 * Get streaks feed from people the current user follows.
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT; backend resolves userId from token into request attributes)
 * 
 * Query Parameters:
 * - day (string, optional): Filter by specific day (format: YYYY-MM-DD)
 * - limit (number, optional, default 50): Maximum number of results to return
 * 
 * Responses:
 * - 200 OK: Success
 *   {
 *     "success": true,
 *     "message": "Streaks from people you follow (N)",
 *     "data": [
 *       { "current_streak": 12, "user_id": 55, ... }
 *     ]
 *   }
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: DB / server issues
 * 
 * Example — cURL:
 * curl -X GET "$BASE/v1/users/social/get_streaks_feed?day=2025-03-01&limit=20" \
 *   -H "Authorization: Bearer <token>"
 */

// Cache duration: 5 minutes (300 seconds)
const CACHE_REVALIDATE = 300

async function fetchStreaksFeed(token: string, day: string | undefined, limit: string) {
    let targetUrl = `${API_BASE_URL}v1/users/social/get_streaks_feed`
    if (day) {
      targetUrl += `?day=${day}&limit=${limit}`
    } else {
      targetUrl += `?limit=${limit}`
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    // Add cache control to the external fetch
    next: { revalidate: CACHE_REVALIDATE }
    })

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch {
        errorText = response.statusText
      }

      // Convert error to string if it's an object
      const errorMessage = typeof errorText === 'object' 
        ? (errorText?.message || errorText?.error || JSON.stringify(errorText))
        : (errorText || 'Failed to fetch streaks feed')
      
      throw new Error(errorMessage)
    }

  return await response.json()
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const day = searchParams.get('day') || undefined
    const limit = searchParams.get('limit') || '50'

    // Create a cache key based on token, day, and limit
    const cacheKey = `streaks-feed-${day || 'all'}-${limit}`
    
    // Use unstable_cache to cache the response per user (token-based)
    const getCachedFeed = unstable_cache(
      async () => fetchStreaksFeed(token, day, limit),
      [cacheKey, token.substring(0, 10)], // Include partial token in key for user-specific caching
      {
        revalidate: CACHE_REVALIDATE,
        tags: ['streaks-feed', `streaks-feed-${day || 'all'}`]
      }
    )

    const data = await getCachedFeed()
    
    // Debug log for streaks feed
    console.log(`[API] Streaks feed response: ${data?.data?.length || 0} items for day ${day || 'all'}`)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_REVALIDATE}, stale-while-revalidate=${CACHE_REVALIDATE * 2}`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

