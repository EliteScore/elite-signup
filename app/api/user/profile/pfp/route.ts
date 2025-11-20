import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

export async function PUT(request: NextRequest) {
  try {
    console.log("[PFP Upload API] ===== Request received =====")
    const token = request.headers.get('authorization')
    
    if (!token) {
      console.warn("[PFP Upload API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Parse FormData from request
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.warn("[PFP Upload API] No file provided")
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.warn("[PFP Upload API] Invalid file type:", file.type)
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5 MB = 5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      console.warn("[PFP Upload API] File too large:", file.size, "bytes")
      return NextResponse.json(
        { error: 'File size must be less than 5 MB' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      console.warn("[PFP Upload API] File is empty")
      return NextResponse.json(
        { error: 'File cannot be empty' },
        { status: 400 }
      )
    }

    console.log("[PFP Upload API] File validated:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    const targetUrl = `${API_BASE_URL}v1/user/profile/pfp`
    console.log("[PFP Upload API] Uploading to:", targetUrl)

    // Create new FormData for forwarding
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: uploadFormData,
      })
      console.log("[PFP Upload API] External API response status:", response.status, response.ok)
    } catch (fetchError) {
      console.error("[PFP Upload API] Fetch error:", fetchError)
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
      
      console.warn("[PFP Upload API] Error response:", response.status, errorText)
      return NextResponse.json(
        { 
          error: errorText || 'Failed to upload profile picture',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[PFP Upload API] ✓ Success - uploaded:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[PFP Upload API] ✗ Internal error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[PFP Delete API] ===== Request received =====")
    const token = request.headers.get('authorization')
    
    if (!token) {
      console.warn("[PFP Delete API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/user/profile/pfp`
    console.log("[PFP Delete API] Deleting from:", targetUrl)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': token,
        },
      })
      console.log("[PFP Delete API] External API response status:", response.status, response.ok)
    } catch (fetchError) {
      console.error("[PFP Delete API] Fetch error:", fetchError)
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
      
      console.warn("[PFP Delete API] Error response:", response.status, errorText)
      return NextResponse.json(
        { 
          error: errorText || 'Failed to delete profile picture',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[PFP Delete API] ✓ Success - deleted:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[PFP Delete API] ✗ Internal error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[PFP Metadata API] ===== Request received =====")
    const token = request.headers.get('authorization')
    
    if (!token) {
      console.warn("[PFP Metadata API] No authorization token provided")
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/user/profile/pfp`
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
