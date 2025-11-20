import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function GET(request: NextRequest) {
  try {
    console.log("[PFP Raw API] ===== Request received =====")
    const token = request.headers.get('authorization')
    
    if (!token) {
      console.warn("[PFP Raw API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/user/profile/pfp/raw`
    console.log("[PFP Raw API] Fetching from:", targetUrl)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': token,
        },
      })
      console.log("[PFP Raw API] External API response status:", response.status, response.ok)
      console.log("[PFP Raw API] Response headers:", {
        contentType: response.headers.get('content-type'),
        xDefault: response.headers.get('X-Default'),
        contentLength: response.headers.get('content-length'),
      })
    } catch (fetchError) {
      console.error("[PFP Raw API] Fetch error:", fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to connect to external API',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 502 }
      )
    }

    // Handle 204 No Content (default picture)
    if (response.status === 204) {
      const isDefault = response.headers.get('X-Default') === 'true'
      console.log("[PFP Raw API] 204 No Content - default picture:", isDefault)
      // Return 200 with JSON since NextResponse.json() doesn't support 204
      return NextResponse.json(
        { default: isDefault },
        { status: 200 }
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
      
      console.warn("[PFP Raw API] Error response:", response.status, errorText)
      return NextResponse.json(
        { 
          error: errorText || 'Failed to get profile picture',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    // Get the image bytes
    console.log("[PFP Raw API] Processing image bytes...")
    const imageBytes = await response.arrayBuffer()
    const isDefault = response.headers.get('X-Default') === 'true'
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    console.log("[PFP Raw API] Image data:", {
      byteLength: imageBytes.byteLength,
      isDefault,
      contentType,
    })
    
    // Convert to base64 data URL for display
    const buffer = Buffer.from(imageBytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    console.log("[PFP Raw API] ✓ Success - converted to data URL (length:", dataUrl.length, ")")

    return NextResponse.json(
      { 
        dataUrl,
        default: isDefault,
        contentType
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[PFP Raw API] ✗ Internal error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

