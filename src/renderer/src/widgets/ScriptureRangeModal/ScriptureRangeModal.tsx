import { useEffect, useState, useRef } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { BIBLE_BOOKS } from '../../shared/config'
import type { ScriptureRange } from '../../types/bible'
import { scriptureRangeSchema, validateVerseMax } from '../../lib/validation'
import { useBibleStore } from '../../store/useBibleStore'

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

  const { currentVersion } = useBibleStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 시작 범위가 완전히 설정되었는지 확인
  const isStartComplete = () => {
    const book = BIBLE_BOOKS.find((b) => b.abbr === startBookAbbr)
    return book && startChapter && startVerse && parseInt(startChapter) > 0 && parseInt(startVerse) > 0
  }

  // 모달이 열릴 때 저장된 값으로 초기화
  useEffect(() => {
    if (isOpen) {
      // 저장된 todayScriptureRange 값으로 복원
      setRangeEnabled(!!todayScriptureRange)
      setStartBookAbbr(todayScriptureRange?.start.bookAbbr || '')
      setStartChapter(todayScriptureRange?.start.chapter.toString() || '')
      setStartVerse(todayScriptureRange?.start.verse.toString() || '')
      setEndBookAbbr(todayScriptureRange?.end.bookAbbr || '')
      setEndChapter(todayScriptureRange?.end.chapter.toString() || '')
      setEndVerse(todayScriptureRange?.end.verse.toString() || '')

      // 에러 초기화
      setErrors({})

      // 포커스
      setTimeout(() => {
        if (todayScriptureRange) {
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
        e.stopPropagation()
        handleClose()
      }
    }

    // capture 단계에서 처리하여 다른 핸들러보다 먼저 실행
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen])

  const handleSave = async () => {
    if (!rangeEnabled) {
      onSave(null)
      onClose()
      return
    }

    setErrors({})

    const startBook = BIBLE_BOOKS.find((b) => b.abbr === startBookAbbr)
    const endBook = BIBLE_BOOKS.find((b) => b.abbr === endBookAbbr)

    if (!startBook || !endBook || !startChapter || !startVerse || !endChapter || !endVerse) {
      setErrors({ general: '모든 필드를 입력해주세요' })
      return
    }

    const rangeData = {
      start: {
        bookAbbr: startBook.abbr,
        chapter: parseInt(startChapter),
        verse: parseInt(startVerse)
      },
      end: {
        bookAbbr: endBook.abbr,
        chapter: parseInt(endChapter),
        verse: parseInt(endVerse)
      }
    }

    // Zod 스키마 검증
    const result = scriptureRangeSchema.safeParse(rangeData)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        newErrors[path] = issue.message
      })
      setErrors(newErrors)
      return
    }

    // 절의 최대값 검증 (비동기)
    const startVerseCheck = await validateVerseMax(
      startBook.abbr,
      parseInt(startChapter),
      parseInt(startVerse),
      currentVersion
    )
    if (!startVerseCheck.valid) {
      setErrors({
        'start.verse': `${startBook.name} ${parseInt(startChapter)}장은 ${startVerseCheck.maxVerse || 1}절까지만 있습니다.`
      })
      return
    }

    const endVerseCheck = await validateVerseMax(
      endBook.abbr,
      parseInt(endChapter),
      parseInt(endVerse),
      currentVersion
    )
    if (!endVerseCheck.valid) {
      setErrors({
        'end.verse': `${endBook.name} ${parseInt(endChapter)}장은 ${endVerseCheck.maxVerse || 1}절까지만 있습니다.`
      })
      return
    }

    // 검증 통과 - 저장
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

  const handleClose = () => {
    // 저장하지 않고 닫을 때는 상태 초기화 (다음에 열릴 때 useEffect에서 복원됨)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  const endDisabled = !isStartComplete()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">본문 말씀 범위</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{errors.general}</span>
            </div>
          )}

          {errors.end && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{errors.end}</span>
            </div>
          )}

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
                {(errors['start.chapter'] || errors['start.verse']) && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors['start.chapter'] || errors['start.verse']}</span>
                  </div>
                )}
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
                {(errors['end.chapter'] || errors['end.verse']) && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors['end.chapter'] || errors['end.verse']}</span>
                  </div>
                )}
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
            onClick={handleClose}
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
