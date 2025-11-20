import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  console.log("[Delete Community API] ===== Request received =====")
  console.log("[Delete Community API] Timestamp:", new Date().toISOString())
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    console.log("[Delete Community API] Authorization header present:", !!authHeader)
    console.log("[Delete Community API] Token present:", !!token)
    if (token) {
      console.log("[Delete Community API] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }
    
    if (!token) {
      console.error("[Delete Community API] ERROR: No authorization token")
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { communityId } = await params
    
    console.log("[Delete Community API] Community ID:", communityId)
    
    if (!communityId) {
      console.error("[Delete Community API] ERROR: No communityId provided")
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities-op/${communityId}`
    console.log("[Delete Community API] Target URL:", targetUrl)
    
    console.log("[Delete Community API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log("[Delete Community API] External API response received")
    console.log("[Delete Community API] Response status:", response.status, response.statusText)
    console.log("[Delete Community API] Response ok:", response.ok)
    console.log("[Delete Community API] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Delete Community API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Delete Community API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Delete Community API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Delete Community API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Delete Community API] Request failed with status:", response.status)
      console.error("[Delete Community API] Error details:", errorText)

      return NextResponse.json(
        { 
          error: 'Failed to delete community',
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    // 204 No Content - successful deletion
    console.log("[Delete Community API] Success! Community deleted (204 No Content)")
    console.log("[Delete Community API] ===== Request completed successfully =====")
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[Delete Community API] ===== EXCEPTION OCCURRED =====")
    console.error("[Delete Community API] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[Delete Community API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Delete Community API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

