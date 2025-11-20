import { NextRequest, NextResponse } from 'next/server'
import { getStoredAccessToken } from '@/lib/auth-storage'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function GET(request: NextRequest) {
  try {
    console.log("[Suggestions API] ===== Request received =====")
    
    // Get token from Authorization header (not from storage, as this is server-side)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    console.log("[Suggestions API] Authorization header present:", !!authHeader)
    console.log("[Suggestions API] Token present:", !!token)
    if (token) {
      console.log("[Suggestions API] Token preview:", `Bearer ${token.substring(0, 20)}...`)
    }
    
    if (!token) {
      console.warn("[Suggestions API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const count = searchParams.get('count') || '5'
    console.log("[Suggestions API] Count parameter:", count)

    const targetUrl = `${API_BASE_URL}v1/users/social/get_suggestions?count=${count}`
    console.log("[Suggestions API] Target URL:", targetUrl)

    console.log("[Suggestions API] Making fetch request to external API...")
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log("[Suggestions API] External API response received")
    console.log("[Suggestions API] Response status:", response.status, response.statusText)
    console.log("[Suggestions API] Response ok:", response.ok)

    if (!response.ok) {
      let errorText: any
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Suggestions API] Error response content-type:", contentType)
        if (contentType?.includes('application/json')) {
          errorText = await response.json()
        } else {
          errorText = await response.text()
        }
        console.log("[Suggestions API] Error response body:", errorText)
      } catch (parseError) {
        errorText = `Status ${response.status}: ${response.statusText}`
        console.error("[Suggestions API] Failed to parse error response:", parseError)
      }
      
      return NextResponse.json(
        { 
          error: errorText || 'Failed to get suggestions',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[Suggestions API] Successfully parsed response:", {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      userIdsCount: Array.isArray(data?.data) ? data.data.length : 0,
    })
    console.log("[Suggestions API] ===== Request SUCCESS =====")
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[Suggestions API] ✗ Internal error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

