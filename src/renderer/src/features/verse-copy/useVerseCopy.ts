import { useEffect, useCallback } from 'react'
import { useBibleStore } from '../../store/useBibleStore'
import { BIBLE_BOOKS } from '../../shared/config'

interface UseVerseCopyProps {
  onCopySuccess?: () => void
}

// HTML 태그 제거 헬퍼 함수
const cleanVerseText = (text: string) =>
  text
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .trim()

export const useVerseCopy = ({ onCopySuccess }: UseVerseCopyProps = {}) => {
  const {
    currentVerse,
    currentVersion,
    isCompareOpen,
    comparedVersion,
    comparedVerse
  } = useBibleStore()

  // 구절을 포맷팅하여 복사 텍스트 생성
  const formatVerseForCopy = useCallback(() => {
    if (!currentVerse) return null

    const book = BIBLE_BOOKS.find((b) => b.abbr === currentVerse.book)
    const bookName = book?.name || currentVerse.book

    const cleanText = cleanVerseText(currentVerse.text)
    const mainText = `[${bookName} ${currentVerse.chapter}:${currentVerse.verse} (${currentVersion})] ${cleanText}`

    // 비교 모드이고 비교 구절이 있으면 함께 복사
    if (isCompareOpen && comparedVerse) {
      const comparedCleanText = cleanVerseText(comparedVerse.text)
      const comparedText = `[${bookName} ${currentVerse.chapter}:${currentVerse.verse} (${comparedVersion})] ${comparedCleanText}`
      return `${mainText}\n${comparedText}`
    }

    return mainText
  }, [currentVerse, currentVersion, isCompareOpen, comparedVersion, comparedVerse])

  // 클립보드에 복사
  const copyVerse = useCallback(async () => {
    const text = formatVerseForCopy()
    if (!text) return false

    try {
      await navigator.clipboard.writeText(text)
      onCopySuccess?.()
      return true
    } catch (error) {
      console.error('Failed to copy verse:', error)
      return false
    }
  }, [formatVerseForCopy, onCopySuccess])

  // Cmd/Ctrl+C 단축키 처리
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 기본 동작 유지
      if (document.activeElement?.tagName === 'INPUT') return

      // Cmd/Ctrl+C (Shift 없이)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        await copyVerse()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [copyVerse])

  return { copyVerse, formatVerseForCopy }
}
