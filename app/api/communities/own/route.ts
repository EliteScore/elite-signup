import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/own
 * 
 * List IDs of communities where the current user is an active member.
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT; backend resolves userId from the token into request attributes)
 * - Token must be provided in Authorization header
 * 
 * Behavior:
 * - Reads userId from request attributes (set from the authenticated user)
 * - Queries community memberships where:
 *   - user_id matches the authenticated user
 *   - left_at IS NULL (user hasn't left)
 *   - status = 'active'
 * - Orders results by community_id ASC
 * - Returns: user_id, community_ids (array), total (count)
 * 
 * Responses:
 * - 200 OK: Success
 *   {
 *     "user_id": 123,
 *     "community_ids": [10, 20, 30],
 *     "total": 3
 *   }
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: DB / server failure
 * 
 * Example — cURL:
 * curl -X GET "$BASE/v1/communities/own" \
 *   -H "Authorization: Bearer <token>"
 */
export async function GET(request: NextRequest) {
  console.log("[Get Own Communities API] ===== Request received =====")
  console.log("[Get Own Communities API] Timestamp:", new Date().toISOString())
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log("[Get Own Communities API] Authorization header present:", !!authHeader)
    console.log("[Get Own Communities API] Token present:", !!token)
    if (token) {
      console.log("[Get Own Communities API] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }

    if (!token) {
      console.error("[Get Own Communities API] ERROR: No authorization token")
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/own`
    console.log("[Get Own Communities API] Target URL:", targetUrl)

    console.log("[Get Own Communities API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log("[Get Own Communities API] External API response received")
    console.log("[Get Own Communities API] Response status:", response.status, response.statusText)
    console.log("[Get Own Communities API] Response ok:", response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Get Own Communities API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Get Own Communities API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Get Own Communities API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Get Own Communities API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Get Own Communities API] Request failed with status:", response.status)
      console.error("[Get Own Communities API] Error details:", errorText)

      return NextResponse.json(
        {
          error: 'Failed to fetch communities',
          details: errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[Get Own Communities API] Success! Response data:", JSON.stringify(data, null, 2))
    console.log("[Get Own Communities API] Response status:", response.status)
    console.log("[Get Own Communities API] ===== Request completed successfully =====")
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Get Own Communities API] ===== EXCEPTION OCCURRED =====")
    console.error("[Get Own Communities API] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[Get Own Communities API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Get Own Communities API] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
