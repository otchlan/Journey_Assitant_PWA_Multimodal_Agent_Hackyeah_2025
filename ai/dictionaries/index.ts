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
