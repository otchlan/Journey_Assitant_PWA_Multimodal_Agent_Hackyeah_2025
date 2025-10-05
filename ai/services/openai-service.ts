export class OpenAIService {
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
  }

  /**
   * Wysyła request do OpenAI Chat Completion API
   */
  async chat(messages: any[], options?: {
    model?: string
    temperature?: number
    max_tokens?: number
  }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Streaming chat (dla przyszłej implementacji)
   */
  async chatStream(messages: any[]) {
    // TODO: Implement streaming
    throw new Error('Streaming not implemented yet')
  }
}
