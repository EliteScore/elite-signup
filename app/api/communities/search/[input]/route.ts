import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://elitescore-social-4046880acb02.herokuapp.com/'

/**
 * GET /v1/communities/search/{input}
 * 
 * Search communities by free-text input, with optional filters for name, slug, visibility, and pro status.
 * 
 * Authorization Requirements:
 * - Auth: Required (JWT; behavior same as the rest of the API — uses the token only for authentication, no per-user filtering in this endpoint)
 * 
 * Path Parameters:
 * - input (string): Free-text term. Matched case-insensitively against name and slug:
 *   LOWER(name) LIKE %input% OR LOWER(slug) LIKE %input%
 *   If you want to search only via the filters, you can pass "_" or an empty-ish token and rely on query params.
 * 
 * Query Parameters (all optional, combined with logical AND):
 * - limit (number, optional, default 20, min 1, max 50): Max number of results to return. Values outside [1, 50] are clamped server-side.
 * - name (string, optional): Additional filter on community name. Case-insensitive LIKE %name%.
 * - slug (string, optional): Additional filter on slug. Case-insensitive LIKE %slug%.
 * - visibility (string, optional): Filter by visibility. Must be either "public" or "private". Any other value is ignored.
 * - is_pro (boolean, optional): Filters on the is_pro column:
 *   - true → only pro communities
 *   - false → only non-pro communities
 *   - Accepts: "true"/"false", "1"/"0" (case-insensitive)
 *   - This is a filter only; the flag is not part of the CommunityInfo JSON payload.
 * 
 * Responses:
 * - 200 OK: Success (returns ApiResponse<CommunityInfo[]> or array of CommunityInfo)
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: DB / server failure
 * 
 * Example — cURL:
 * curl -X GET "$BASE/v1/communities/search/fitness?limit=20&visibility=public" \
 *   -H "Authorization: Bearer <token>"
 */
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

    // Add tags support (CSV format)
    const tagsParam = searchParams.get('tags')
    if (tagsParam && tagsParam.trim()) {
      targetUrl.searchParams.set('tags', tagsParam.trim())
      console.log('[Search Communities API] Tags filter:', tagsParam)
      
      // Add mode (any | all), default to "any"
      const modeParam = searchParams.get('mode')
      const mode = modeParam === 'all' ? 'all' : 'any'
      targetUrl.searchParams.set('mode', mode)
      console.log('[Search Communities API] Tag mode:', mode)
    }

    // Add offset support
    const offsetParam = searchParams.get('offset')
    if (offsetParam) {
      const offset = Number(offsetParam)
      if (!Number.isNaN(offset) && offset >= 0) {
        targetUrl.searchParams.set('offset', offset.toString())
        console.log('[Search Communities API] Offset:', offset)
      }
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
    
    // Preserve the original response status from backend (typically 200 OK)
    return NextResponse.json(data, { status: response.status })
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

