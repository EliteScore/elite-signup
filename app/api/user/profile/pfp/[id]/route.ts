import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("[PFP Metadata API] ===== Request received for user ID:", id)
    const token = request.headers.get('authorization')
    
    if (!token) {
      console.warn("[PFP Metadata API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const userId = id
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/user/profile/pfp/${userId}`
    console.log("[PFP Metadata API] Fetching from:", targetUrl)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': token,
        },
      })
      console.log("[PFP Metadata API] External API response status:", response.status, response.ok)
    } catch (fetchError) {
      console.error("[PFP Metadata API] Fetch error:", fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to connect to external API',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 502 }
      )
    }

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
        errorText = `Status ${response.status}: ${response.statusText}`
      }
      
      console.warn("[PFP Metadata API] Error response:", response.status, errorText)
      return NextResponse.json(
        { 
          error: errorText || 'Failed to get profile picture metadata',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[PFP Metadata API] ✓ Success - metadata:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[PFP Metadata API] ✗ Internal error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

