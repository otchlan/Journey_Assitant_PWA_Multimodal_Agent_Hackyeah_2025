import { IntentClassifier } from './intent-classifier'
import { ContextBuilder } from './context-builder'
import { ResponseFormatter } from './response-formatter'
import { OpenAIService } from '../services/openai-service'
import type { AgentRequest, AgentResponse } from '../types/agent.types'

export class AIAgent {
  private classifier: IntentClassifier
  private contextBuilder: ContextBuilder
  private formatter: ResponseFormatter
  private openai: OpenAIService

  constructor(openaiApiKey?: string) {
    this.classifier = new IntentClassifier()
    this.contextBuilder = new ContextBuilder()
    this.formatter = new ResponseFormatter()
    this.openai = new OpenAIService(openaiApiKey)
  }

  /**
   * Główna metoda przetwarzania requestu
   */
  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      // 1. Klasyfikuj intencję
      const match = this.classifier.getBestMatch(request.userMessage)

      console.log('Intent classification:', match)

      // 2. Zbuduj kontekst
      const messages = this.contextBuilder.build(request, match)

      console.log('Context built:', messages)

      // 3. Wywołaj OpenAI
      const apiResponse = await this.openai.chat(messages)

      console.log('OpenAI response:', apiResponse)

      // 4. Sformatuj odpowiedź
      const response = this.formatter.format(
        apiResponse,
        match?.category,
        match?.subcategory
      )

      return response
    } catch (error) {
      console.error('Agent error:', error)
      return this.formatter.formatError(error as Error)
    }
  }

  /**
   * Szybka klasyfikacja bez wywołania API
   */
  classifyOnly(userMessage: string) {
    return this.classifier.classify(userMessage)
  }
}

// Singleton instance (opcjonalnie)
let agentInstance: AIAgent | null = null

export function getAgent(apiKey?: string): AIAgent {
  if (!agentInstance) {
    agentInstance = new AIAgent(apiKey)
  }
  return agentInstance
}
