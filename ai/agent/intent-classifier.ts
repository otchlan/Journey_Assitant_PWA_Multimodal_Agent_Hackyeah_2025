import { getAllDictionaries } from '../dictionaries'
import type { IntentClassification } from '../types/agent.types'
import type { DictionaryMatch } from '../types/dictionary.types'

export class IntentClassifier {
  private dictionaries = getAllDictionaries()

  /**
   * Klasyfikuje intencję użytkownika na podstawie jego wiadomości
   */
  classify(userMessage: string): IntentClassification {
    const normalizedMessage = userMessage.toLowerCase().trim()
    const matches: DictionaryMatch[] = []

    // Przeszukaj wszystkie słowniki
    for (const dict of this.dictionaries) {
      // Sprawdź główne triggery
      const mainTriggerMatch = dict.triggers.some((trigger) =>
        normalizedMessage.includes(trigger.toLowerCase())
      )

      if (mainTriggerMatch) {
        // Sprawdź subcategories
        for (const [subcatKey, subcat] of Object.entries(dict.subcategories)) {
          const keywordMatches = subcat.keywords.filter((keyword) =>
            normalizedMessage.includes(keyword.toLowerCase())
          )

          if (keywordMatches.length > 0) {
            const confidence = this.calculateConfidence(
              keywordMatches.length,
              subcat.keywords.length,
              subcat.priority || 1
            )

            matches.push({
              category: dict.category,
              subcategory: subcatKey,
              confidence,
              trigger: subcat,
            })
          }
        }
      }
    }

    // Sortuj po confidence
    matches.sort((a, b) => b.confidence - a.confidence)

    // Zwróć najlepsze dopasowanie lub domyślne
    if (matches.length > 0) {
      const best = matches[0]
      return {
        category: best.category,
        subcategory: best.subcategory,
        confidence: best.confidence,
        keywords: best.trigger.keywords,
      }
    }

    // Brak dopasowania
    return {
      category: 'unknown',
      confidence: 0,
      keywords: [],
    }
  }

  /**
   * Oblicza confidence score
   */
  private calculateConfidence(
    matchedCount: number,
    totalKeywords: number,
    priority: number
  ): number {
    const baseScore = matchedCount / totalKeywords
    const priorityBoost = priority * 0.1
    return Math.min(baseScore + priorityBoost, 1)
  }

  /**
   * Zwraca najlepsze dopasowanie ze słownika
   */
  getBestMatch(userMessage: string): DictionaryMatch | null {
    const classification = this.classify(userMessage)

    if (classification.category === 'unknown') {
      return null
    }

    const dict = this.dictionaries.find(
      (d) => d.category === classification.category
    )

    if (!dict || !classification.subcategory) {
      return null
    }

    const trigger = dict.subcategories[classification.subcategory]

    return {
      category: classification.category,
      subcategory: classification.subcategory,
      confidence: classification.confidence,
      trigger,
    }
  }
}
