import type { AgentRequest } from '../types/agent.types'
import type { DictionaryMatch } from '../types/dictionary.types'

export class ContextBuilder {
  /**
   * Buduje kontekst dla OpenAI API
   */
  build(request: AgentRequest, match: DictionaryMatch | null) {
    const messages = []

    // System prompt
    if (match) {
      messages.push({
        role: 'system',
        content: this.buildSystemPrompt(match, request),
      })
    } else {
      messages.push({
        role: 'system',
        content: this.getDefaultSystemPrompt(request.type),
      })
    }

    // User message z kontekstem
    messages.push({
      role: 'user',
      content: this.buildUserMessage(request, match),
    })

    return messages
  }

  /**
   * Tworzy system prompt na podstawie dopasowania
   */
  private buildSystemPrompt(
    match: DictionaryMatch,
    request: AgentRequest
  ): string {
    let prompt = match.trigger.systemPrompt

    // Dodaj kontekst lokalizacji jeśli dostępny
    if (request.context?.lat && request.context?.lng) {
      prompt += `\n\nLokalizacja użytkownika: ${request.context.lat.toFixed(4)}, ${request.context.lng.toFixed(4)}`
    }

    // Dodaj timestamp
    if (request.context?.timestamp) {
      const date = new Date(request.context.timestamp)
      prompt += `\n\nCzas zgłoszenia: ${date.toLocaleString('pl-PL')}`
    }

    // Dodaj sugerowane pytania
    if (match.trigger.questions.length > 0) {
      prompt += `\n\nSugerowane pytania do użytkownika:\n${match.trigger.questions.map((q) => `- ${q}`).join('\n')}`
    }

    return prompt
  }

  /**
   * Tworzy wiadomość użytkownika z kontekstem
   */
  private buildUserMessage(
    request: AgentRequest,
    match: DictionaryMatch | null
  ): string {
    let message = request.userMessage

    // Dodaj informacje o klasyfikacji
    if (match) {
      message += `\n\n[Wykryto: ${match.category}/${match.subcategory}, Pewność: ${(match.confidence * 100).toFixed(0)}%]`
    }

    return message
  }

  /**
   * Domyślny system prompt jeśli brak dopasowania
   */
  private getDefaultSystemPrompt(type: AgentRequest['type']): string {
    const prompts = {
      incident:
        'Jesteś pomocnym asystentem do zgłaszania incydentów drogowych.',
      route: 'Jesteś asystentem nawigacji pomagającym w planowaniu tras.',
      emergency:
        'Jesteś asystentem w sytuacjach awaryjnych. Priorytet to bezpieczeństwo.',
      assistant: 'Jesteś pomocnym asystentem aplikacji mapowej.',
      analytics: 'Jesteś asystentem analizującym dane o incydentach.',
    }

    return prompts[type] || prompts.assistant
  }
}
