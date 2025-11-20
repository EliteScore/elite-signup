import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

// Cache duration: 5 minutes (300 seconds)
const CACHE_REVALIDATE = 300

async function fetchChallengesFeed(token: string, day: string | undefined, limit: string) {
    let targetUrl = `${API_BASE_URL}v1/users/social/get_challenges_feed?limit=${limit}`
    if (day) {
      targetUrl += `&day=${day}`
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

    throw new Error(errorText || 'Failed to fetch challenges feed')
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
    // Note: In production, consider using a user ID instead of token for better cache sharing
    const cacheKey = `challenges-feed-${day || 'all'}-${limit}`
    
    // Use unstable_cache to cache the response per user (token-based)
    const getCachedFeed = unstable_cache(
      async () => fetchChallengesFeed(token, day, limit),
      [cacheKey, token.substring(0, 10)], // Include partial token in key for user-specific caching
      {
        revalidate: CACHE_REVALIDATE,
        tags: ['challenges-feed', `challenges-feed-${day || 'all'}`]
      }
    )

    const data = await getCachedFeed()
    
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

