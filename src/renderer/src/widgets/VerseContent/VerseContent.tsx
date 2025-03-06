import type { SearchResult } from '../../types/bible'
import type { ResponsiveReadingRole } from '../../shared/lib'
import { parseVerseText } from '../../shared/lib'

interface VerseContentProps {
  currentVerse: SearchResult | null
  fontSize: number
  fontFamily: string
  fontColor: string
  paddingX: number
  paddingY: number
  responsiveRole?: ResponsiveReadingRole
  responsiveColor?: string
}

export const VerseContent = ({
  currentVerse,
  fontSize,
  fontFamily,
  fontColor,
  paddingX,
  paddingY,
  responsiveRole,
  responsiveColor
}: VerseContentProps) => {
  const verseColor = responsiveRole && responsiveColor ? responsiveColor : fontColor

  return (
    <main
      className="flex-1 flex items-start justify-start px-8"
      style={{ overflow: 'overlay' as any }}
    >
      {currentVerse ? (
        <div
          className="w-full"
          style={{
            paddingLeft: paddingX,
            paddingRight: paddingX,
            paddingTop: paddingY,
            paddingBottom: paddingY
          }}
        >
          <p
            className="leading-relaxed"
            style={{ fontSize: `${fontSize}px`, fontFamily, color: verseColor }}
          >
            <span className="mr-3 opacity-50">
              [{currentVerse.chapter}:{currentVerse.verse}]
            </span>
            {parseVerseText(currentVerse.text)}
          </p>
        </div>
      ) : (
        <div className="text-slate-400 text-lg italic">성경 구절을 검색하세요</div>
      )}
    </main>
  )
}
