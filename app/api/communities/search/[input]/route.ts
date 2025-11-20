import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

const clampLimit = (value: number) => {
  if (Number.isNaN(value)) return null
  return Math.min(50, Math.max(1, value))
}

const parseBooleanParam = (value: string | null) => {
  if (value === null) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') return true
  if (normalized === 'false' || normalized === '0') return false
  return null
}

const isValidVisibility = (value: string | null) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'public' || normalized === 'private'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ input: string }> },
) {
  console.log('[Search Communities API] ===== Request received =====')
  console.log('[Search Communities API] Timestamp:', new Date().toISOString())

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    console.log('[Search Communities API] Authorization header present:', !!authHeader)
    console.log('[Search Communities API] Token present:', !!token)
    if (token) {
      console.log(
        '[Search Communities API] Token preview:',
        `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      )
    }

    if (!token) {
      console.error('[Search Communities API] ERROR: No authorization token')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 },
      )
    }

    const { input } = await params
    const trimmedInput = (input ?? '').trim()
    const safeInput = trimmedInput === '' ? '_' : trimmedInput
    const encodedInput = encodeURIComponent(safeInput)

    const targetUrl = new URL(`${API_BASE_URL}v1/communities/search/${encodedInput}`)
    console.log('[Search Communities API] Target URL base:', targetUrl.toString())

    const searchParams = request.nextUrl.searchParams
    console.log('[Search Communities API] Query parameters received:', Object.fromEntries(searchParams.entries()))
    
    const limitParam = clampLimit(Number(searchParams.get('limit')))
    if (limitParam !== null) {
      targetUrl.searchParams.set('limit', limitParam.toString())
      console.log('[Search Communities API] Limit filter:', limitParam)
    }

    const nameFilter = searchParams.get('name')?.trim()
    if (nameFilter) {
      targetUrl.searchParams.set('name', nameFilter)
      console.log('[Search Communities API] Name filter:', nameFilter)
    }

    const slugFilter = searchParams.get('slug')?.trim()
    if (slugFilter) {
      targetUrl.searchParams.set('slug', slugFilter)
      console.log('[Search Communities API] Slug filter:', slugFilter)
    }

    const visibilityFilter = searchParams.get('visibility')
    if (isValidVisibility(visibilityFilter)) {
      const normalizedVisibility = visibilityFilter!.trim().toLowerCase()
      targetUrl.searchParams.set('visibility', normalizedVisibility)
      console.log('[Search Communities API] Visibility filter:', normalizedVisibility)
    }

    const isProParam = parseBooleanParam(searchParams.get('is_pro'))
    if (isProParam !== null) {
      targetUrl.searchParams.set('is_pro', isProParam ? 'true' : 'false')
      console.log('[Search Communities API] is_pro filter:', isProParam)
    }

    console.log('[Search Communities API] Input parameter:', safeInput)
    console.log('[Search Communities API] Encoded input:', encodedInput)
    console.log('[Search Communities API] Final target URL:', targetUrl.toString())

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    console.log('[Search Communities API] External API response status:', response.status, response.statusText)
    console.log('[Search Communities API] Response ok:', response.ok)
    console.log('[Search Communities API] Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      let errorData: any = null
      let errorText: string | null = null
      
      try {
        const contentType = response.headers.get('content-type')
        console.log('[Search Communities API] Error response content-type:', contentType)
        
        if (contentType?.includes('application/json')) {
          errorData = await response.json()
          console.log('[Search Communities API] Error response (JSON):', JSON.stringify(errorData, null, 2))
        } else {
          errorText = await response.text()
          console.log('[Search Communities API] Error response (text):', errorText)
        }
      } catch (readError) {
        console.error('[Search Communities API] ERROR: Failed to read error response:', readError)
        errorText = response.statusText
      }

      // If we got a JSON error response with success: false, preserve that structure
      if (errorData && typeof errorData === 'object') {
        console.error('[Search Communities API] Request failed with status:', response.status)
        console.error('[Search Communities API] Error details:', errorData)
        
        return NextResponse.json(
          {
            success: false,
            message: errorData.message || errorData.error || 'Failed to search communities',
            error: errorData.error || 'Failed to search communities',
            details: errorData.details || errorData.message || errorText || response.statusText,
          },
          { status: response.status },
        )
      }

      console.error('[Search Communities API] Request failed with status:', response.status)
      console.error('[Search Communities API] Error details:', errorText || response.statusText)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to search communities',
          message: errorText || response.statusText,
          details: errorText || response.statusText,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type')
    console.log('[Search Communities API] Response content-type:', contentType)
    
    const data = await response.json().catch((err) => {
      console.error('[Search Communities API] ERROR: Failed to parse JSON:', err)
      return null
    })

    if (data === null) {
      console.error('[Search Communities API] ERROR: Empty or invalid JSON response')
      return NextResponse.json(
        { 
          success: false,
          error: 'Empty search response',
          message: 'The server returned an empty or invalid response',
        },
        { status: 502 },
      )
    }

    console.log('[Search Communities API] Success! Response data structure:', {
      hasSuccess: 'success' in data,
      success: data?.success,
      hasData: 'data' in data,
      dataIsArray: Array.isArray(data?.data),
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
      isArray: Array.isArray(data),
      arrayLength: Array.isArray(data) ? data.length : 'N/A',
    })
    
    if (data && typeof data === 'object' && 'data' in data) {
      console.log('[Search Communities API] Response data count:', Array.isArray(data.data) ? data.data.length : 'N/A')
    } else if (Array.isArray(data)) {
      console.log('[Search Communities API] Response array count:', data.length)
    }
    
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Search Communities API] ===== EXCEPTION OCCURRED =====')
    console.error(
      '[Search Communities API] Error type:',
      error instanceof Error ? error.constructor.name : typeof error,
    )
    console.error(
      '[Search Communities API] Error message:',
      error instanceof Error ? error.message : String(error),
    )
    console.error(
      '[Search Communities API] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

