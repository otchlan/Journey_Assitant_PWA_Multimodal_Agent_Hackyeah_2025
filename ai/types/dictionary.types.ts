export interface DictionaryTrigger {
  keywords: string[]
  systemPrompt: string
  questions: string[]
  priority?: number
}

export interface Dictionary {
  category: string
  triggers: string[]
  subcategories: Record<string, DictionaryTrigger>
}

export interface DictionaryMatch {
  category: string
  subcategory: string
  confidence: number
  trigger: DictionaryTrigger
}
