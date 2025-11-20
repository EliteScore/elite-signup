import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function POST(request: NextRequest) {
  console.log("[Create Community API] ===== Request received =====")
  console.log("[Create Community API] Timestamp:", new Date().toISOString())
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    console.log("[Create Community API] Authorization header present:", !!authHeader)
    console.log("[Create Community API] Token present:", !!token)
    if (token) {
      console.log("[Create Community API] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)
    }
    
    if (!token) {
      console.error("[Create Community API] ERROR: No authorization token")
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
      console.log("[Create Community API] Request body received:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("[Create Community API] ERROR: Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/communities-op`
    console.log("[Create Community API] Target URL:", targetUrl)
    console.log("[Create Community API] Request payload:", JSON.stringify(body, null, 2))
    
    console.log("[Create Community API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body)
    })

    console.log("[Create Community API] External API response received")
    console.log("[Create Community API] Response status:", response.status, response.statusText)
    console.log("[Create Community API] Response ok:", response.ok)
    console.log("[Create Community API] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Create Community API] Response content-type:", contentType)
        
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
          console.log("[Create Community API] Error response (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.log("[Create Community API] Error response (text):", errorText)
        }
      } catch (readError) {
        console.error("[Create Community API] ERROR: Failed to read error response:", readError)
        errorText = response.statusText
      }

      console.error("[Create Community API] Request failed with status:", response.status)
      console.error("[Create Community API] Error details:", errorText)

      return NextResponse.json(
        { 
          error: 'Failed to create community',
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[Create Community API] Success! Response data:", JSON.stringify(data, null, 2))
    console.log("[Create Community API] ===== Request completed successfully =====")
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[Create Community API] ===== EXCEPTION OCCURRED =====")
    console.error("[Create Community API] Error:", error)
    console.error("[Create Community API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Create Community API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

