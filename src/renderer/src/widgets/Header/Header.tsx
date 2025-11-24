import { Book } from 'lucide-react'
import type { SearchResult } from '../../types/bible'

interface HeaderProps {
  currentVerse: SearchResult | null
  currentVersion: string
  backgroundColor: string
  fontColor: string
}

export const Header = ({ currentVerse, currentVersion, backgroundColor, fontColor }: HeaderProps) => {
  return (
    <header
      className="h-12 border-b flex items-center justify-center px-6"
      style={{ backgroundColor, borderColor: fontColor }}
    >
      <div className="flex items-center gap-2" style={{ color: fontColor }}>
        <Book className="w-4 h-4" />
        <span className="text-sm font-medium">
          {currentVerse
            ? `${currentVerse.book} ${currentVerse.chapter}장 ${currentVerse.verse}절 (${currentVersion})`
            : '성경'}
        </span>
      </div>
    </header>
  )
}
