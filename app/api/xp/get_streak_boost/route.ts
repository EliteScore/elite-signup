import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const targetUrl = `${API_BASE_URL}v1/xp/get_streak_boost`

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': token,
        },
      })
    } catch (fetchError) {
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
        } else {
          errorText = await response.text()
        }
      } catch {
        errorText = `Status ${response.status}: ${response.statusText}`
      }
      
      return NextResponse.json(
        { 
          error: errorText || 'Failed to get streak boost',
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
      } else {
        data = await response.text()
        try {
          data = JSON.parse(data)
        } catch {
          data = { raw: data }
        }
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse API response' },
        { status: 502 }
      )
    }
    
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

