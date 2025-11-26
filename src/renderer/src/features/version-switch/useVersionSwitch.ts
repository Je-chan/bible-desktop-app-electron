import { useEffect } from 'react'
import { VERSION_MAP, BIBLE_BOOKS } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

/**
 * Interactive 요소에 포커스가 있는지 확인
 * 방향키 등의 단축키가 이런 요소들의 기본 동작을 방해하지 않도록 함
 */
const isInteractiveElementFocused = (): boolean => {
  const activeElement = document.activeElement
  if (!activeElement || activeElement === document.body) return false

  const tag = activeElement.tagName

  // 폼 요소들
  if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag)) return true

  // contenteditable 요소
  if (activeElement.getAttribute('contenteditable') === 'true') return true

  // ARIA role로 interactive 요소 판별
  const role = activeElement.getAttribute('role')
  if (role) {
    const interactiveRoles = [
      'textbox', 'listbox', 'slider', 'spinbutton',
      'combobox', 'option', 'menuitem', 'menu', 'menubar',
      'tab', 'tablist', 'switch', 'searchbox'
    ]
    if (interactiveRoles.includes(role)) return true
  }

  return false
}

interface UseVersionSwitchProps {
  currentBookId: number
  setFontSize: React.Dispatch<React.SetStateAction<number>>
  navigateVerse: (direction: 1 | -1) => Promise<void>
}

export const useVersionSwitch = ({ currentBookId, setFontSize, navigateVerse }: UseVersionSwitchProps) => {
  const {
    currentVerse,
    fetchVerse,
    currentVersion,
    setCurrentVersion,
    currentScripture,
    todayScriptureRange,
    // 역본 비교 관련
    isCompareOpen,
    setCompareOpen,
    setComparedVersion,
    fetchComparedVerse
  } = useBibleStore()

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

      // Cmd/Ctrl + B: 비교 패널 토글
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        if (!isCompareOpen) {
          // 패널 열 때 currentVersion과 동일한 버전으로 설정
          setComparedVersion(currentVersion)
          setCompareOpen(true)
          if (currentVerse) {
            const currentBook = BIBLE_BOOKS.find((b) => b.abbr === currentVerse.book)
            if (currentBook) {
              await fetchComparedVerse(currentBook.id, currentVerse.chapter, currentVerse.verse)
            }
          }
        } else {
          setCompareOpen(false)
        }
        return
      }

      // ESC: 비교 패널 닫기
      if (e.key === 'Escape' && isCompareOpen) {
        e.preventDefault()
        setCompareOpen(false)
        return
      }

      // Alt + Shift + 알파벳: 비교 버전 변경 (+ 패널 열기)
      if (e.altKey && e.shiftKey && VERSION_MAP[e.key.toLowerCase()]) {
        e.preventDefault()
        const newVersion = VERSION_MAP[e.key.toLowerCase()]
        setComparedVersion(newVersion)

        // 패널이 닫혀있으면 열기
        if (!isCompareOpen) {
          setCompareOpen(true)
        }

        // 비교 구절 fetch
        if (currentVerse) {
          const currentBook = BIBLE_BOOKS.find((b) => b.abbr === currentVerse.book)
          if (currentBook) {
            await fetchComparedVerse(currentBook.id, currentVerse.chapter, currentVerse.verse)
          }
        }
        return
      }

      // Alt + 알파벳: 현재 버전 변경 (Shift 없이)
      if (e.altKey && !e.shiftKey && VERSION_MAP[e.key.toLowerCase()]) {
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

      // Interactive 요소에 포커스가 있으면 방향키 단축키 무시
      // (SELECT option 탐색, range 조절, button 키보드 조작 등이 정상 동작하도록)
      if (isInteractiveElementFocused()) return

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
  }, [
    currentVerse,
    currentBookId,
    currentVersion,
    navigateVerse,
    setFontSize,
    fetchVerse,
    setCurrentVersion,
    currentScripture,
    todayScriptureRange,
    isCompareOpen,
    setCompareOpen,
    setComparedVersion,
    fetchComparedVerse
  ])
}
