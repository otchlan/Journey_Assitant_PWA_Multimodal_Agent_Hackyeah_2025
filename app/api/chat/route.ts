import { NextRequest, NextResponse } from 'next/server'
import { AIAgent } from '@/ai/agent/agent'
import type { AgentRequest } from '@/ai/types/agent.types'

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequest = await request.json()

    // Walidacja
    if (!body.userMessage || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: userMessage, type' },
        { status: 400 }
      )
    }

    // Pobierz API key z env
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Przetwórz przez agenta
    const agent = new AIAgent(apiKey)
    const response = await agent.process(body)

    return NextResponse.json(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Opcjonalnie: GET dla testów
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Agent API is running',
    endpoints: {
      POST: '/api/chat - Process user message through AI agent',
    },
  })
}
