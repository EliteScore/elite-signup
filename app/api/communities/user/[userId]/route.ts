import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

/**
 * GET /v1/communities/user/{user_id}
 * 
 * List IDs of communities where a specific user is an active member.
 * 
 * Authorization Requirements:
 * - Auth: None required in this method (no JWT required)
 * - Note: Overall visibility / access rules may still be enforced globally by the API gateway or backend
 * 
 * Path Parameters:
 * - user_id (string/long): Target user whose communities are being listed
 * 
 * Behavior:
 * - Runs the same query as /v1/communities/own, but using the user_id from the path instead of the current user
 * - Queries community memberships where:
 *   - user_id matches the path parameter
 *   - left_at IS NULL (user hasn't left)
 *   - status = 'active'
 * - Returns: user_id (path user), community_ids (array), total (count)
 * 
 * Responses:
 * - 200 OK: Success
 *   {
 *     "user_id": 456,
 *     "community_ids": [10, 20],
 *     "total": 2
 *   }
 * - 400 Bad Request: Invalid user_id parameter
 * - 404 Not Found: User not found (optional; backend may return total: 0 instead)
 * - 500 Internal Server Error: DB / server issues
 * 
 * Example — cURL:
 * curl -X GET "$BASE/v1/communities/user/456"
 * 
 * Note: No Authorization header is required for this endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log("[Get User Communities API] ===== Request received =====")
  console.log("[Get User Communities API] Timestamp:", new Date().toISOString())
  
  try {
    const { userId } = await params
    
    console.log("[Get User Communities API] User ID:", userId)
    
    if (!userId) {
      console.error("[Get User Communities API] ERROR: No userId provided")
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities/user/${userId}`
    console.log("[Get User Communities API] Target URL:", targetUrl)
    
    console.log("[Get User Communities API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log("[Get User Communities API] External API response received")
    console.log("[Get User Communities API] Response status:", response.status, response.statusText)
    console.log("[Get User Communities API] Response ok:", response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Get User Communities API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Get User Communities API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Get User Communities API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Get User Communities API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Get User Communities API] Request failed with status:", response.status)
      console.error("[Get User Communities API] Error details:", errorText)

      return NextResponse.json(
        { 
          error: 'Failed to fetch user communities',
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[Get User Communities API] Success! Response data:", JSON.stringify(data, null, 2))
    console.log("[Get User Communities API] Response status:", response.status)
    console.log("[Get User Communities API] ===== Request completed successfully =====")
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Get User Communities API] ===== EXCEPTION OCCURRED =====")
    console.error("[Get User Communities API] Error:", error)
    console.error("[Get User Communities API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Get User Communities API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

