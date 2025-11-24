import { create } from 'zustand'
export const useBibleStore = create((set) => ({
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
