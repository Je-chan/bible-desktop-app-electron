import { useEffect } from 'react'
import { VERSION_MAP, BIBLE_BOOKS } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

interface UseVersionSwitchProps {
  currentBookId: number
  setFontSize: React.Dispatch<React.SetStateAction<number>>
  navigateVerse: (direction: 1 | -1) => Promise<void>
}

export const useVersionSwitch = ({ currentBookId, setFontSize, navigateVerse }: UseVersionSwitchProps) => {
  const { currentVerse, fetchVerse, currentVersion, setCurrentVersion, currentScripture, todayScriptureRange } =
    useBibleStore()

  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + C: 본문 말씀(currentScripture)로 이동
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        if (currentScripture && todayScriptureRange) {
          const book = BIBLE_BOOKS.find((b) => b.abbr === currentScripture.book)
          if (book) {
            await fetchVerse(book.abbr, book.id, currentScripture.chapter, currentScripture.verse)
          }
        }
        return
      }

      // Alt + 알파벳으로 버전 변경
      if (e.altKey && VERSION_MAP[e.key.toLowerCase()]) {
        e.preventDefault()
        const newVersion = VERSION_MAP[e.key.toLowerCase()]
        setCurrentVersion(newVersion)
        if (currentVerse) {
          const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
          if (currentBook) {
            await fetchVerse(currentBook.abbr, currentBookId, currentVerse.chapter, currentVerse.verse)
          }
        }
        return
      }

      // 입력 필드에 포커스가 있으면 무시
      if (document.activeElement?.tagName === 'INPUT') return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFontSize((prev) => Math.min(prev + 2, 150))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFontSize((prev) => Math.max(prev - 2, 16))
      } else if (e.key === 'ArrowRight' && currentVerse) {
        e.preventDefault()
        await navigateVerse(1)
      } else if (e.key === 'ArrowLeft' && currentVerse) {
        e.preventDefault()
        await navigateVerse(-1)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [currentVerse, currentBookId, currentVersion, navigateVerse, setFontSize, fetchVerse, setCurrentVersion, currentScripture, todayScriptureRange])
}
