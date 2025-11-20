import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

// This log should fire when the module loads (server-side)
console.log('[Challenges Feed API] ⚡ Route module loaded/imported at:', new Date().toISOString())

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

/**
 * GET /v1/users/social/get_challenges_feed
 * 
 * Get challenges feed from people the current user follows.
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
 *     "message": "Verified challenges from people you follow (N)",
 *     "data": [
 *       { "challenge_id": 123, "user_id": 55, ... }
 *     ]
 *   }
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: DB / server issues
 * 
 * Example — cURL:
 * curl -X GET "$BASE/v1/users/social/get_challenges_feed?day=2025-03-01&limit=20" \
 *   -H "Authorization: Bearer <token>"
 */

// Cache duration: 5 minutes (300 seconds)
const CACHE_REVALIDATE = 300

async function fetchChallengesFeed(token: string, day: string | undefined, limit: string) {
    console.log('[Challenges Feed API] ===== fetchChallengesFeed called =====')
    console.log('[Challenges Feed API] Input params:', { day, limit, tokenLength: token?.length || 0 })
    
    // Default day to today if not provided (format: yyyy-MM-dd)
    const today = new Date().toISOString().split('T')[0]
    const dayParam = day || today
    
    console.log('[Challenges Feed API] Using day:', dayParam, '(provided:', day || 'none, defaulted to today)')
    
    const targetUrl = `${API_BASE_URL}v1/users/social/get_challenges_feed?day=${dayParam}&limit=${limit}`
    console.log('[Challenges Feed API] Target URL:', targetUrl)
    console.log('[Challenges Feed API] API Base URL:', API_BASE_URL)

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store', // Don't cache the external fetch, we'll handle caching at route level
    })

    console.log('[Challenges Feed API] Response status:', response.status, response.statusText)
    console.log('[Challenges Feed API] Response ok:', response.ok)
    console.log('[Challenges Feed API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Challenges Feed API] Error response content-type:', contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.error('[Challenges Feed API] Error response (JSON):', JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.error('[Challenges Feed API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Challenges Feed API] Failed to read error response:', readError)
        errorText = response.statusText
      }

      // Convert error to string if it's an object
      const errorMessage = typeof errorText === 'object' 
        ? (errorText?.message || errorText?.error || JSON.stringify(errorText))
        : (errorText || 'Failed to fetch challenges feed')
      
      console.error('[Challenges Feed API] Throwing error:', errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[Challenges Feed API] Success! Response data:', {
      hasSuccess: 'success' in data,
      success: data?.success,
      hasData: 'data' in data,
      dataIsArray: Array.isArray(data?.data),
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
      message: data?.message,
    })
    
    if (Array.isArray(data?.data)) {
      console.log('[Challenges Feed API] Challenges count:', data.data.length)
      if (data.data.length > 0) {
        console.log('[Challenges Feed API] Sample challenge:', JSON.stringify(data.data[0], null, 2))
      }
    }
    
    console.log('[Challenges Feed API] ===== fetchChallengesFeed completed =====')
    return data
}

// This log should fire when the module loads
console.log('[Challenges Feed API] Route module loaded at:', new Date().toISOString())

export async function GET(request: NextRequest) {
  // Immediate log to confirm route is hit
  console.log('[Challenges Feed API] ===== GET request received =====')
  console.log('[Challenges Feed API] Timestamp:', new Date().toISOString())
  console.log('[Challenges Feed API] Request URL:', request.url)
  console.log('[Challenges Feed API] Request method:', request.method)
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    console.log('[Challenges Feed API] Authorization header present:', !!authHeader)
    console.log('[Challenges Feed API] Token present:', !!token)
    if (token) {
      console.log('[Challenges Feed API] Token preview:', `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }
    
    if (!token) {
      console.error('[Challenges Feed API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    // day is optional - if not provided, will default to today in fetchChallengesFeed
    const day = searchParams.get('day')?.trim() || undefined
    const limit = searchParams.get('limit') || '50'
    
    console.log('[Challenges Feed API] Request params:', { day, limit })
    console.log('[Challenges Feed API] All query params:', Object.fromEntries(searchParams.entries()))

    // Create a cache key based on token, day, and limit
    // Note: In production, consider using a user ID instead of token for better cache sharing
    const cacheKey = `challenges-feed-${day || 'all'}-${limit}-${token.substring(0, 10)}`
    console.log('[Challenges Feed API] Cache key:', cacheKey)
    console.log('[Challenges Feed API] Cache revalidate:', CACHE_REVALIDATE, 'seconds')
    
    // Use unstable_cache to cache the response per user (token-based)
    const getCachedFeed = unstable_cache(
      async () => fetchChallengesFeed(token, day, limit),
      [cacheKey],
      {
        revalidate: CACHE_REVALIDATE,
        tags: ['challenges-feed', `challenges-feed-${day || 'all'}`]
      }
    )

    console.log('[Challenges Feed API] Calling getCachedFeed...')
    const data = await getCachedFeed()
    console.log('[Challenges Feed API] Got cached feed data')
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_REVALIDATE}, stale-while-revalidate=${CACHE_REVALIDATE * 2}`
      }
    })
  } catch (error) {
    console.error('[Challenges Feed API] ===== EXCEPTION OCCURRED =====')
    console.error('[Challenges Feed API] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Challenges Feed API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Challenges Feed API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

