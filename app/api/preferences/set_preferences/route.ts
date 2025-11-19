import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

export async function PATCH(request: NextRequest) {
  console.log("[API Proxy] ===== PREFERENCES SET REQUEST START =====")
  console.log("[API Proxy] Timestamp:", new Date().toISOString())
  
  try {
    const token = request.headers.get('authorization')
    console.log("[API Proxy] Authorization header present:", !!token)
    console.log("[API Proxy] Token preview:", token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : "none")
    
    if (!token) {
      console.error("[API Proxy] ERROR: No authorization header")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
      console.log("[API Proxy] Request body received:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("[API Proxy] ERROR: Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      console.error("[API Proxy] ERROR: Invalid request body type:", typeof body)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.goals)) {
      console.error("[API Proxy] ERROR: goals is not an array:", typeof body.goals, body.goals)
      return NextResponse.json(
        { error: 'goals must be an array' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.activities)) {
      console.error("[API Proxy] ERROR: activities is not an array:", typeof body.activities, body.activities)
      return NextResponse.json(
        { error: 'activities must be an array' },
        { status: 400 }
      )
    }

    console.log("[API Proxy] Validated payload:", {
      goals: body.goals,
      goalsCount: body.goals.length,
      activities: body.activities,
      activitiesCount: body.activities.length
    })

    const targetUrl = `${API_BASE_URL}v1/preferences/set_preferences`
    console.log("[API Proxy] Target URL:", targetUrl)
    console.log("[API Proxy] Making fetch request to external API...")

    const requestPayload = {
      goals: body.goals,
      activities: body.activities,
    }
    console.log("[API Proxy] Request payload:", JSON.stringify(requestPayload, null, 2))

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(requestPayload),
      })
      console.log("[API Proxy] External API response received")
      console.log("[API Proxy] Response status:", response.status, response.statusText)
      console.log("[API Proxy] Response ok:", response.ok)
      console.log("[API Proxy] Response headers:", Object.fromEntries(response.headers.entries()))
    } catch (fetchError) {
      console.error("[API Proxy] ERROR: Fetch failed:", fetchError)
      if (fetchError instanceof Error) {
        console.error("[API Proxy] Error name:", fetchError.name)
        console.error("[API Proxy] Error message:", fetchError.message)
        console.error("[API Proxy] Error stack:", fetchError.stack)
      }
      return NextResponse.json(
        { 
          error: 'Failed to connect to external API',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 502 }
      )
    }

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    console.log("[API Proxy] Response content-type:", contentType)
    console.log("[API Proxy] Is JSON:", isJson)

    if (!response.ok) {
      let errorText: any
      try {
        if (isJson) {
          errorText = await response.json()
          console.error("[API Proxy] External API error (JSON):", JSON.stringify(errorText, null, 2))
        } else {
          errorText = await response.text()
          console.error("[API Proxy] External API error (text):", errorText)
        }
      } catch (readError) {
        console.error("[API Proxy] ERROR: Failed to read error response:", readError)
        errorText = `Status ${response.status}: ${response.statusText}`
      }
      
      return NextResponse.json(
        { 
          error: errorText || 'Failed to save preferences',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    let data: any
    try {
      if (isJson) {
        data = await response.json()
        console.log("[API Proxy] Successfully parsed JSON response:", JSON.stringify(data, null, 2))
      } else {
        data = await response.text()
        console.log("[API Proxy] Successfully received text response:", data)
      }
    } catch (parseError) {
      console.error("[API Proxy] ERROR: Failed to parse response:", parseError)
      return NextResponse.json(
        { error: 'Failed to parse API response' },
        { status: 502 }
      )
    }
    
    console.log("[API Proxy] ===== PREFERENCES SET REQUEST SUCCESS =====")
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[API Proxy] ===== UNEXPECTED ERROR =====")
    console.error("[API Proxy] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[API Proxy] Error:", error)
    if (error instanceof Error) {
      console.error("[API Proxy] Error name:", error.name)
      console.error("[API Proxy] Error message:", error.message)
      console.error("[API Proxy] Error stack:", error.stack)
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

