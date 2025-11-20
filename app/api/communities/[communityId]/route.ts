import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/{communityId}
 * 
 * Gets a community by ID.
 * 
 * Authorization Requirements:
 * - Auth: None required in this resource (may be protected globally by backend)
 * - Token is optional - if provided, it will be forwarded to backend
 * 
 * Responses:
 * - 200 OK: Community JSON object (may be wrapped in ApiResponse<T> or raw object)
 * - 400 Bad Request: Invalid community ID
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 * 
 * Note: Response format depends on backend implementation. This proxy forwards the response as-is.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  console.log("[Get Community by ID API] ===== Request received =====")
  console.log("[Get Community by ID API] Timestamp:", new Date().toISOString())
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    const { communityId } = await params

    console.log("[Get Community by ID API] Authorization header present:", !!authHeader)
    console.log("[Get Community by ID API] Token present:", !!token)
    if (token) {
      console.log("[Get Community by ID API] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }

    console.log("[Get Community by ID API] Community ID:", communityId)

    if (!communityId) {
      console.error("[Get Community by ID API] ERROR: No communityId provided")
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/${communityId}`
    console.log("[Get Community by ID API] Target URL:", targetUrl)

    // Build headers - include Authorization only if token is provided
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    console.log("[Get Community by ID API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    console.log("[Get Community by ID API] External API response received")
    console.log("[Get Community by ID API] Response status:", response.status, response.statusText)
    console.log("[Get Community by ID API] Response ok:", response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Get Community by ID API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Get Community by ID API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Get Community by ID API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Get Community by ID API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Get Community by ID API] Request failed with status:", response.status)
      console.error("[Get Community by ID API] Error details:", errorText)

      return NextResponse.json(
        {
          error: 'Failed to fetch community',
          details: errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[Get Community by ID API] Success! Response data:", JSON.stringify(data, null, 2))
    console.log("[Get Community by ID API] Response status:", response.status)
    console.log("[Get Community by ID API] ===== Request completed successfully =====")
    // Preserve the original response status from backend
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Get Community by ID API] ===== EXCEPTION OCCURRED =====")
    console.error("[Get Community by ID API] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[Get Community by ID API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Get Community by ID API] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}


