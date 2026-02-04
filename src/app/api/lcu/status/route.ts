import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3003/status', {
      method: 'GET',
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: 'LCU service is not running' },
      { status: 503 }
    )
  }
}
