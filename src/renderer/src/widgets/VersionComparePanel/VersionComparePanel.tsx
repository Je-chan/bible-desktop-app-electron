import type { SearchResult } from '../../types/bible'
import { parseVerseText } from '../../shared/lib'

interface VersionComparePanelProps {
  isOpen: boolean
  comparedVersion: string
  comparedVerse: SearchResult | null
  fontSize: number
  fontFamily: string
  fontColor: string
  paddingX: number
}

export const VersionComparePanel = ({
  isOpen,
  comparedVersion,
  comparedVerse,
  fontSize,
  fontFamily,
  fontColor,
  paddingX
}: VersionComparePanelProps) => {
  if (!isOpen) return null

  return (
    <div className="flex-1 flex flex-col border-l border-slate-300">
      <main className="flex-1 flex items-start justify-start p-8 overflow-auto">
        {comparedVerse ? (
          <div className="w-full" style={{ paddingLeft: paddingX, paddingRight: paddingX }}>
            <p
              className="leading-relaxed"
              style={{ fontSize: `${fontSize}px`, fontFamily, color: fontColor }}
            >
              <span className="mr-3 opacity-50">[{comparedVersion}]</span>
              {parseVerseText(comparedVerse.text)}
            </p>
          </div>
        ) : (
          <div className="text-slate-400 text-lg italic">
            구절을 불러오는 중...
          </div>
        )}
      </main>
    </div>
  )
}
