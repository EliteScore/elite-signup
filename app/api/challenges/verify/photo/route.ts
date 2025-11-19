import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

export async function POST(request: NextRequest) {
  console.log("[API Proxy] ===== VERIFY PHOTO CHALLENGE REQUEST START =====")
  console.log("[API Proxy] Timestamp:", new Date().toISOString())
  
  try {
    const token = request.headers.get('authorization')
    console.log("[API Proxy] Authorization header present:", !!token)
    
    if (!token) {
      console.error("[API Proxy] ERROR: No authorization header")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // For photo upload, we need to handle FormData
    const formData = await request.formData()
    const ucId = formData.get('uc_id')
    const photo = formData.get('photo')

    if (!ucId) {
      console.error("[API Proxy] ERROR: uc_id is required")
      return NextResponse.json(
        { error: 'uc_id is required' },
        { status: 400 }
      )
    }

    if (!photo || !(photo instanceof File)) {
      console.error("[API Proxy] ERROR: photo file is required")
      return NextResponse.json(
        { error: 'photo file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(photo.type)) {
      console.error("[API Proxy] ERROR: Unsupported file type:", photo.type)
      return NextResponse.json(
        { error: 'Only JPEG and PNG images are supported' },
        { status: 400 }
      )
    }

    // Validate file size (5 MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024
    if (photo.size > maxSize) {
      console.error("[API Proxy] ERROR: File too large:", photo.size)
      return NextResponse.json(
        { error: 'File size must be 5 MB or less' },
        { status: 400 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/challenges/verify/photo/${ucId}`
    console.log("[API Proxy] Target URL:", targetUrl)
    console.log("[API Proxy] uc_id:", ucId)
    console.log("[API Proxy] Photo file name:", photo.name)
    console.log("[API Proxy] Photo file size:", photo.size)

    // Create new FormData for the external API
    // The external API expects the field to be named 'file', not 'photo'
    const apiFormData = new FormData()
    apiFormData.append('file', photo)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': token,
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: apiFormData,
      })
      console.log("[API Proxy] External API response received")
      console.log("[API Proxy] Response status:", response.status, response.statusText)
    } catch (fetchError) {
      console.error("[API Proxy] ERROR: Fetch failed:", fetchError)
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
          error: errorText || 'Failed to verify challenge',
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
    
    console.log("[API Proxy] ===== VERIFY PHOTO CHALLENGE REQUEST SUCCESS =====")
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[API Proxy] ===== UNEXPECTED ERROR =====")
    console.error("[API Proxy] Error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

