import { useState, useEffect, useRef } from 'react'
import { useBibleStore } from './store/useBibleStore'
import { useSettings } from './shared/hooks'
import { useVerseNavigation } from './features/verse-navigation'
import { useVerseSearch } from './features/verse-search'
import { useVersionSwitch } from './features/version-switch'
import { Header } from './widgets/Header'
import { VerseContent } from './widgets/VerseContent'
import { Footer } from './widgets/Footer'
import { SettingsModal } from './widgets/SettingsModal'
import { ScriptureRangeModal } from './widgets/ScriptureRangeModal'

function App() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verse, setVerse] = useState('')
  const [currentBookId, setCurrentBookId] = useState(43) // 요한복음
  const [showSettings, setShowSettings] = useState(false)
  const [showScriptureRange, setShowScriptureRange] = useState(false)

  const bookRef = useRef<HTMLInputElement>(null)
  const chapterRef = useRef<HTMLInputElement>(null)
  const verseRef = useRef<HTMLInputElement>(null)

  const { currentVerse, fetchVerse, currentVersion, currentScripture, todayScriptureRange, setTodayScriptureRange } = useBibleStore()
  const { settings, updateSettings, saveSettings } = useSettings()

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

      <VerseContent
        currentVerse={currentVerse}
        fontSize={settings.fontSize}
        fontFamily={settings.fontFamily}
        fontColor={settings.fontColor}
        paddingX={settings.paddingX}
      />

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
    </div>
  )
}

export default App
