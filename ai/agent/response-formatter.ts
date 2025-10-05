import type { AgentResponse, AgentAction } from '../types/agent.types'

export class ResponseFormatter {
  /**
   * Formatuje odpowiedź z OpenAI do struktury AgentResponse
   */
  format(
    apiResponse: string,
    category?: string,
    subcategory?: string
  ): AgentResponse {
    // Parsuj odpowiedź
    const message = this.cleanResponse(apiResponse)
    const suggestions = this.extractSuggestions(apiResponse)
    const actions = this.generateActions(category, subcategory)

    return {
      success: true,
      message,
      suggestions,
      actions,
    }
  }

  /**
   * Formatuje błąd
   */
  formatError(error: Error): AgentResponse {
    return {
      success: false,
      message: `Wystąpił błąd: ${error.message}`,
      suggestions: ['Spróbuj ponownie', 'Sprawdź połączenie internetowe'],
    }
  }

  /**
   * Czyści odpowiedź z niepotrzebnych elementów
   */
  private cleanResponse(response: string): string {
    // Usuń markdown artifacts jeśli są
    return response.trim()
  }

  /**
   * Wyciąga sugestie z odpowiedzi
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = []

    // Prosta heurystyka - szukaj list lub pytań
    const lines = response.split('\n')
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.endsWith('?')) {
        suggestions.push(line.replace(/^[-•*]\s/, '').trim())
      }
    }

    return suggestions.slice(0, 3) // Max 3 sugestie
  }

  /**
   * Generuje akcje na podstawie kategorii
   */
  private generateActions(
    category?: string,
    subcategory?: string
  ): AgentAction[] {
    const actions: AgentAction[] = []

    if (category === 'emergency') {
      actions.push({
        type: 'call',
        label: '📞 Zadzwoń 112',
        payload: { number: '112' },
      })
    }

    if (category === 'incidents' && subcategory === 'accident') {
      actions.push({
        type: 'report',
        label: '🚨 Zgłoś do służb',
        payload: { type: 'accident' },
      })
    }

    if (category === 'routes') {
      actions.push({
        type: 'navigate',
        label: '🗺️ Pokaż na mapie',
        payload: {},
      })
    }

    actions.push({
      type: 'share',
      label: '📤 Udostępnij',
      payload: {},
    })

    return actions
  }
}
