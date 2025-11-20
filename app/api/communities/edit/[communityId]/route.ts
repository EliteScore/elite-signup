import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

/**
 * PUT /v1/communities-op/{communityId}
 * 
 * Updates a community. Only the owner can update their community.
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT)
 * - User must be the owner of the community (403 Forbidden if not owner)
 * 
 * Request Body:
 * {
 *   "name": "string",              // optional
 *   "description": "string",       // optional
 *   "slug": "string",              // optional
 *   "visibility": "public|private" // optional
 * }
 * 
 * Note: All fields are optional - only include fields you want to update.
 * 
 * Responses:
 * - 200 OK: Community updated successfully (returns updated Community JSON)
 * - 400 Bad Request: Invalid request body
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not the owner of this community
 * - 404 Not Found: Community not found
 * - 500 Internal Server Error
 * 
 * Example — cURL:
 * curl -X PUT "$BASE/v1/communities-op/42" \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"name":"Elite Fitness Pro"}'
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log("[Edit Community API] ===== Request received =====")
  console.log("[Edit Community API] Timestamp:", new Date().toISOString())
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    console.log("[Edit Community API] Authorization header present:", !!authHeader)
    console.log("[Edit Community API] Token present:", !!token)
    if (token) {
      console.log("[Edit Community API] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }
    
    if (!token) {
      console.error("[Edit Community API] ERROR: No authorization token")
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId } = await params
    
    console.log("[Edit Community API] Community ID:", communityId)
    
    if (!communityId) {
      console.error("[Edit Community API] ERROR: No communityId provided")
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
      console.log("[Edit Community API] Request body received:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("[Edit Community API] ERROR: Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities-op/${communityId}`
    console.log("[Edit Community API] Target URL:", targetUrl)
    console.log("[Edit Community API] Request payload:", JSON.stringify(body, null, 2))
    
    console.log("[Edit Community API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body)
    })

    console.log("[Edit Community API] External API response received")
    console.log("[Edit Community API] Response status:", response.status, response.statusText)
    console.log("[Edit Community API] Response ok:", response.ok)
    console.log("[Edit Community API] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Edit Community API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Edit Community API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Edit Community API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Edit Community API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Edit Community API] Request failed with status:", response.status)
      console.error("[Edit Community API] Error details:", errorText)

      // Handle 403 Forbidden - user is not the owner
      if (response.status === 403) {
        console.error("[Edit Community API] Authorization failed: User must be the owner of the community")
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You must be the owner of this community to edit it.',
            details: errorText?.message || errorText?.error || errorText || 'Insufficient permissions',
            authorizationRequired: {
              isOwner: true,
            },
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update community',
          message: errorText?.message || errorText?.error || errorText || response.statusText,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[Edit Community API] Success! Response data:", JSON.stringify(data, null, 2))
    console.log("[Edit Community API] Response status:", response.status)
    console.log("[Edit Community API] ===== Request completed successfully =====")
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Edit Community API] ===== EXCEPTION OCCURRED =====")
    console.error("[Edit Community API] Error:", error)
    console.error("[Edit Community API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Edit Community API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

