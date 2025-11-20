import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

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
    console.log("[Get User Communities API] ===== Request completed successfully =====")
    return NextResponse.json(data, { status: 200 })
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

