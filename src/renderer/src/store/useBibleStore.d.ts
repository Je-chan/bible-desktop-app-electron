import type { SearchResult } from '../types/bible'
interface BibleStore {
  currentVerse: SearchResult | null
  recentSearches: SearchResult[]
  setCurrentVerse: (verse: SearchResult) => void
  addToRecent: (verse: SearchResult) => void
}
export declare const useBibleStore: import('zustand').UseBoundStore<
  import('zustand').StoreApi<BibleStore>
>
export {}
