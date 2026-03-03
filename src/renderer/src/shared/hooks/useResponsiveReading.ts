import { useState, useEffect, useCallback, useRef } from 'react'
import { useBibleStore } from '../../store/useBibleStore'
import { BIBLE_BOOKS } from '../config'
import { DEFAULT_RESPONSIVE_COLORS } from '../lib'
import type { ResponsiveReadingRole } from '../lib'

const getRoleFromIndex = (index: number, totalVerses: number): ResponsiveReadingRole => {
  if (totalVerses === 0 || index < 0) return null

  const isLastVerse = index === totalVerses - 1
  const isLeaderTurn = index % 2 === 0

  if (isLastVerse && isLeaderTurn) return 'unison'
  return isLeaderTurn ? 'leader' : 'congregation'
}

export const useResponsiveReading = (customColors?: Partial<typeof DEFAULT_RESPONSIVE_COLORS>) => {
  const { isResponsiveReading, todayScriptureRange, currentVersion } = useBibleStore()
  const [totalVerses, setTotalVerses] = useState(0)
  const totalVersesRef = useRef(0)

  const colors = { ...DEFAULT_RESPONSIVE_COLORS, ...customColors }
  const isActive = isResponsiveReading && todayScriptureRange !== null

  // 범위 내 총 절 수 가져오기
  useEffect(() => {
    if (!isActive || !todayScriptureRange) {
      setTotalVerses(0)
      totalVersesRef.current = 0
      return
    }

    const { start, end } = todayScriptureRange
    window.bibleApi
      .countVersesInRange(
        currentVersion,
        start.bookId,
        start.chapter,
        start.verse,
        end.bookId,
        end.chapter,
        end.verse
      )
      .then((count) => {
        totalVersesRef.current = count
        setTotalVerses(count)
      })
  }, [isActive, todayScriptureRange, currentVersion])

  // 장 내 구절들의 역할을 일괄 계산 (ChapterContent, FocusContent 용)
  const getRolesForChapter = useCallback(
    async (
      bookAbbr: string,
      chapter: number,
      verses: number[]
    ): Promise<Map<number, ResponsiveReadingRole>> => {
      const roles = new Map<number, ResponsiveReadingRole>()
      const total = totalVersesRef.current
      if (!todayScriptureRange || total === 0) return roles

      const book = BIBLE_BOOKS.find((b) => b.abbr === bookAbbr)
      if (!book) return roles

      const { start, end } = todayScriptureRange
      const startPos = start.bookId * 1000000 + start.chapter * 1000 + start.verse
      const endPos = end.bookId * 1000000 + end.chapter * 1000 + end.verse

      // 첫 번째 범위 내 구절의 인덱스만 IPC로 가져오고 나머지는 오프셋 계산
      let firstIndexInRange: number | null = null

      for (const v of verses) {
        const pos = book.id * 1000000 + chapter * 1000 + v
        if (pos >= startPos && pos <= endPos) {
          firstIndexInRange = await window.bibleApi.getVerseIndexInRange(
            currentVersion,
            book.id,
            chapter,
            v,
            start.bookId,
            start.chapter,
            start.verse
          )
          break
        }
      }

      if (firstIndexInRange === null) return roles

      // 같은 장 내에서는 구절 순서가 연속이므로 오프셋으로 계산
      let offset = 0
      for (const v of verses) {
        const pos = book.id * 1000000 + chapter * 1000 + v
        if (pos >= startPos && pos <= endPos) {
          roles.set(v, getRoleFromIndex(firstIndexInRange + offset, total))
          offset++
        }
      }

      return roles
    },
    [todayScriptureRange, currentVersion]
  )

  // 단일 구절의 역할 (VerseContent 용)
  const getRoleForVerse = useCallback(
    async (bookAbbr: string, chapter: number, verse: number): Promise<ResponsiveReadingRole> => {
      const total = totalVersesRef.current
      if (!todayScriptureRange || total === 0) return null

      const book = BIBLE_BOOKS.find((b) => b.abbr === bookAbbr)
      if (!book) return null

      const { start, end } = todayScriptureRange
      const currentPos = book.id * 1000000 + chapter * 1000 + verse
      const startPos = start.bookId * 1000000 + start.chapter * 1000 + start.verse
      const endPos = end.bookId * 1000000 + end.chapter * 1000 + end.verse

      if (currentPos < startPos || currentPos > endPos) return null

      const index = await window.bibleApi.getVerseIndexInRange(
        currentVersion,
        book.id,
        chapter,
        verse,
        start.bookId,
        start.chapter,
        start.verse
      )

      return getRoleFromIndex(index, total)
    },
    [todayScriptureRange, currentVersion]
  )

  return { isActive, totalVerses, colors, getRolesForChapter, getRoleForVerse }
}
