import { useState, useEffect, useRef, useCallback } from 'react'
import { useBibleStore } from './store/useBibleStore'
import { useSettings } from './shared/hooks'
import { useVerseNavigation } from './features/verse-navigation'
import { useVerseSearch } from './features/verse-search'
import { useVersionSwitch } from './features/version-switch'
import { useVerseCopy } from './features/verse-copy'
import { BIBLE_BOOKS } from './shared/config'
import { Header } from './widgets/Header'
import { VerseContent } from './widgets/VerseContent'
import { Footer } from './widgets/Footer'
import { SettingsModal } from './widgets/SettingsModal'
import { ScriptureRangeModal } from './widgets/ScriptureRangeModal'
import { KeyboardShortcutsModal } from './widgets/KeyboardShortcutsModal'
import { VersionComparePanel } from './widgets/VersionComparePanel'
import { SearchPanel } from './widgets/SearchPanel'

function App() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verse, setVerse] = useState('')
  const [currentBookId, setCurrentBookId] = useState(43) // 요한복음
  const [showSettings, setShowSettings] = useState(false)
  const [showScriptureRange, setShowScriptureRange] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const bookRef = useRef<HTMLInputElement>(null)
  const chapterRef = useRef<HTMLInputElement>(null)
  const verseRef = useRef<HTMLInputElement>(null)

  const {
    currentVerse,
    fetchVerse,
    currentVersion,
    currentScripture,
    todayScriptureRange,
    setTodayScriptureRange,
    // 역본 비교 관련
    isCompareOpen,
    comparedVersion,
    comparedVerse,
    setCompareOpen
  } = useBibleStore()

  // 본문 말씀 범위가 변경되면 시작 구절로 이동
  useEffect(() => {
    if (todayScriptureRange) {
      const { start } = todayScriptureRange
      const book = BIBLE_BOOKS.find((b) => b.id === start.bookId)
      if (book) {
        setCurrentBookId(start.bookId)
        fetchVerse(book.abbr, start.bookId, start.chapter, start.verse)
      }
    }
  }, [todayScriptureRange])
  const { settings, updateSettings, saveSettings } = useSettings()

  // 복사 성공 시 토스트 표시
  const handleCopySuccess = useCallback(() => {
    setShowCopyToast(true)
    setTimeout(() => setShowCopyToast(false), 2000)
  }, [])

  // 구절 복사 기능
  useVerseCopy({ onCopySuccess: handleCopySuccess })

  // 검색 결과에서 구절 선택 시
  const handleSelectSearchResult = useCallback(
    (bookAbbr: string, bookId: number, chapter: number, verse: number) => {
      setCurrentBookId(bookId)
      fetchVerse(bookAbbr, bookId, chapter, verse)
    },
    [fetchVerse]
  )

  // ESC로 Footer Input blur (모달/패널이 열려있지 않을 때만)
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      // 모달이 열려있으면 모달이 처리함 (capture phase)
      if (showSettings || showScriptureRange || showKeyboardShortcuts) return

      // 패널이 열려있으면 패널이 처리함
      if (showSearch || isCompareOpen) return

      // Footer input이 focused인지 확인
      const activeElement = document.activeElement
      const isFooterInputFocused =
        activeElement === bookRef.current ||
        activeElement === chapterRef.current ||
        activeElement === verseRef.current

      if (isFooterInputFocused && activeElement instanceof HTMLElement) {
        activeElement.blur()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [showSettings, showScriptureRange, showKeyboardShortcuts, showSearch, isCompareOpen])

  // Cmd/Ctrl+F로 검색 패널 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        // 모달이 열려 있으면 모달 닫고 검색 패널 열기
        if (showSettings || showScriptureRange || showKeyboardShortcuts) {
          setShowSettings(false)
          setShowScriptureRange(false)
          setShowKeyboardShortcuts(false)
          setShowSearch(true)
          setCompareOpen(false)
        } else {
          setShowSearch((prev) => {
            if (!prev) {
              // 검색 패널 열 때 역본 비교 패널 닫기
              setCompareOpen(false)
            }
            return !prev
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCompareOpen, showSettings, showScriptureRange, showKeyboardShortcuts])

  // 역본 비교 패널이 열리면 검색 패널 닫기
  useEffect(() => {
    if (isCompareOpen) {
      setShowSearch(false)
    }
  }, [isCompareOpen])

  // 초기 구절 로드
  useEffect(() => {
    fetchVerse('요', 43, 3, 16)
  }, [])

  // currentVerse가 변경될 때 Footer 입력 필드 동기화
  useEffect(() => {
    if (currentVerse) {
      setBook(currentVerse.book)
      setChapter(currentVerse.chapter.toString())
      setVerse(currentVerse.verse.toString())
    }
  }, [currentVerse])

  // 절 이동 기능
  const { navigateVerse } = useVerseNavigation(currentBookId, setCurrentBookId)

  // 키보드 단축키 (버전 변경, 폰트 크기, 절 이동)
  useVersionSwitch({
    currentBookId,
    setFontSize: (updater) => {
      if (typeof updater === 'function') {
        updateSettings({ fontSize: updater(settings.fontSize) })
      } else {
        updateSettings({ fontSize: updater })
      }
    },
    navigateVerse
  })

  // 검색 기능
  const { handleKeyDown } = useVerseSearch({
    book,
    chapter,
    verse,
    setBook,
    setCurrentBookId,
    bookRef,
    chapterRef,
    verseRef
  })

  // 설정 저장 및 모달 닫기
  const handleSaveSettings = async () => {
    await saveSettings()
    setShowSettings(false)
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: settings.backgroundColor }}>
      <Header
        currentVerse={currentVerse}
        currentVersion={currentVersion}
        backgroundColor={settings.backgroundColor}
        fontColor={settings.fontColor}
      />

      {/* 메인 컨텐츠 영역 - 스플릿 뷰 */}
      <div className="flex-1 flex min-h-0">
        {/* 왼쪽: 현재 구절 */}
        <div className={`flex flex-col ${isCompareOpen || showSearch ? 'flex-1' : 'w-full'}`}>
          <VerseContent
            currentVerse={currentVerse}
            fontSize={settings.fontSize}
            fontFamily={settings.fontFamily}
            fontColor={settings.fontColor}
            paddingX={settings.paddingX}
          />
        </div>

        {/* 오른쪽: 역본 비교 */}
        <VersionComparePanel
          isOpen={isCompareOpen}
          comparedVersion={comparedVersion}
          comparedVerse={comparedVerse}
          fontSize={settings.fontSize}
          fontFamily={settings.fontFamily}
          fontColor={settings.fontColor}
          paddingX={settings.paddingX}
        />

        {/* 오른쪽: 검색 패널 */}
        <SearchPanel
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onSelectVerse={handleSelectSearchResult}
        />
      </div>

      <Footer
        book={book}
        chapter={chapter}
        verse={verse}
        backgroundColor={settings.backgroundColor}
        fontColor={settings.fontColor}
        bookRef={bookRef}
        chapterRef={chapterRef}
        verseRef={verseRef}
        onBookChange={setBook}
        onChapterChange={setChapter}
        onVerseChange={setVerse}
        onKeyDown={handleKeyDown}
        onSettingsClick={() => setShowSettings(true)}
        onScriptureRangeClick={() => setShowScriptureRange(true)}
        onKeyboardShortcutsClick={() => setShowKeyboardShortcuts(true)}
        currentScripture={currentScripture?.reference}
      />

      <SettingsModal
        isOpen={showSettings}
        backgroundColor={settings.backgroundColor}
        fontFamily={settings.fontFamily}
        fontSize={settings.fontSize}
        fontColor={settings.fontColor}
        paddingX={settings.paddingX}
        systemFonts={settings.systemFonts}
        onBackgroundColorChange={(color) => updateSettings({ backgroundColor: color })}
        onFontFamilyChange={(font) => updateSettings({ fontFamily: font })}
        onFontSizeChange={(size) => updateSettings({ fontSize: size })}
        onFontColorChange={(color) => updateSettings({ fontColor: color })}
        onPaddingXChange={(padding) => updateSettings({ paddingX: padding })}
        onSave={handleSaveSettings}
        onClose={() => setShowSettings(false)}
      />

      <ScriptureRangeModal
        isOpen={showScriptureRange}
        todayScriptureRange={todayScriptureRange}
        onSave={setTodayScriptureRange}
        onClose={() => setShowScriptureRange(false)}
      />

      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* 복사 완료 토스트 */}
      {showCopyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          구절이 복사되었습니다
        </div>
      )}
    </div>
  )
}

export default App
