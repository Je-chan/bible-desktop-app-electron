import { useEffect, useRef } from 'react'
import type { SearchResult } from '../../types/bible'
import type { ResponsiveReadingRole } from '../../shared/lib'
import { parseVerseText } from '../../shared/lib'
import { useBibleStore } from '../../store/useBibleStore'

interface ChapterVerse {
  verse: number
  text: string
}

interface ChapterContentProps {
  currentVerse: SearchResult | null
  chapterVerses: ChapterVerse[] | null
  fontSize: number
  fontFamily: string
  fontColor: string
  paddingX: number
  paddingY: number
  onVerseClick: (verse: number) => void
  verseRoles?: Map<number, ResponsiveReadingRole>
  responsiveColors?: { leader: string; congregation: string; unison: string }
}

export const ChapterContent = ({
  currentVerse,
  chapterVerses,
  fontSize,
  fontFamily,
  fontColor,
  paddingX,
  paddingY,
  onVerseClick,
  verseRoles,
  responsiveColors
}: ChapterContentProps) => {
  const activeVerseRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 현재 절이 변경되면 해당 절로 스크롤
  useEffect(() => {
    if (activeVerseRef.current && containerRef.current) {
      const behavior = useBibleStore.getState().scrollBehavior
      // chapterVerses 로드 직후에는 레이아웃이 아직 완성되지 않을 수 있으므로 한 프레임 대기
      requestAnimationFrame(() => {
        activeVerseRef.current?.scrollIntoView({ behavior, block: 'center' })
      })
    }
  }, [currentVerse?.verse, chapterVerses])

  return (
    <main
      ref={containerRef}
      className="flex-1 flex items-start justify-start px-8"
      style={{ overflow: 'overlay' as any }}
    >
      {chapterVerses && chapterVerses.length > 0 ? (
        <div
          className="w-full"
          style={{
            paddingLeft: paddingX,
            paddingRight: paddingX,
            paddingTop: paddingY,
            paddingBottom: paddingY
          }}
        >
          <div
            className="flex flex-col gap-4 leading-relaxed"
            style={{ fontSize: `${fontSize}px`, fontFamily, color: fontColor }}
          >
            {chapterVerses.map((v) => {
              const isActive = currentVerse?.verse === v.verse
              const role = verseRoles?.get(v.verse)
              const roleColor = role && responsiveColors ? responsiveColors[role] : undefined
              return (
                <div
                  key={v.verse}
                  ref={isActive ? activeVerseRef : undefined}
                  onClick={() => onVerseClick(v.verse)}
                  className="cursor-pointer"
                  style={{
                    opacity: isActive ? 1 : 0.35,
                    transition: 'opacity 0.3s ease, color 0.3s ease',
                    color: roleColor || undefined
                  }}
                >
                  <span className="mr-3 select-none opacity-50">[{v.verse}]</span>
                  {parseVerseText(v.text)}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-lg italic">장 데이터를 불러오는 중...</div>
      )}
    </main>
  )
}
