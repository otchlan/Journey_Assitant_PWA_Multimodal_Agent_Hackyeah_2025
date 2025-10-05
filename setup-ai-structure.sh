#!/bin/bash

# Kolory dla outputu
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AI Agent Structure Setup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Sprawdź czy jesteśmy w głównym katalogu projektu
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Uwaga: Nie znaleziono package.json${NC}"
    echo -e "${YELLOW}Upewnij się, że uruchamiasz skrypt z głównego katalogu projektu${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Znaleziono package.json - kontynuuję...\n"

# Tworzenie struktury katalogów
echo -e "${BLUE}📁 Tworzenie struktury katalogów...${NC}"

mkdir -p ai/agent
mkdir -p ai/dictionaries
mkdir -p ai/prompts
mkdir -p ai/services
mkdir -p ai/types
mkdir -p app/api/chat

echo -e "${GREEN}✓${NC} Utworzono katalogi\n"

# Tworzenie plików TypeScript z podstawową strukturą
echo -e "${BLUE}📝 Tworzenie plików TypeScript...${NC}"

# ai/types/dictionary.types.ts
cat > ai/types/dictionary.types.ts << 'EOF'
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
EOF

# ai/types/agent.types.ts
cat > ai/types/agent.types.ts << 'EOF'
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
EOF

# ai/dictionaries/incidents.json
cat > ai/dictionaries/incidents.json << 'EOF'
{
  "category": "incidents",
  "triggers": [
    "wypadek",
    "kolizja",
    "stłuczka",
    "korek",
    "zablokowana",
    "utrudnienia",
    "awaria"
  ],
  "subcategories": {
    "accident": {
      "keywords": [
        "wypadek",
        "zderzenie",
        "kolizja",
        "stłuczka",
        "potrącenie"
      ],
      "systemPrompt": "Jesteś pomocnym asystentem ds. zgłaszania wypadków drogowych. Zadawaj konkretne pytania, aby zebrać kluczowe informacje: czy są ranni, ile pojazdów, czy droga jest zablokowana. Bądź empatyczny i profesjonalny.",
      "questions": [
        "Czy ktoś jest ranny?",
        "Ile pojazdów bierze udział w zdarzeniu?",
        "Czy droga jest całkowicie zablokowana?",
        "Czy wzywano służby ratunkowe?"
      ],
      "priority": 1
    },
    "traffic": {
      "keywords": [
        "korek",
        "zatłoczenie",
        "wolno",
        "utrudnienia",
        "zator"
      ],
      "systemPrompt": "Jesteś asystentem pomagającym w zgłaszaniu utrudnień w ruchu. Zbieraj informacje o lokalizacji, skali i przyczynie utrudnień.",
      "questions": [
        "Jak duży jest korek (w km lub czasie oczekiwania)?",
        "W którym kierunku występuje utrudnienie?",
        "Czy znasz przyczynę korka?",
        "Czy są alternatywne trasy?"
      ],
      "priority": 2
    },
    "roadblock": {
      "keywords": [
        "zablokowana",
        "zamknięta",
        "nie przejedziesz",
        "roboty"
      ],
      "systemPrompt": "Asystent ds. zgłaszania zablokowanych dróg. Zbieraj informacje o przyczynie, czasie trwania i objazach.",
      "questions": [
        "Jaka jest przyczyna zablokowania drogi?",
        "Czy są oznakowania lub objazdy?",
        "Jak długo droga będzie zamknięta?",
        "Czy dotyka obu kierunków ruchu?"
      ],
      "priority": 1
    },
    "vehicle_breakdown": {
      "keywords": [
        "awaria",
        "zepsuty",
        "stoi",
        "nie jedzie"
      ],
      "systemPrompt": "Asystent ds. zgłaszania awarii pojazdów. Pomagaj w opisie sytuacji i zagrożenia dla ruchu.",
      "questions": [
        "Gdzie stoi zepsuty pojazd?",
        "Czy pojazd blokuje pas ruchu?",
        "Czy są włączone światła awaryjne?",
        "Czy kierowca potrzebuje pomocy?"
      ],
      "priority": 2
    }
  }
}
EOF

# ai/dictionaries/routes.json
cat > ai/dictionaries/routes.json << 'EOF'
{
  "category": "routes",
  "triggers": [
    "trasa",
    "dojazd",
    "jak dojechać",
    "nawigacja",
    "droga do"
  ],
  "subcategories": {
    "planning": {
      "keywords": [
        "zaplanuj",
        "jak dojechać",
        "najszybsza trasa",
        "trasa do"
      ],
      "systemPrompt": "Jesteś asystentem nawigacji. Pomagasz planować trasy z uwzględnieniem aktualnych warunków drogowych, incydentów i preferencji użytkownika.",
      "questions": [
        "Dokąd chcesz dojechać?",
        "Preferujesz trasę najszybszą czy bez autostrad?",
        "Czy chcesz unikać płatnych dróg?",
        "O której godzinie planujesz wyjazd?"
      ],
      "priority": 1
    },
    "alternative": {
      "keywords": [
        "objazd",
        "inna trasa",
        "alternatywna",
        "omiń"
      ],
      "systemPrompt": "Asystent ds. tras alternatywnych. Sugerujesz objazdy w przypadku utrudnień.",
      "questions": [
        "Czego chcesz uniknąć na trasie?",
        "Czy zależy Ci na czasie czy na komforcie?",
        "Czy akceptujesz dłuższą trasę?"
      ],
      "priority": 2
    }
  }
}
EOF

# ai/dictionaries/emergency.json
cat > ai/dictionaries/emergency.json << 'EOF'
{
  "category": "emergency",
  "triggers": [
    "pomocy",
    "nagły",
    "ratunku",
    "niebezpieczeństwo",
    "zagrożenie"
  ],
  "subcategories": {
    "accident_with_injuries": {
      "keywords": [
        "ranni",
        "poszkodowani",
        "krew",
        "nieprzytomny"
      ],
      "systemPrompt": "TRYB AWARYJNY: Priorytet to bezpieczeństwo. Informuj o konieczności wezwania służb ratunkowych (112). Zbieraj kluczowe informacje.",
      "questions": [
        "⚠️ Czy służby ratunkowe już jadą?",
        "Ile osób jest rannych?",
        "Czy ktoś jest nieprzytomny?",
        "Dokładna lokalizacja zdarzenia?"
      ],
      "priority": 10
    },
    "fire": {
      "keywords": [
        "pożar",
        "ogień",
        "dym",
        "pali się"
      ],
      "systemPrompt": "TRYB AWARYJNY - POŻAR: Natychmiast informuj o numerze 998/112. Bezpieczeństwo użytkownika to priorytet.",
      "questions": [
        "🔥 Czy straż pożarna została wezwana?",
        "Co się pali?",
        "Czy są zagrożone osoby?",
        "Czy jesteś w bezpiecznej odległości?"
      ],
      "priority": 10
    }
  }
}
EOF

# ai/dictionaries/index.ts
cat > ai/dictionaries/index.ts << 'EOF'
import incidents from './incidents.json'
import routes from './routes.json'
import emergency from './emergency.json'
import type { Dictionary } from '../types/dictionary.types'

export const dictionaries: Record<string, Dictionary> = {
  incidents: incidents as Dictionary,
  routes: routes as Dictionary,
  emergency: emergency as Dictionary,
}

export function getAllDictionaries(): Dictionary[] {
  return Object.values(dictionaries)
}

export function getDictionary(category: string): Dictionary | undefined {
  return dictionaries[category]
}
EOF

# ai/agent/intent-classifier.ts
cat > ai/agent/intent-classifier.ts << 'EOF'
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
EOF

# ai/agent/context-builder.ts
cat > ai/agent/context-builder.ts << 'EOF'
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
EOF

# ai/services/openai-service.ts
cat > ai/services/openai-service.ts << 'EOF'
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
EOF

# ai/agent/response-formatter.ts
cat > ai/agent/response-formatter.ts << 'EOF'
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
EOF

# ai/agent/agent.ts
cat > ai/agent/agent.ts << 'EOF'
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
EOF

# app/api/chat/route.ts
cat > app/api/chat/route.ts << 'EOF'
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
EOF

echo -e "${GREEN}✓${NC} Utworzono pliki TypeScript\n"

# Tworzenie pliku README dla dokumentacji
echo -e "${BLUE}📄 Tworzenie dokumentacji...${NC}"

cat > ai/README.md << 'EOF'
# AI Agent System

## Struktura

```
ai/
├── agent/              # Główna logika agenta
│   ├── agent.ts       # Orchestrator
│   ├── intent-classifier.ts
│   ├── context-builder.ts
│   └── response-formatter.ts
├── dictionaries/       # Słowniki kontekstowe
│   ├── incidents.json
│   ├── routes.json
│   ├── emergency.json
│   └── index.ts
├── prompts/           # System prompty (TODO)
├── services/          # Zewnętrzne serwisy
│   └── openai-service.ts
└── types/             # TypeScript types
    ├── agent.types.ts
    └── dictionary.types.ts
```

## Użycie

### W komponencie React

```typescript
import { getAgent } from '@/ai/agent/agent'

const agent = getAgent()
const response = await agent.process({
  type: 'incident',
  userMessage: 'Widzę wypadek na rondzie',
  context: { lat: 52.2297, lng: 21.0122 }
})
```

### Przez API

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'incident',
    userMessage: 'Widzę wypadek',
    context: { lat: 52.2297, lng: 21.0122 }
  })
})
```

## Konfiguracja

1. Dodaj do `.env.local`:
```
OPENAI_API_KEY=sk-...
```

2. (Opcjonalnie) Dostosuj słowniki w `ai/dictionaries/*.json`

## Rozwój

- Dodaj nowe kategorie: Stwórz nowy plik JSON w `dictionaries/`
- Dodaj nowe typy: Rozszerz `agent.types.ts`
- Zmień providera AI: Zmodyfikuj `services/openai-service.ts`
EOF

echo -e "${GREEN}✓${NC} Utworzono dokumentację\n"

# Aktualizacja .gitignore
echo -e "${BLUE}📝 Aktualizacja .gitignore...${NC}"

if [ -f ".gitignore" ]; then
    if ! grep -q "# AI Agent" .gitignore; then
        cat >> .gitignore << 'EOF'

# AI Agent
.env.local
ai/cache/
EOF
        echo -e "${GREEN}✓${NC} Zaktualizowano .gitignore"
    else
        echo -e "${YELLOW}⚠${NC}  .gitignore już zawiera wpisy AI Agent"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Nie znaleziono .gitignore"
fi

echo ""

# Tworzenie przykładowego .env.local
echo -e "${BLUE}🔐 Tworzenie przykładowego .env.local...${NC}"

if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here

# Opcjonalne
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_TEMPERATURE=0.7
EOF
    echo -e "${GREEN}✓${NC} Utworzono .env.local (PAMIĘTAJ: Dodaj swój API key!)"
else
    echo -e "${YELLOW}⚠${NC}  .env.local już istnieje - pomijam"
fi

echo ""

# Podsumowanie
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Setup zakończony pomyślnie!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📋 Następne kroki:${NC}"
echo -e "  1. Dodaj swój OpenAI API key do ${GREEN}.env.local${NC}"
echo -e "  2. Zrestartuj dev server: ${GREEN}npm run dev${NC}"
echo -e "  3. Sprawdź dokumentację w: ${GREEN}ai/README.md${NC}"
echo -e "  4. Test API: ${GREEN}http://localhost:3000/api/chat${NC}"
echo -e ""

echo -e "${BLUE}📚 Przydatne pliki:${NC}"
echo -e "  • ${GREEN}ai/agent/agent.ts${NC} - Główny agent"
echo -e "  • ${GREEN}ai/dictionaries/*.json${NC} - Słowniki kontekstów"
echo -e "  • ${GREEN}app/api/chat/route.ts${NC} - API endpoint"
echo -e ""

echo -e "${YELLOW}💡 Przykład użycia w komponencie:${NC}"
echo -e "${GREEN}import { getAgent } from '@/ai/agent/agent'${NC}"
echo -e "${GREEN}const response = await getAgent().process({...})${NC}"
echo -e ""

# Sprawdź czy tsconfig.json wymaga aktualizacji
echo -e "${BLUE}🔧 Sprawdzanie tsconfig.json...${NC}"

if [ -f "tsconfig.json" ]; then
    if grep -q '"paths"' tsconfig.json; then
        echo -e "${GREEN}✓${NC} tsconfig.json zawiera paths - OK"
    else
        echo -e "${YELLOW}⚠${NC}  Sprawdź czy tsconfig.json zawiera aliasy (@/ai, @/components)"
        echo -e "    Przykład:"
        echo -e '    "paths": {'
        echo -e '      "@/*": ["./*"]'
        echo -e '    }'
    fi
fi

echo -e ""
echo -e "${GREEN}🎉 Wszystko gotowe! Powodzenia!${NC}"
