import { useEffect, useState, useRef, useMemo } from 'react'
import { X, ChevronDown, Check, Search } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  systemFonts: string[]
  onBackgroundColorChange: (color: string) => void
  onFontFamilyChange: (font: string) => void
  onFontSizeChange: (size: number) => void
  onFontColorChange: (color: string) => void
  onPaddingXChange: (padding: number) => void
  onSave: () => void
  onClose: () => void
}

const BACKGROUND_COLORS = ['#f8fafc', '#fefce8', '#f0fdf4', '#eff6ff', '#fdf4ff', '#1e293b']
const FONT_COLORS = ['#1e293b', '#0f172a', '#374151', '#1f2937', '#7c3aed', '#dc2626']

// 기본 폰트 옵션
const DEFAULT_FONTS = [
  { value: 'serif', label: '기본 명조체' },
  { value: 'sans-serif', label: '기본 고딕체' }
]

export const SettingsModal = ({
  isOpen,
  backgroundColor,
  fontFamily,
  fontSize,
  fontColor,
  paddingX,
  systemFonts,
  onBackgroundColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onFontColorChange,
  onPaddingXChange,
  onSave,
  onClose
}: SettingsModalProps) => {
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [fontSearch, setFontSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const fontDropdownRef = useRef<HTMLDivElement>(null)
  const fontSearchRef = useRef<HTMLInputElement>(null)
  const fontListRef = useRef<HTMLDivElement>(null)

  // 전체 폰트 목록 (기본 폰트 + 시스템 폰트)
  const allFonts = useMemo(() => {
    const systemFontOptions = systemFonts.map((font) => ({ value: font, label: font }))
    return [...DEFAULT_FONTS, ...systemFontOptions]
  }, [systemFonts])

  // 검색 필터링된 폰트 목록
  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return allFonts
    const search = fontSearch.toLowerCase()
    return allFonts.filter((font) => font.label.toLowerCase().includes(search))
  }, [allFonts, fontSearch])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (fontDropdownOpen) {
          setFontDropdownOpen(false)
        } else {
          onClose()
        }
      }
    }

    // capture 단계에서 처리하여 다른 핸들러보다 먼저 실행
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose, fontDropdownOpen])

  // 폰트 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!fontDropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setFontDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [fontDropdownOpen])

  // 드롭다운 열릴 때 검색창 포커스 + 초기화
  useEffect(() => {
    if (fontDropdownOpen) {
      setFontSearch('')
      setHighlightedIndex(0)
      setTimeout(() => fontSearchRef.current?.focus(), 50)
    }
  }, [fontDropdownOpen])

  // 모달 닫힐 때 드롭다운도 닫기
  useEffect(() => {
    if (!isOpen) {
      setFontDropdownOpen(false)
      setFontSearch('')
    }
  }, [isOpen])

  // 하이라이트된 항목이 보이도록 스크롤
  useEffect(() => {
    if (!fontDropdownOpen || !fontListRef.current) return
    const highlighted = fontListRef.current.children[highlightedIndex] as HTMLElement
    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, fontDropdownOpen])

  // 현재 선택된 폰트 이름 표시
  const getSelectedFontName = () => {
    const found = allFonts.find((f) => f.value === fontFamily)
    return found?.label || fontFamily
  }

  const handleFontSelect = (font: string) => {
    onFontFamilyChange(font)
    setFontDropdownOpen(false)
  }

  // 폰트 검색창 키보드 핸들러
  const handleFontSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredFonts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredFonts[highlightedIndex]) {
        handleFontSelect(filteredFonts[highlightedIndex].value)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setFontDropdownOpen(false)
    }
  }

  // 검색어 변경 시 하이라이트 인덱스 초기화
  const handleFontSearchChange = (value: string) => {
    setFontSearch(value)
    setHighlightedIndex(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">환경 설정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 배경 색상 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">배경 색상</label>
            <div className="flex gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onBackgroundColorChange(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    backgroundColor === color ? 'border-blue-500' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 폰트 종류 */}
          <div ref={fontDropdownRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">폰트 종류</label>
            <button
              type="button"
              onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-left flex items-center justify-between"
              style={{ fontFamily }}
            >
              <span className="truncate">{getSelectedFontName()}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {fontDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                {/* 검색 입력창 */}
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      ref={fontSearchRef}
                      type="text"
                      value={fontSearch}
                      onChange={(e) => handleFontSearchChange(e.target.value)}
                      onKeyDown={handleFontSearchKeyDown}
                      placeholder="폰트 검색..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                {/* 폰트 목록 */}
                <div ref={fontListRef} className="max-h-48 overflow-y-auto">
                  {filteredFonts.length > 0 ? (
                    filteredFonts.map((font, index) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => handleFontSelect(font.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                          index === highlightedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                        style={{ fontFamily: font.value }}
                      >
                        <span className="truncate">{font.label}</span>
                        {fontFamily === font.value && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 폰트 색상 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">폰트 색상</label>
            <div className="flex gap-2">
              {FONT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onFontColorChange(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    fontColor === color ? 'border-blue-500' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={fontColor}
                onChange={(e) => onFontColorChange(e.target.value)}
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
              max="150"
              value={fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 좌우 여백 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              좌우 여백: {paddingX}px
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={paddingX}
              onChange={(e) => onPaddingXChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
