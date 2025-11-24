import { create } from 'zustand'
import type { SearchResult } from '../types/bible'

interface BibleStore {
  currentVerse: SearchResult | null
  recentSearches: SearchResult[]
  setCurrentVerse: (verse: SearchResult) => void
  addToRecent: (verse: SearchResult) => void
}

export const useBibleStore = create<BibleStore>((set) => ({
  currentVerse: null,
  recentSearches: [],

  setCurrentVerse: (verse) => set({ currentVerse: verse }),

  addToRecent: (verse) =>
    set((state) => ({
      recentSearches: [
        verse,
        ...state.recentSearches.filter((v) => v.reference !== verse.reference)
      ].slice(0, 10) // 최근 10개만 저장
    }))
}))
