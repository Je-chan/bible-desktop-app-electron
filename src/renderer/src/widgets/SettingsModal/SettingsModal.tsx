import { useEffect } from 'react'
import { X } from 'lucide-react'

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
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">폰트 종류</label>
            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 max-h-48"
            >
              <option value="serif">기본 명조체</option>
              <option value="sans-serif">기본 고딕체</option>
              {systemFonts.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
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
