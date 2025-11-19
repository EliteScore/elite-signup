import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.goals) || !Array.isArray(body.activities)) {
      return NextResponse.json(
        { error: 'goals and activities must be arrays' },
        { status: 400 }
      )
    }

    console.log("[API Proxy] Forwarding preferences request:", {
      goals: body.goals,
      activities: body.activities
    })

    // Forward the request to the external API
    const response = await fetch(`${API_BASE_URL}v1/preferences/set_preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        goals: body.goals,
        activities: body.activities,
      }),
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      const errorText = isJson ? await response.json() : await response.text()
      console.error("[API Proxy] External API error:", response.status, errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to save preferences' },
        { status: response.status }
      )
    }

    const data = isJson ? await response.json() : await response.text()
    console.log("[API Proxy] Successfully saved preferences:", data)
    
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[API Proxy] Error proxying request:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

