import { NextRequest, NextResponse } from 'next/server'

// Mock resume analysis function (replace with your actual analysis logic)
function analyzeResumeContent(file: File): Promise<{
  overall_score: number
  components: {
    education: number
    experience: number
    skills: number
    ai_signal: number
  }
}> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate mock scores based on file name/size for demo purposes
      const baseScore = Math.min(85, Math.max(60, 70 + Math.random() * 20))
      const variation = 10
      
      const scores = {
        overall_score: Math.round(baseScore),
        components: {
          education: Math.round(baseScore + (Math.random() - 0.5) * variation),
          experience: Math.round(baseScore + (Math.random() - 0.5) * variation),
          skills: Math.round(baseScore + (Math.random() - 0.5) * variation),
          ai_signal: Math.round(baseScore + (Math.random() - 0.5) * variation)
        }
      }
      
      // Ensure all scores are between 0-100
      Object.keys(scores.components).forEach(key => {
        scores.components[key as keyof typeof scores.components] = Math.max(0, Math.min(100, scores.components[key as keyof typeof scores.components]))
      })
      
      resolve(scores)
    }, 2000) // 2 second delay to simulate processing
  })
}

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

    console.log('Processing resume file:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Analyze the resume content
    const result = await analyzeResumeContent(file)
    
    console.log('Resume analysis result:', result)
    
    // Return the result in the same format as the Express server
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Resume scoring API error:', error)
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
