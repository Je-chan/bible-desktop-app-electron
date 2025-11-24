import { useState, useEffect, useRef } from 'react'
import { Book, Settings, X } from 'lucide-react'
import { useBibleStore } from './store/useBibleStore'
import { findBook, BIBLE_BOOKS } from './data/bibleBooks'

function App() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verse, setVerse] = useState('')
  const [fontSize, setFontSize] = useState(30)
  const [currentBookId, setCurrentBookId] = useState(43) // 요한복음
  const [showSettings, setShowSettings] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc')
  const [fontFamily, setFontFamily] = useState('serif')
  const [fontColor, setFontColor] = useState('#1e293b')
  const [systemFonts, setSystemFonts] = useState<string[]>([])

  const bookRef = useRef<HTMLInputElement>(null)
  const chapterRef = useRef<HTMLInputElement>(null)
  const verseRef = useRef<HTMLInputElement>(null)

  const { currentVerse, isLoading, fetchVerse, currentVersion, setCurrentVersion } = useBibleStore()

  // 버전 단축키 매핑
  const versionMap: Record<string, string> = {
    r: '개역한글',
    w: '개역개정',
    s: '새번역',
    e: '쉬운성경',
    z: '한글킹',
    g: '현대인',
    x: '킹흠정역',
    f: '현대어',
    q: '쉬운말',
    a: '우리말',
    n: 'NIV2011',
    m: 'NIV1984',
    k: 'NKJV',
    c: '바른성경',
    v: '베트남',
    b: '베트남2'
  }

  // 설정 불러오기 및 기본값 로드
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await window.settingsApi.get()
      setBackgroundColor(settings.backgroundColor)
      setFontFamily(settings.fontFamily)
      setFontSize(settings.fontSize)
      setFontColor(settings.fontColor)

      // 시스템 폰트 목록 로드
      const fonts = await window.fontsApi.list()
      setSystemFonts(fonts)
    }
    loadSettings()
    fetchVerse('요한복음', 43, 3, 16)
  }, [])

  // 설정 저장
  const saveSettings = async () => {
    await window.settingsApi.set({ backgroundColor, fontFamily, fontSize, fontColor })
    setShowSettings(false)
  }

  // 방향키 및 버전 단축키 제어
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Alt + 알파벳으로 버전 변경
      if (e.altKey && versionMap[e.key.toLowerCase()]) {
        e.preventDefault()
        const newVersion = versionMap[e.key.toLowerCase()]
        setCurrentVersion(newVersion)
        if (currentVerse) {
          const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
          if (currentBook) {
            await fetchVerse(currentBook.name, currentBookId, currentVerse.chapter, currentVerse.verse)
          }
        }
        return
      }

      // 입력 필드에 포커스가 있으면 무시
      if (document.activeElement?.tagName === 'INPUT') return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFontSize((prev) => Math.min(prev + 2, 72))
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
  }, [currentVerse, currentBookId, currentVersion])

  // 절 이동
  const navigateVerse = async (direction: 1 | -1) => {
    if (!currentVerse) return

    const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
    if (!currentBook) return

    let newBookId = currentBookId
    let newChapter = currentVerse.chapter
    let newVerse = currentVerse.verse + direction

    if (direction === 1) {
      // 다음 절
      const maxVerse = await window.bibleApi.getMaxVerse(currentVersion, currentBookId, currentVerse.chapter)

      if (newVerse > maxVerse) {
        // 다음 장으로
        newChapter++
        newVerse = 1

        if (newChapter > currentBook.chapters) {
          // 다음 책으로
          const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId)
          if (bookIndex < BIBLE_BOOKS.length - 1) {
            const nextBook = BIBLE_BOOKS[bookIndex + 1]
            newBookId = nextBook.id
            newChapter = 1
            newVerse = 1
          } else {
            return // 마지막 책
          }
        }
      }
    } else {
      // 이전 절
      if (newVerse < 1) {
        // 이전 장으로
        newChapter--

        if (newChapter < 1) {
          // 이전 책으로
          const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId)
          if (bookIndex > 0) {
            const prevBook = BIBLE_BOOKS[bookIndex - 1]
            newBookId = prevBook.id
            newChapter = prevBook.chapters
          } else {
            return // 첫 번째 책
          }
        }

        // 이전 장의 마지막 절
        newVerse = await window.bibleApi.getMaxVerse(currentVersion, newBookId, newChapter)
      }
    }

    const newBook = BIBLE_BOOKS.find((b) => b.id === newBookId)
    if (newBook) {
      setCurrentBookId(newBookId)
      await fetchVerse(newBook.name, newBookId, newChapter, newVerse)
    }
  }

  const handleSearch = async () => {
    // 빈 필드 체크 및 포커스
    if (!book) {
      bookRef.current?.focus()
      return
    }
    if (!chapter) {
      chapterRef.current?.focus()
      return
    }
    if (!verse) {
      verseRef.current?.focus()
      return
    }

    const foundBook = findBook(book)
    if (!foundBook) {
      bookRef.current?.focus()
      return
    }

    setCurrentBookId(foundBook.id)
    const found = await fetchVerse(foundBook.name, foundBook.id, parseInt(chapter), parseInt(verse))

    if (!found) {
      setBook('')
      bookRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'book' | 'chapter' | 'verse') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'verse') {
      e.preventDefault()
      if (book && chapter && verse) {
        handleSearch()
      }
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header - 현재 책/장/절 표시 */}
      <header className="h-12 border-b flex items-center justify-center px-6" style={{ backgroundColor, borderColor: fontColor }}>
        <div className="flex items-center gap-2" style={{ color: fontColor }}>
          <Book className="w-4 h-4" />
          <span className="text-sm font-medium">
            {currentVerse
              ? `${currentVerse.book} ${currentVerse.chapter}장 ${currentVerse.verse}절 (${currentVersion})`
              : '성경'}
          </span>
        </div>
      </header>

      {/* Content - 말씀 표시 */}
      <main className="flex-1 flex items-start justify-start p-8 overflow-auto">
        {currentVerse ? (
          <div className="w-full px-12">
            <p
              className="leading-relaxed"
              style={{ fontSize: `${fontSize}px`, fontFamily, color: fontColor }}
            >
              <span className="mr-3 opacity-50">
                [{currentVerse.chapter}:{currentVerse.verse}]
              </span>
              {currentVerse.text}
            </p>
          </div>
        ) : (
          <div className="text-slate-400 text-lg italic">
            성경 구절을 검색하세요
          </div>
        )}
      </main>

      {/* Footer - 입력 영역 */}
      <footer className="h-10 border-t flex items-center justify-between px-6" style={{ backgroundColor, borderColor: fontColor }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: fontColor }}>
          <div className="flex items-center gap-1">
            <label className="text-xs opacity-70">책</label>
            <input
              ref={bookRef}
              type="text"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'book')}
              tabIndex={1}
              className="w-16 px-2 py-1 rounded text-sm focus:outline-none border"
              style={{ backgroundColor, color: fontColor, borderColor: fontColor }}
              aria-label="성경 책 이름"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs opacity-70">장</label>
            <input
              ref={chapterRef}
              type="number"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'chapter')}
              tabIndex={2}
              className="w-16 px-2 py-1 rounded text-sm focus:outline-none border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ backgroundColor, color: fontColor, borderColor: fontColor }}
              aria-label="장"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs opacity-70">절</label>
            <input
              ref={verseRef}
              type="number"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'verse')}
              tabIndex={3}
              className="w-16 px-2 py-1 rounded text-sm focus:outline-none border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ backgroundColor, color: fontColor, borderColor: fontColor }}
              aria-label="절"
            />
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1 transition-colors"
          style={{ color: fontColor }}
          tabIndex={-1}
          aria-label="설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </footer>

      {/* Settings Popup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">환경 설정</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 배경 색상 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  배경 색상
                </label>
                <div className="flex gap-2">
                  {['#f8fafc', '#fefce8', '#f0fdf4', '#eff6ff', '#fdf4ff', '#1e293b'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        backgroundColor === color ? 'border-blue-500' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 폰트 종류 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  폰트 종류
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 max-h-48"
                >
                  <option value="serif">기본 명조체</option>
                  <option value="sans-serif">기본 고딕체</option>
                  {systemFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* 폰트 색상 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  폰트 색상
                </label>
                <div className="flex gap-2">
                  {['#1e293b', '#0f172a', '#374151', '#1f2937', '#7c3aed', '#dc2626'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFontColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        fontColor === color ? 'border-blue-500' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 폰트 크기 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  폰트 크기: {fontSize}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                취소
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
