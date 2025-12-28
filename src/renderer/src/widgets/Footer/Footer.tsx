import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Settings, BookOpen, Info } from 'lucide-react'
import { VERSION_MAP } from '../../shared/config'

// 버전 단축키 목록 (버전명 기준 정렬)
const VERSION_SHORTCUTS = Object.entries(VERSION_MAP)
  .map(([key, name]) => ({ key: key.toUpperCase(), name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

type FieldType = 'book' | 'chapter' | 'verse'

interface FooterProps {
  book: string
  chapter: string
  verse: string
  backgroundColor: string
  fontColor: string
  masterInputRef: React.RefObject<HTMLInputElement | null>
  onBookChange: (value: string) => void
  onChapterChange: (value: string) => void
  onVerseChange: (value: string) => void
  onSearch: () => Promise<void>
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
  masterInputRef,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onSearch,
  onSettingsClick,
  onScriptureRangeClick,
  onKeyboardShortcutsClick,
  currentScripture
}: FooterProps) => {
  const [activeField, setActiveField] = useState<FieldType>('book')

  // 각 필드 위치를 추적하기 위한 refs
  const bookDivRef = useRef<HTMLDivElement>(null)
  const chapterDivRef = useRef<HTMLDivElement>(null)
  const verseDivRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 리렌더링 트리거를 위한 state (리사이즈, 초기 마운트)
  const [renderTrigger, setRenderTrigger] = useState(0)

  // 현재 활성화된 필드의 값
  const currentValue = activeField === 'book' ? book : activeField === 'chapter' ? chapter : verse

  // 위치 계산 - 동기적으로 수행 (useMemo 사용)
  const inputStyle = useMemo((): React.CSSProperties => {
    let targetRef: React.RefObject<HTMLDivElement | null>
    switch (activeField) {
      case 'book':
        targetRef = bookDivRef
        break
      case 'chapter':
        targetRef = chapterDivRef
        break
      case 'verse':
        targetRef = verseDivRef
        break
    }

    if (!targetRef.current || !containerRef.current) {
      return { position: 'absolute', opacity: 0 }
    }

    const targetRect = targetRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    return {
      position: 'absolute',
      left: targetRect.left - containerRect.left,
      top: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height,
      backgroundColor,
      color: fontColor,
      borderColor: fontColor + '40'
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeField, backgroundColor, fontColor, renderTrigger])

  // 초기 마운트 후 위치 계산을 위한 리렌더링
  useEffect(() => {
    setRenderTrigger(1)
  }, [])

  // 윈도우 리사이즈 시 리렌더링 트리거
  useEffect(() => {
    const handleResize = () => setRenderTrigger((prev) => prev + 1)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 값 변경 핸들러
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value

      switch (activeField) {
        case 'book':
          onBookChange(val)
          break
        case 'chapter':
          // 숫자만 허용
          if (val === '' || /^\d+$/.test(val)) {
            onChapterChange(val)
          }
          break
        case 'verse':
          // 숫자만 허용
          if (val === '' || /^\d+$/.test(val)) {
            onVerseChange(val)
          }
          break
      }
    },
    [activeField, onBookChange, onChapterChange, onVerseChange]
  )

  // 키보드 핸들러
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault() // 기본 Tab 동작 막기 (Blur 방지!)

        if (e.shiftKey) {
          // Shift+Tab: 역순
          setActiveField((prev) => {
            switch (prev) {
              case 'book':
                return 'verse'
              case 'chapter':
                return 'book'
              case 'verse':
                return 'chapter'
            }
          })
        } else {
          // Tab: 순방향
          if (activeField === 'verse') {
            // 절에서 Tab: 검색 실행 후 책으로 이동
            if (book && chapter && verse) {
              await onSearch()
            }
            setActiveField('book')
          } else {
            setActiveField((prev) => (prev === 'book' ? 'chapter' : 'verse'))
          }
        }

        // 필드 변경 후 전체 선택
        setTimeout(() => masterInputRef.current?.select(), 0)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        await onSearch()
        setActiveField('book')
        setTimeout(() => masterInputRef.current?.select(), 0)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        masterInputRef.current?.blur()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // 방향키로 필드 이동
        const input = e.target as HTMLInputElement
        const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0
        const isAtEnd =
          input.selectionStart === input.value.length && input.selectionEnd === input.value.length

        if (e.key === 'ArrowLeft' && isAtStart) {
          e.preventDefault()
          setActiveField((prev) => {
            switch (prev) {
              case 'book':
                return 'verse'
              case 'chapter':
                return 'book'
              case 'verse':
                return 'chapter'
            }
          })
          setTimeout(() => {
            masterInputRef.current?.setSelectionRange(
              masterInputRef.current.value.length,
              masterInputRef.current.value.length
            )
          }, 0)
        } else if (e.key === 'ArrowRight' && isAtEnd) {
          e.preventDefault()
          setActiveField((prev) => (prev === 'book' ? 'chapter' : prev === 'chapter' ? 'verse' : 'book'))
          setTimeout(() => {
            masterInputRef.current?.setSelectionRange(0, 0)
          }, 0)
        }
      }
    },
    [activeField, book, chapter, verse, onSearch, masterInputRef]
  )

  // 필드 클릭 핸들러
  const handleFieldClick = useCallback(
    (field: FieldType) => {
      setActiveField(field)
      masterInputRef.current?.focus()
      setTimeout(() => masterInputRef.current?.select(), 0)
    },
    [masterInputRef]
  )

  // 공통 필드 스타일
  const getFieldStyle = (field: FieldType): React.CSSProperties => ({
    backgroundColor: 'transparent',
    color: fontColor,
    borderColor: activeField === field ? fontColor + '40' : 'transparent',
    opacity: activeField === field ? 0 : 0.7, // 활성화된 필드는 input이 덮으므로 숨김
    visibility: activeField === field ? 'hidden' : 'visible'
  })

  return (
    <footer
      className="h-10 border-t flex items-center justify-between px-6"
      style={{ backgroundColor, borderColor: backgroundColor }}
    >
      <div ref={containerRef} className="relative flex items-center gap-3 text-sm" style={{ color: fontColor }}>
        {/* 마스터 Input - 단 하나만 존재, 위치만 변경 */}
        <input
          ref={masterInputRef}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 rounded text-sm focus:outline-none border z-10"
          style={inputStyle}
          aria-label={activeField === 'book' ? '성경 책 이름' : activeField === 'chapter' ? '장' : '절'}
          data-allow-arrow-navigation="true"
        />

        {/* 책 필드 (플레이스홀더) */}
        <div className="flex items-center gap-1">
          <label className="text-xs opacity-70">책</label>
          <div
            ref={bookDivRef}
            onClick={() => handleFieldClick('book')}
            className="w-16 px-2 py-1 rounded text-sm border cursor-pointer"
            style={getFieldStyle('book')}
          >
            {book || '\u00A0'}
          </div>
        </div>

        {/* 장 필드 (플레이스홀더) */}
        <div className="flex items-center gap-1">
          <label className="text-xs opacity-70">장</label>
          <div
            ref={chapterDivRef}
            onClick={() => handleFieldClick('chapter')}
            className="w-16 px-2 py-1 rounded text-sm border cursor-pointer"
            style={getFieldStyle('chapter')}
          >
            {chapter || '\u00A0'}
          </div>
        </div>

        {/* 절 필드 (플레이스홀더) */}
        <div className="flex items-center gap-1">
          <label className="text-xs opacity-70">절</label>
          <div
            ref={verseDivRef}
            onClick={() => handleFieldClick('verse')}
            className="w-16 px-2 py-1 rounded text-sm border cursor-pointer"
            style={getFieldStyle('verse')}
          >
            {verse || '\u00A0'}
          </div>
        </div>
      </div>

      {/* 버전 단축키 표시 */}
      <div className="flex-1 flex items-center justify-center gap-2 text-xs overflow-hidden mx-4" style={{ color: fontColor, opacity: 0.5 }}>
        {VERSION_SHORTCUTS.map(({ key, name }) => (
          <span key={key} className="whitespace-nowrap">
            {name}({key})
          </span>
        ))}
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
