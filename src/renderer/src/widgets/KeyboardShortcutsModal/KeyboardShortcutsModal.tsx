import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { VERSION_MAP } from '../../shared/config'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

// VERSION_MAP의 모든 역본을 단축키 목록으로 변환
const versionShortcuts = Object.entries(VERSION_MAP).map(([key, version]) => ({
  key: `Alt + ${key.toUpperCase()}`,
  description: version
}))

const shortcuts = [
  {
    category: '역본 변경',
    items: versionShortcuts
  },
  {
    category: '화면 조절',
    items: [
      { key: '↑', description: '글자 크기 증가' },
      { key: '↓', description: '글자 크기 감소' }
    ]
  },
  {
    category: '말씀 탐색',
    items: [
      { key: '→', description: '다음 절' },
      { key: '←', description: '이전 절' },
      { key: 'Tab', description: '필드 이동' },
      { key: 'Enter', description: '검색 실행' }
    ]
  },
  {
    category: '본문 말씀',
    items: [
      { key: 'Cmd/Ctrl + Shift + C', description: '본문 말씀으로 돌아가기' }
    ]
  }
]

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
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
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[600px] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">단축키</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded hover:bg-slate-50">
                    <span className="text-sm text-slate-600">{item.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            입력 필드에 포커스가 있을 때는 일부 단축키가 작동하지 않습니다
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
