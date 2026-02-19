import { useEffect, useRef, useCallback } from 'react'
import type { SearchResult } from '../../types/bible'
import { parseVerseText } from '../../shared/lib'

interface ChapterVerse {
  verse: number
  text: string
}

interface FocusContentProps {
  currentVerse: SearchResult | null
  chapterVerses: ChapterVerse[] | null
  fontSize: number
  fontFamily: string
  fontColor: string
  paddingX: number
  paddingY: number
  onVerseClick: (verse: number) => void
}

export const FocusContent = ({
  currentVerse,
  chapterVerses,
  fontSize,
  fontFamily,
  fontColor,
  paddingX,
  onVerseClick
}: FocusContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentIndex = chapterVerses?.findIndex((v) => v.verse === currentVerse?.verse) ?? -1

  const prev = currentIndex > 0 ? chapterVerses![currentIndex - 1] : null
  const curr = currentIndex >= 0 ? chapterVerses![currentIndex] : null
  const next =
    chapterVerses && currentIndex < chapterVerses.length - 1
      ? chapterVerses[currentIndex + 1]
      : null

  // 스와이프/휠로 절 이동
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!chapterVerses || currentIndex < 0) return
      if (Math.abs(e.deltaY) < 30) return
      if (e.deltaY > 0 && next) {
        onVerseClick(next.verse)
      } else if (e.deltaY < 0 && prev) {
        onVerseClick(prev.verse)
      }
    },
    [chapterVerses, currentIndex, prev, next, onVerseClick]
  )

  // 쓰로틀링으로 휠 이벤트 제어
  const throttleRef = useRef(false)
  const handleThrottledWheel = useCallback(
    (e: React.WheelEvent) => {
      if (throttleRef.current) return
      throttleRef.current = true
      handleWheel(e)
      setTimeout(() => {
        throttleRef.current = false
      }, 300)
    },
    [handleWheel]
  )

  // 컨테이너 포커스 (키보드 이벤트용)
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const peekStyle = {
    fontSize: `${fontSize * 0.85}px`,
    fontFamily,
    color: fontColor,
    opacity: 0.15,
    filter: 'blur(2px)',
    transition: 'all 0.4s ease',
    willChange: 'opacity, filter'
  }

  return (
    <main
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center outline-none"
      style={{ overflow: 'hidden' }}
      onWheel={handleThrottledWheel}
      tabIndex={-1}
    >
      {chapterVerses && curr ? (
        <div
          className="flex flex-col justify-center w-full h-full"
          style={{ paddingLeft: paddingX + 32, paddingRight: paddingX + 32 }}
        >
          {/* 이전 절 (peek) */}
          <div
            className="cursor-pointer select-none leading-relaxed"
            style={{ ...peekStyle, minHeight: '1.5em', marginBottom: '2rem' }}
            onClick={() => prev && onVerseClick(prev.verse)}
          >
            {prev && (
              <>
                <span className="mr-2 opacity-50">[{prev.verse}]</span>
                {parseVerseText(prev.text)}
              </>
            )}
          </div>

          {/* 현재 절 (메인) */}
          <div
            className="leading-relaxed"
            style={{
              fontSize: `${fontSize * 1.1}px`,
              fontFamily,
              color: fontColor,
              transition: 'all 0.4s ease'
            }}
          >
            <span className="mr-3 select-none opacity-40">[{curr.verse}]</span>
            {parseVerseText(curr.text)}
          </div>

          {/* 다음 절 (peek) */}
          <div
            className="cursor-pointer select-none leading-relaxed"
            style={{ ...peekStyle, minHeight: '1.5em', marginTop: '2rem' }}
            onClick={() => next && onVerseClick(next.verse)}
          >
            {next && (
              <>
                <span className="mr-2 opacity-50">[{next.verse}]</span>
                {parseVerseText(next.text)}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-lg italic">장 데이터를 불러오는 중...</div>
      )}
    </main>
  )
}
