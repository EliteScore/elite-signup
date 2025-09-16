import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB.' },
        { status: 400 }
      )
    }

    // Create new FormData to send to the backend API
    const backendFormData = new FormData()
    backendFormData.append('file', file)

    // Get the backend API URL from environment variable or use default
    const backendUrl = process.env.RESUME_API_URL || 'http://localhost:8081'
    
    // Forward the request to your backend service
    const response = await fetch(`${backendUrl}/v1/parser/resume/score`, {
      method: 'POST',
      body: backendFormData,
      // Don't set Content-Type header, let fetch set it automatically for FormData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API error:', response.status, errorText)
      
      return NextResponse.json(
        { error: 'Resume analysis service is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const result = await response.json()
    
    // Return the result from the backend
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Resume scoring API error:', error)
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
