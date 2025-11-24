import { create } from 'zustand'
import type { SearchResult } from '../types/bible'

interface BibleStore {
  currentVerse: SearchResult | null
  recentSearches: SearchResult[]
  isLoading: boolean
  currentVersion: string
  setCurrentVerse: (verse: SearchResult) => void
  addToRecent: (verse: SearchResult) => void
  setCurrentVersion: (version: string) => void
  fetchVerse: (
    bookName: string,
    bookNumber: number,
    chapter: number,
    verse: number
  ) => Promise<boolean>
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  currentVerse: null,
  recentSearches: [],
  isLoading: false,
  currentVersion: '개역한글',

  setCurrentVerse: (verse) => set({ currentVerse: verse }),

  addToRecent: (verse) =>
    set((state) => ({
      recentSearches: [
        verse,
        ...state.recentSearches.filter((v) => v.reference !== verse.reference)
      ].slice(0, 10) // 최근 10개만 저장
    })),

  setCurrentVersion: (version) => set({ currentVersion: version }),

  fetchVerse: async (bookName, bookNumber, chapter, verse) => {
    set({ isLoading: true })

    const { currentVersion, addToRecent } = get()
    const text = await window.bibleApi.getVerse(currentVersion, bookNumber, chapter, verse)

    if (text) {
      const result: SearchResult = {
        book: bookName,
        chapter,
        verse,
        text,
        reference: `${bookName} ${chapter}:${verse}`
      }
      set({ currentVerse: result, isLoading: false })
      addToRecent(result)
      return true
    } else {
      set({ isLoading: false })
      return false
    }
  }
}))
