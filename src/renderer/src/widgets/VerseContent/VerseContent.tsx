import type { SearchResult } from '../../types/bible'
import { parseVerseText } from '../../shared/lib'

interface VerseContentProps {
  currentVerse: SearchResult | null
  fontSize: number
  fontFamily: string
  fontColor: string
  paddingX: number
}

export const VerseContent = ({ currentVerse, fontSize, fontFamily, fontColor, paddingX }: VerseContentProps) => {
  return (
    <main className="flex-1 flex items-start justify-start p-8 overflow-auto">
      {currentVerse ? (
        <div className="w-full" style={{ paddingLeft: paddingX, paddingRight: paddingX }}>
          <p
            className="leading-relaxed"
            style={{ fontSize: `${fontSize}px`, fontFamily, color: fontColor }}
          >
            <span className="mr-3 opacity-50">
              [{currentVerse.chapter}:{currentVerse.verse}]
            </span>
            {parseVerseText(currentVerse.text)}
          </p>
        </div>
      ) : (
        <div className="text-slate-400 text-lg italic">
          성경 구절을 검색하세요
        </div>
      )}
    </main>
  )
}
