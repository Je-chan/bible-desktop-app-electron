import { Book } from 'lucide-react'
import type { SearchResult } from '../../types/bible'
import { BIBLE_BOOKS } from '../../shared/config'

interface HeaderProps {
  currentVerse: SearchResult | null
  currentVersion: string
  backgroundColor: string
  fontColor: string
  headerFontSize: number
  headerPaddingY: number
  headerAlign: 'left' | 'center' | 'right'
}

export const Header = ({
  currentVerse,
  currentVersion,
  backgroundColor,
  fontColor,
  headerFontSize,
  headerPaddingY,
  headerAlign
}: HeaderProps) => {
  // abbr을 name으로 변환
  const getBookName = (abbr: string) => {
    const book = BIBLE_BOOKS.find((b) => b.abbr === abbr)
    return book?.name || abbr
  }

  return (
    <header
      className={`border-b flex items-center px-6 ${
        headerAlign === 'left'
          ? 'justify-start'
          : headerAlign === 'right'
            ? 'justify-end'
            : 'justify-center'
      }`}
      style={{
        backgroundColor,
        borderColor: backgroundColor,
        paddingTop: headerPaddingY,
        paddingBottom: headerPaddingY
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ color: fontColor, fontSize: headerFontSize }}
      >
        <Book style={{ width: headerFontSize, height: headerFontSize }} />
        <span className="font-medium">
          {currentVerse
            ? `${getBookName(currentVerse.book)} ${currentVerse.chapter}장 ${currentVerse.verse}절 (${currentVersion})`
            : '성경'}
        </span>
      </div>
    </header>
  )
}
