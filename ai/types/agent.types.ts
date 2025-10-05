export interface AgentContext {
  lat?: number
  lng?: number
  timestamp?: number
  userId?: string
  sessionId?: string
  [key: string]: any
}

export interface AgentRequest {
  type: 'incident' | 'route' | 'emergency' | 'assistant' | 'analytics'
  userMessage: string
  context?: AgentContext
}

export interface AgentResponse {
  success: boolean
  message: string
  data?: any
  suggestions?: string[]
  actions?: AgentAction[]
}

export interface AgentAction {
  type: 'navigate' | 'call' | 'report' | 'share'
  label: string
  payload: any
}

export interface IntentClassification {
  category: string
  subcategory?: string
  confidence: number
  keywords: string[]
}
