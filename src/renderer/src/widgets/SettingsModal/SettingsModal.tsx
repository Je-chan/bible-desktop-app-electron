import { useEffect, useState, useRef, useMemo } from 'react'
import { X, ChevronDown, Check, Search, Minus, Plus } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  paddingY: number
  headerFontSize: number
  systemFonts: string[]
  onBackgroundColorChange: (color: string) => void
  onFontFamilyChange: (font: string) => void
  onFontSizeChange: (size: number) => void
  onFontColorChange: (color: string) => void
  onPaddingXChange: (padding: number) => void
  onPaddingYChange: (padding: number) => void
  onHeaderFontSizeChange: (size: number) => void
  onSave: () => void
  onClose: () => void
}

const BACKGROUND_COLORS = ['#f8fafc', '#fefce8', '#f0fdf4', '#eff6ff', '#fdf4ff', '#1e293b']
const FONT_COLORS = ['#1e293b', '#0f172a', '#374151', '#1f2937', '#7c3aed', '#dc2626']

const DEFAULT_FONTS = [
  { value: 'serif', label: '기본 명조체' },
  { value: 'sans-serif', label: '기본 고딕체' }
]

type TabId = 'font' | 'layout' | 'color'

const TABS: { id: TabId; label: string }[] = [
  { id: 'font', label: '글꼴' },
  { id: 'layout', label: '레이아웃' },
  { id: 'color', label: '색상' }
]

// Stepper 컴포넌트 - input[range] 대체
const NumberStepper = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  const directionRef = useRef<1 | -1>(1)

  // value가 변경될 때 ref 업데이트
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const clamp = (v: number): number => Math.min(max, Math.max(min, v))

  const startHold = (direction: 1 | -1): void => {
    directionRef.current = direction
    // 첫 번째 변경은 즉시
    onChange(clamp(value + step * direction))

    // 400ms 후 연속 변경 시작
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const next = clamp(valueRef.current + step * directionRef.current)
        onChange(next)
      }, 80)
    }, 400)
  }

  const stopHold = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => stopHold()
  }, [])

  const handleStartEdit = () => {
    setEditValue(value.toString())
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleEditConfirm = () => {
    const parsed = parseInt(editValue)
    if (!isNaN(parsed)) {
      onChange(clamp(parsed))
    }
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditConfirm()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-1">
        <button
          onMouseDown={() => startHold(-1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-slate-600" />
        </button>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleEditKeyDown}
            className="w-16 h-8 text-center text-sm font-mono border border-blue-400 rounded-lg outline-none"
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="w-16 h-8 text-center text-sm font-mono text-slate-700 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-text"
          >
            {value}
            <span className="text-xs text-slate-400 ml-0.5">{unit}</span>
          </button>
        )}
        <button
          onMouseDown={() => startHold(1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>
    </div>
  )
}

// 색상 선택 컴포넌트
const ColorPicker = ({
  label,
  value,
  presets,
  onChange
}: {
  label: string
  value: string
  presets: string[]
  onChange: (color: string) => void
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-3">{label}</label>
    <div className="flex items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            value === color ? 'border-blue-500 scale-110' : 'border-slate-200 hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <div className="relative ml-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
        />
        <div
          className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400 transition-colors"
          style={{
            background: `conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>
      </div>
    </div>
  </div>
)

export const SettingsModal = ({
  isOpen,
  backgroundColor,
  fontFamily,
  fontSize,
  fontColor,
  paddingX,
  paddingY,
  headerFontSize,
  systemFonts,
  onBackgroundColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onFontColorChange,
  onPaddingXChange,
  onPaddingYChange,
  onHeaderFontSizeChange,
  onSave,
  onClose
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('font')
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [fontSearch, setFontSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const fontDropdownRef = useRef<HTMLDivElement>(null)
  const fontSearchRef = useRef<HTMLInputElement>(null)
  const fontListRef = useRef<HTMLDivElement>(null)

  const allFonts = useMemo(() => {
    const systemFontOptions = systemFonts.map((font) => ({ value: font, label: font }))
    return [...DEFAULT_FONTS, ...systemFontOptions]
  }, [systemFonts])

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

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose, fontDropdownOpen])

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

  useEffect(() => {
    if (fontDropdownOpen) {
      setFontSearch('')
      setHighlightedIndex(0)
      setTimeout(() => fontSearchRef.current?.focus(), 50)
    }
  }, [fontDropdownOpen])

  useEffect(() => {
    if (!isOpen) {
      setFontDropdownOpen(false)
      setFontSearch('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!fontDropdownOpen || !fontListRef.current) return
    const highlighted = fontListRef.current.children[highlightedIndex] as HTMLElement
    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, fontDropdownOpen])

  const getSelectedFontName = () => {
    const found = allFonts.find((f) => f.value === fontFamily)
    return found?.label || fontFamily
  }

  const handleFontSelect = (font: string) => {
    onFontFamilyChange(font)
    setFontDropdownOpen(false)
  }

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

  const handleFontSearchChange = (value: string) => {
    setFontSearch(value)
    setHighlightedIndex(0)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-lg font-semibold text-slate-800">환경 설정</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex px-6 mt-4 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-6 py-5 min-h-[240px]">
          {/* 글꼴 탭 */}
          {activeTab === 'font' && (
            <div className="space-y-5">
              {/* 폰트 종류 */}
              <div ref={fontDropdownRef} className="relative">
                <label className="block text-sm font-medium text-slate-600 mb-2">폰트 종류</label>
                <button
                  type="button"
                  onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-left flex items-center justify-between hover:border-slate-300 transition-colors"
                  style={{ fontFamily }}
                >
                  <span className="truncate">{getSelectedFontName()}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {fontDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
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
                            {fontFamily === font.value && (
                              <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
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

              <div className="h-px bg-slate-100" />

              <NumberStepper
                label="본문 폰트 크기"
                value={fontSize}
                min={16}
                max={150}
                step={1}
                onChange={onFontSizeChange}
              />

              <NumberStepper
                label="헤더 폰트 크기"
                value={headerFontSize}
                min={12}
                max={32}
                step={1}
                onChange={onHeaderFontSizeChange}
              />
            </div>
          )}

          {/* 레이아웃 탭 */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              <NumberStepper
                label="좌우 여백"
                value={paddingX}
                min={0}
                max={200}
                step={4}
                onChange={onPaddingXChange}
              />

              <div className="h-px bg-slate-100" />

              <NumberStepper
                label="상하 여백"
                value={paddingY}
                min={0}
                max={200}
                step={4}
                onChange={onPaddingYChange}
              />

              {/* 미리보기 */}
              <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-400 mb-2">미리보기</p>
                <div
                  className="bg-white rounded border border-slate-200 overflow-hidden"
                  style={{ height: 80 }}
                >
                  <div
                    className="h-full flex items-center justify-center text-xs text-slate-500"
                    style={{
                      paddingLeft: Math.min(paddingX * 0.3, 60),
                      paddingRight: Math.min(paddingX * 0.3, 60),
                      paddingTop: Math.min(paddingY * 0.3, 30),
                      paddingBottom: Math.min(paddingY * 0.3, 30)
                    }}
                  >
                    <div className="w-full h-full bg-blue-50 border border-blue-200 border-dashed rounded flex items-center justify-center">
                      본문 영역
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 색상 탭 */}
          {activeTab === 'color' && (
            <div className="space-y-6">
              <ColorPicker
                label="배경 색상"
                value={backgroundColor}
                presets={BACKGROUND_COLORS}
                onChange={onBackgroundColorChange}
              />

              <div className="h-px bg-slate-100" />

              <ColorPicker
                label="폰트 색상"
                value={fontColor}
                presets={FONT_COLORS}
                onChange={onFontColorChange}
              />

              {/* 색상 미리보기 */}
              <div className="p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-2">미리보기</p>
                <div className="px-4 py-3 rounded-lg" style={{ backgroundColor }}>
                  <p style={{ color: fontColor, fontSize: '14px', fontFamily }}>
                    태초에 하나님이 천지를 창조하시니라
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
