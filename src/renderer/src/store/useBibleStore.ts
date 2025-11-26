import { create } from 'zustand'
import type { SearchResult, ScriptureRange } from '../types/bible'

interface BibleStore {
  currentVerse: SearchResult | null
  recentSearches: SearchResult[]
  isLoading: boolean
  currentVersion: string
  todayScriptureRange: ScriptureRange | null
  currentScripture: SearchResult | null
  // 역본 비교 관련
  isCompareOpen: boolean
  comparedVersion: string
  comparedVerse: SearchResult | null
  setCurrentVerse: (verse: SearchResult) => void
  addToRecent: (verse: SearchResult) => void
  setCurrentVersion: (version: string) => void
  setTodayScriptureRange: (range: ScriptureRange | null) => void
  // 역본 비교 관련
  setCompareOpen: (isOpen: boolean) => void
  setComparedVersion: (version: string) => void
  fetchComparedVerse: (bookNumber: number, chapter: number, verse: number) => Promise<void>
  fetchVerse: (
    bookName: string,
    bookNumber: number,
    chapter: number,
    verse: number
  ) => Promise<boolean>
}

// 절이 범위 내에 있는지 확인하는 헬퍼 함수
const isVerseInRange = (
  bookNumber: number,
  chapter: number,
  verse: number,
  range: ScriptureRange
): boolean => {
  const { start, end } = range

  // 절대 위치 계산 (bookId * 1000000 + chapter * 1000 + verse)
  const currentPos = bookNumber * 1000000 + chapter * 1000 + verse
  const startPos = start.bookId * 1000000 + start.chapter * 1000 + start.verse
  const endPos = end.bookId * 1000000 + end.chapter * 1000 + end.verse

  return currentPos >= startPos && currentPos <= endPos
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  currentVerse: null,
  recentSearches: [],
  isLoading: false,
  currentVersion: '개역한글',
  todayScriptureRange: null,
  currentScripture: null,
  // 역본 비교 관련
  isCompareOpen: false,
  comparedVersion: '개역한글',
  comparedVerse: null,

  setCurrentVerse: (verse) => set({ currentVerse: verse }),

  addToRecent: (verse) =>
    set((state) => ({
      recentSearches: [
        verse,
        ...state.recentSearches.filter((v) => v.reference !== verse.reference)
      ].slice(0, 10) // 최근 10개만 저장
    })),

  setCurrentVersion: (version) => set({ currentVersion: version }),

  setTodayScriptureRange: (range) => set({ todayScriptureRange: range, currentScripture: null }),

  // 역본 비교 관련
  setCompareOpen: (isOpen) => set({ isCompareOpen: isOpen }),

  setComparedVersion: (version) => set({ comparedVersion: version }),

  fetchComparedVerse: async (bookNumber, chapter, verse) => {
    const { comparedVersion, currentVerse } = get()
    const text = await window.bibleApi.getVerse(comparedVersion, bookNumber, chapter, verse)

    if (text && currentVerse) {
      set({
        comparedVerse: {
          book: currentVerse.book,
          chapter,
          verse,
          text,
          reference: `${currentVerse.book} ${chapter}:${verse}`
        }
      })
    } else {
      set({ comparedVerse: null })
    }
  },

  fetchVerse: async (bookName, bookNumber, chapter, verse) => {
    set({ isLoading: true })

    const { currentVersion, addToRecent, todayScriptureRange, isCompareOpen, fetchComparedVerse } = get()
    const text = await window.bibleApi.getVerse(currentVersion, bookNumber, chapter, verse)

    if (text) {
      const result: SearchResult = {
        book: bookName,
        chapter,
        verse,
        text,
        reference: `${bookName} ${chapter}:${verse}`
      }

      // 범위 내에 있으면 currentScripture 업데이트
      const updates: Partial<BibleStore> = {
        currentVerse: result,
        isLoading: false
      }

      if (todayScriptureRange && isVerseInRange(bookNumber, chapter, verse, todayScriptureRange)) {
        updates.currentScripture = result
      }

      set(updates as BibleStore)
      addToRecent(result)

      // 비교 뷰가 열려있으면 비교 구절도 함께 fetch
      if (isCompareOpen) {
        await fetchComparedVerse(bookNumber, chapter, verse)
      }

      return true
    } else {
      set({ isLoading: false })
      return false
    }
  }
}))
