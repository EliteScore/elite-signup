import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: process.env.NODE_ENV,
    hasDb: Boolean(process.env.DATABASE_URL || process.env.DB_URL),
    hasCvService: Boolean(process.env.CV_SERVICE_URL),
    time: new Date().toISOString(),
  })
}

