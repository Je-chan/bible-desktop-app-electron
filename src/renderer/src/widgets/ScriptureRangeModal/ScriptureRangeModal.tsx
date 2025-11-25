import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { BIBLE_BOOKS } from '../../shared/config'
import type { ScriptureRange } from '../../types/bible'

interface ScriptureRangeModalProps {
  isOpen: boolean
  todayScriptureRange: ScriptureRange | null
  onSave: (range: ScriptureRange | null) => void
  onClose: () => void
}

export const ScriptureRangeModal = ({
  isOpen,
  todayScriptureRange,
  onSave,
  onClose
}: ScriptureRangeModalProps) => {
  const [rangeEnabled, setRangeEnabled] = useState(!!todayScriptureRange)
  const [startBookAbbr, setStartBookAbbr] = useState(todayScriptureRange?.start.bookAbbr || '')
  const [startChapter, setStartChapter] = useState(todayScriptureRange?.start.chapter.toString() || '')
  const [startVerse, setStartVerse] = useState(todayScriptureRange?.start.verse.toString() || '')
  const [endBookAbbr, setEndBookAbbr] = useState(todayScriptureRange?.end.bookAbbr || '')
  const [endChapter, setEndChapter] = useState(todayScriptureRange?.end.chapter.toString() || '')
  const [endVerse, setEndVerse] = useState(todayScriptureRange?.end.verse.toString() || '')

  const startBookRef = useRef<HTMLInputElement>(null)
  const startChapterRef = useRef<HTMLInputElement>(null)
  const startVerseRef = useRef<HTMLInputElement>(null)
  const endBookRef = useRef<HTMLInputElement>(null)
  const endChapterRef = useRef<HTMLInputElement>(null)
  const endVerseRef = useRef<HTMLInputElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // 시작 범위가 완전히 설정되었는지 확인
  const isStartComplete = () => {
    const book = BIBLE_BOOKS.find((b) => b.abbr === startBookAbbr)
    return book && startChapter && startVerse && parseInt(startChapter) > 0 && parseInt(startVerse) > 0
  }

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setRangeEnabled(!!todayScriptureRange)
      setStartBookAbbr(todayScriptureRange?.start.bookAbbr || '')
      setStartChapter(todayScriptureRange?.start.chapter.toString() || '')
      setStartVerse(todayScriptureRange?.start.verse.toString() || '')
      setEndBookAbbr(todayScriptureRange?.end.bookAbbr || '')
      setEndChapter(todayScriptureRange?.end.chapter.toString() || '')
      setEndVerse(todayScriptureRange?.end.verse.toString() || '')

      // 체크박스로 포커스
      setTimeout(() => {
        if (rangeEnabled) {
          startBookRef.current?.focus()
        }
      }, 100)
    }
  }, [isOpen, todayScriptureRange])

  // 시작 범위가 변경되면 끝 범위를 시작 범위로 동기화
  useEffect(() => {
    if (isStartComplete()) {
      setEndBookAbbr(startBookAbbr)
      setEndChapter(startChapter)
      setEndVerse(startVerse)
    }
  }, [startBookAbbr, startChapter, startVerse])

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

  const handleSave = () => {
    if (!rangeEnabled) {
      onSave(null)
      onClose()
      return
    }

    const startBook = BIBLE_BOOKS.find((b) => b.abbr === startBookAbbr)
    const endBook = BIBLE_BOOKS.find((b) => b.abbr === endBookAbbr)

    if (startBook && endBook && startChapter && startVerse && endChapter && endVerse) {
      onSave({
        start: {
          bookId: startBook.id,
          bookAbbr: startBook.abbr,
          chapter: parseInt(startChapter),
          verse: parseInt(startVerse)
        },
        end: {
          bookId: endBook.id,
          bookAbbr: endBook.abbr,
          chapter: parseInt(endChapter),
          verse: parseInt(endVerse)
        }
      })
    }
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement | HTMLButtonElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        handleSave()
      }
    }
  }

  const handleCheckboxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setRangeEnabled(!rangeEnabled)
    }
  }

  if (!isOpen) return null

  const endDisabled = !isStartComplete()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">본문 말씀 범위</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rangeEnabled"
              checked={rangeEnabled}
              onChange={(e) => setRangeEnabled(e.target.checked)}
              onKeyDown={handleCheckboxKeyDown}
              className="w-4 h-4"
            />
            <label htmlFor="rangeEnabled" className="text-sm font-medium text-slate-700">
              본문 말씀 범위 사용
            </label>
          </div>

          {rangeEnabled && (
            <div className="space-y-4">
              {/* 시작 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">시작</label>
                <div className="flex gap-2">
                  <input
                    ref={startBookRef}
                    type="text"
                    list="bible-books-start"
                    value={startBookAbbr}
                    onChange={(e) => setStartBookAbbr(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, startChapterRef)}
                    placeholder="책"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="bible-books-start">
                    {BIBLE_BOOKS.map((book) => (
                      <option key={book.id} value={book.abbr} />
                    ))}
                  </datalist>
                  <input
                    ref={startChapterRef}
                    type="number"
                    min="1"
                    value={startChapter}
                    onChange={(e) => setStartChapter(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, startVerseRef)}
                    placeholder="장"
                    className="w-16 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <input
                    ref={startVerseRef}
                    type="number"
                    min="1"
                    value={startVerse}
                    onChange={(e) => setStartVerse(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, endDisabled ? saveButtonRef : endBookRef)}
                    placeholder="절"
                    className="w-16 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* 끝 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${endDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                  끝
                </label>
                <div className="flex gap-2">
                  <input
                    ref={endBookRef}
                    type="text"
                    list="bible-books-end"
                    value={endBookAbbr}
                    onChange={(e) => setEndBookAbbr(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, endChapterRef)}
                    placeholder="책"
                    disabled={endDisabled}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none ${
                      endDisabled
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <datalist id="bible-books-end">
                    {BIBLE_BOOKS.map((book) => (
                      <option key={book.id} value={book.abbr} />
                    ))}
                  </datalist>
                  <input
                    ref={endChapterRef}
                    type="number"
                    min="1"
                    value={endChapter}
                    onChange={(e) => setEndChapter(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, endVerseRef)}
                    placeholder="장"
                    disabled={endDisabled}
                    className={`w-16 px-3 py-2 text-sm border rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      endDisabled
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <input
                    ref={endVerseRef}
                    type="number"
                    min="1"
                    value={endVerse}
                    onChange={(e) => setEndVerse(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, saveButtonRef)}
                    placeholder="절"
                    disabled={endDisabled}
                    className={`w-16 px-3 py-2 text-sm border rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      endDisabled
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            취소
          </button>
          <button
            ref={saveButtonRef}
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
