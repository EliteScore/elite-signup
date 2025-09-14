import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Define the signup data structure
interface SignupData {
  username: string
  email: string
  timestamp: string
}

// Path to the signups file
const SIGNUPS_FILE = path.join(process.cwd(), 'beta-signups.json')

// Initialize signups file if it doesn't exist
function initializeSignupsFile() {
  if (!fs.existsSync(SIGNUPS_FILE)) {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify([], null, 2))
  }
}

// Load existing signups
function loadSignups(): SignupData[] {
  try {
    initializeSignupsFile()
    const data = fs.readFileSync(SIGNUPS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading signups:', error)
    return []
  }
}

// Save signups to file
function saveSignups(signups: SignupData[]): void {
  try {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(signups, null, 2))
  } catch (error) {
    console.error('Error saving signups:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email } = body

    console.log('Received signup request:', { username, email })

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields must be completed',
          data: null
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email address',
          data: null
        },
        { status: 400 }
      )
    }

    // Load existing signups
    const betaSignups = loadSignups()

    // Check if email already exists
    const existingSignup = betaSignups.find(signup => signup.email === email)
    if (existingSignup) {
      console.log('Duplicate email detected:', email)
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
          data: null
        },
        { status: 409 }
      )
    }

    // Add new signup
    const newSignup: SignupData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      timestamp: new Date().toISOString()
    }

    betaSignups.push(newSignup)
    saveSignups(betaSignups)

    console.log('New beta signup added:', newSignup)
    console.log('Total signups:', betaSignups.length)

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: null
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing signup:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        data: null
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET endpoint to view signups (for debugging)
export async function GET() {
  try {
    const signups = loadSignups()
    return NextResponse.json(signups)
  } catch (error) {
    console.error('Error fetching signups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signups' },
      { status: 500 }
    )
  }
}
