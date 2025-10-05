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
