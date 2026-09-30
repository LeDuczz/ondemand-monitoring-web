// Minimal module-level i18n language store (no dependency, no Provider).
//
// Persists the chosen language in localStorage under `odm-lang`. Every
// storage access is wrapped in try/catch because localStorage can throw
// (privacy mode, disabled storage, quota, SSR-less test environments, etc.).
// Default language is Vietnamese ('vi'); any stored value other than
// exactly 'vi' or 'en' falls back to 'vi'.
export type Language = 'vi' | 'en'

const STORAGE_KEY = 'odm-lang'
const DEFAULT_LANGUAGE: Language = 'vi'

type Listener = () => void

const listeners = new Set<Listener>()

function isLanguage(value: unknown): value is Language {
  return value === 'vi' || value === 'en'
}

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function writeStoredLanguage(lang: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore storage failures (privacy mode, quota, etc.)
  }
}

function syncDocumentLang(lang: Language): void {
  try {
    document.documentElement.lang = lang
  } catch {
    // ignore (no document in this environment)
  }
}

let currentLanguage: Language = readStoredLanguage()
syncDocumentLang(currentLanguage)

/** Returns the currently active language ('vi' | 'en'). */
export function getLanguage(): Language {
  return currentLanguage
}

/**
 * Sets the active language, persists it to localStorage, updates
 * `document.documentElement.lang`, and notifies every subscriber.
 */
export function setLanguage(lang: Language): void {
  if (currentLanguage === lang) return
  currentLanguage = lang
  writeStoredLanguage(lang)
  syncDocumentLang(lang)
  listeners.forEach((listener) => listener())
}

/**
 * Subscribes to language changes. Returns an `unsubscribe` function.
 * Intended to be used as the subscribe function of
 * `useSyncExternalStore` (see `useI18n.ts`).
 */
export function subscribeLanguage(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
