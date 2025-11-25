import { Settings, BookOpen, Info } from 'lucide-react'

interface FooterProps {
  book: string
  chapter: string
  verse: string
  backgroundColor: string
  fontColor: string
  bookRef: React.RefObject<HTMLInputElement | null>
  chapterRef: React.RefObject<HTMLInputElement | null>
  verseRef: React.RefObject<HTMLInputElement | null>
  onBookChange: (value: string) => void
  onChapterChange: (value: string) => void
  onVerseChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent, field: 'book' | 'chapter' | 'verse') => void
  onSettingsClick: () => void
  onScriptureRangeClick: () => void
  onKeyboardShortcutsClick: () => void
  currentScripture?: string | null
}

export const Footer = ({
  book,
  chapter,
  verse,
  backgroundColor,
  fontColor,
  bookRef,
  chapterRef,
  verseRef,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onKeyDown,
  onSettingsClick,
  onScriptureRangeClick,
  onKeyboardShortcutsClick,
  currentScripture
}: FooterProps) => {
  return (
    <footer
      className="h-10 border-t flex items-center justify-between px-6"
      style={{ backgroundColor, borderColor: fontColor }}
    >
      <div className="flex items-center gap-3 text-sm" style={{ color: fontColor }}>
        <div className="flex items-center gap-1">
          <label className="text-xs opacity-70">책</label>
          <input
            ref={bookRef}
            type="text"
            value={book}
            onChange={(e) => onBookChange(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, 'book')}
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
            onChange={(e) => onChapterChange(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, 'chapter')}
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
            onChange={(e) => onVerseChange(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, 'verse')}
            tabIndex={3}
            className="w-16 px-2 py-1 rounded text-sm focus:outline-none border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ backgroundColor, color: fontColor, borderColor: fontColor }}
            aria-label="절"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onScriptureRangeClick}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-100"
          style={{ color: fontColor, opacity: currentScripture ? 1 : 0.5 }}
          title="본문 말씀 범위 설정 (Cmd/Ctrl+Shift+C로 이동)"
          tabIndex={-1}
        >
          <BookOpen className="w-3 h-3" />
          {currentScripture && <span>{currentScripture}</span>}
        </button>
        <button
          onClick={onKeyboardShortcutsClick}
          className="p-1 transition-colors hover:opacity-80"
          style={{ color: fontColor }}
          tabIndex={-1}
          aria-label="단축키"
          title="단축키 보기"
        >
          <Info className="w-4 h-4" />
        </button>
        <button
          onClick={onSettingsClick}
          className="p-1 transition-colors"
          style={{ color: fontColor }}
          tabIndex={-1}
          aria-label="설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </footer>
  )
}
