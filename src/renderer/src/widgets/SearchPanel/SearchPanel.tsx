import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { BIBLE_BOOKS } from '../../shared/config'
import { VERSION_MAP } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

const ALL_VERSIONS = Object.values(VERSION_MAP)

// 각 키워드별 하이라이트 색상 (input 배경 + 결과 하이라이트용)
const HIGHLIGHT_COLORS = [
  { inputBg: 'bg-amber-50 focus:bg-amber-100', bg: 'bg-amber-200', text: 'text-amber-900' },
  { inputBg: 'bg-emerald-50 focus:bg-emerald-100', bg: 'bg-emerald-200', text: 'text-emerald-900' },
  { inputBg: 'bg-sky-50 focus:bg-sky-100', bg: 'bg-sky-200', text: 'text-sky-900' }
]

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectVerse: (bookAbbr: string, bookId: number, chapter: number, verse: number) => void
}

interface SearchResultItem {
  book: number
  chapter: number
  verse: number
  text: string
}

const PAGE_SIZE = 100

// abbr로 책 찾기
const findBookByAbbr = (abbr: string) => BIBLE_BOOKS.find((b) => b.abbr === abbr)

export const SearchPanel = ({ isOpen, onClose, onSelectVerse }: SearchPanelProps) => {
  const { currentVersion } = useBibleStore()

  // 검색 조건 - 3개의 키워드
  const [keyword1, setKeyword1] = useState('')
  const [keyword2, setKeyword2] = useState('')
  const [keyword3, setKeyword3] = useState('')
  const [selectedVersion, setSelectedVersion] = useState(currentVersion)
  // 시작/끝 책 (abbr 문자열로 관리)
  const [startBookAbbr, setStartBookAbbr] = useState('')
  const [endBookAbbr, setEndBookAbbr] = useState('')

  // 검색 결과
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [offset, setOffset] = useState(0)
  // 검색에 사용된 키워드 저장 (하이라이트용)
  const [searchedKeywords, setSearchedKeywords] = useState<string[]>([])

  const keyword1Ref = useRef<HTMLInputElement>(null)
  const startBookRef = useRef<HTMLInputElement>(null)
  const endBookRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 유효한 키워드 배열 (빈 문자열 제외)
  const validKeywords = useMemo(
    () => [keyword1, keyword2, keyword3].filter((k) => k.trim() !== ''),
    [keyword1, keyword2, keyword3]
  )

  // 검색 버튼 활성화 여부
  const isSearchDisabled = validKeywords.length === 0 || isLoading

  // 패널 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => keyword1Ref.current?.focus(), 100)
      setSelectedVersion(currentVersion)
    }
  }, [isOpen, currentVersion])

  // ESC 처리: Input focused면 blur, 아니면 패널 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement

        // 패널 내부의 input/select에 focus가 있으면 blur만 수행
        if (
          activeElement &&
          panelRef.current?.contains(activeElement) &&
          (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')
        ) {
          activeElement.blur()
          e.stopPropagation()
          return
        }

        // focus가 없으면 패널 닫기
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 검색 실행
  const handleSearch = useCallback(async () => {
    if (validKeywords.length === 0) return

    // 시작/끝 book abbr 유효성 검사
    const startAbbr = startBookAbbr.trim()
    const endAbbr = endBookAbbr.trim()

    // 시작 book 검증 (비어있으면 기본값 사용)
    let startBookId = 1 // 창세기
    if (startAbbr !== '') {
      const startBook = findBookByAbbr(startAbbr)
      if (!startBook) {
        setStartBookAbbr('')
        startBookRef.current?.focus()
        return
      }
      startBookId = startBook.id
    }

    // 끝 book 검증 (비어있으면 기본값 사용)
    let endBookId = 66 // 요한계시록
    if (endAbbr !== '') {
      const endBook = findBookByAbbr(endAbbr)
      if (!endBook) {
        setEndBookAbbr('')
        endBookRef.current?.focus()
        return
      }
      endBookId = endBook.id
    }

    setIsLoading(true)
    setHasSearched(true)
    setOffset(0)
    setResults([])
    // 검색에 사용된 키워드 저장 (원본 순서 유지, 빈 문자열도 포함하여 색상 인덱스 유지)
    setSearchedKeywords([keyword1.trim(), keyword2.trim(), keyword3.trim()])

    try {
      const [searchResults, count] = await Promise.all([
        window.bibleApi.search(selectedVersion, validKeywords, startBookId, endBookId, PAGE_SIZE, 0),
        window.bibleApi.searchCount(selectedVersion, validKeywords, startBookId, endBookId)
      ])
      setResults(searchResults)
      setTotalCount(count)
      setOffset(PAGE_SIZE)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [validKeywords, keyword1, keyword2, keyword3, selectedVersion, startBookAbbr, endBookAbbr])

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (isLoadingMore || results.length >= totalCount) return

    setIsLoadingMore(true)

    // 검색에 사용된 유효 키워드만 필터링
    const validSearchedKeywords = searchedKeywords.filter((k) => k !== '')

    // 시작/끝 bookId 계산 (빈 문자열이면 기본값)
    const startBook = startBookAbbr.trim() ? findBookByAbbr(startBookAbbr.trim()) : null
    const endBook = endBookAbbr.trim() ? findBookByAbbr(endBookAbbr.trim()) : null
    const startBookId = startBook?.id ?? 1
    const endBookId = endBook?.id ?? 66

    try {
      const moreResults = await window.bibleApi.search(
        selectedVersion,
        validSearchedKeywords,
        startBookId,
        endBookId,
        PAGE_SIZE,
        offset
      )
      setResults((prev) => [...prev, ...moreResults])
      setOffset((prev) => prev + PAGE_SIZE)
    } catch (error) {
      console.error('Load more failed:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, results.length, totalCount, selectedVersion, searchedKeywords, startBookAbbr, endBookAbbr, offset])

  // 무한 스크롤
  useEffect(() => {
    const container = resultsRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMore()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  // Enter 키로 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 결과 선택
  const handleSelectResult = (result: SearchResultItem) => {
    const book = BIBLE_BOOKS.find((b) => b.id === result.book)
    if (book) {
      onSelectVerse(book.abbr, book.id, result.chapter, result.verse)
    }
  }

  // 책 이름 가져오기
  const getBookName = (bookId: number) => {
    const book = BIBLE_BOOKS.find((b) => b.id === bookId)
    return book?.name || `Book ${bookId}`
  }

  // 다중 키워드 하이라이트 (각 키워드별 다른 색상)
  const highlightText = (text: string, keywords: string[]) => {
    // 유효한 키워드만 필터링하되 인덱스 정보 유지
    const keywordWithIndex = keywords
      .map((k, i) => ({ keyword: k, index: i }))
      .filter((item) => item.keyword !== '')

    if (keywordWithIndex.length === 0) return text

    // 모든 키워드 매치 위치 찾기
    type Match = { start: number; end: number; colorIndex: number; text: string }
    const matches: Match[] = []

    keywordWithIndex.forEach(({ keyword, index }) => {
      const regex = new RegExp(keyword, 'gi')
      let match
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          colorIndex: index,
          text: match[0]
        })
      }
    })

    if (matches.length === 0) return text

    // 위치 순으로 정렬
    matches.sort((a, b) => a.start - b.start)

    // 겹치는 매치 제거 (먼저 나온 것 우선)
    const filteredMatches: Match[] = []
    for (const match of matches) {
      const overlaps = filteredMatches.some(
        (existing) => match.start < existing.end && match.end > existing.start
      )
      if (!overlaps) {
        filteredMatches.push(match)
      }
    }

    // 텍스트 조각 생성
    const result: React.ReactNode[] = []
    let lastEnd = 0

    filteredMatches.forEach((match, idx) => {
      // 매치 이전 텍스트
      if (match.start > lastEnd) {
        result.push(text.slice(lastEnd, match.start))
      }
      // 하이라이트된 텍스트
      const color = HIGHLIGHT_COLORS[match.colorIndex]
      result.push(
        <mark key={idx} className={`${color.bg} ${color.text} rounded px-0.5`}>
          {match.text}
        </mark>
      )
      lastEnd = match.end
    })

    // 마지막 매치 이후 텍스트
    if (lastEnd < text.length) {
      result.push(text.slice(lastEnd))
    }

    return result
  }

  // HTML 태그 제거
  const cleanText = (text: string) =>
    text
      .replace(/<sup>.*?<\/sup>/g, '')
      .replace(/<br\s*\/?>/g, ' ')
      .trim()

  if (!isOpen) return null

  return (
    <div ref={panelRef} className="flex-1 flex flex-col border-l border-slate-300 bg-white max-w-md">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">말씀 검색</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 검색 조건 - 컴팩트 레이아웃 */}
      <div className="px-3 py-3 border-b border-slate-200 space-y-2.5">
        {/* Row 1: 3개 키워드 입력 */}
        <div className="flex gap-2">
          <input
            ref={keyword1Ref}
            type="text"
            value={keyword1}
            onChange={(e) => setKeyword1(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드 1"
            className={`flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md outline-none transition-colors ${HIGHLIGHT_COLORS[0].inputBg}`}
          />
          <input
            type="text"
            value={keyword2}
            onChange={(e) => setKeyword2(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드 2"
            className={`flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md outline-none transition-colors ${HIGHLIGHT_COLORS[1].inputBg}`}
          />
          <input
            type="text"
            value={keyword3}
            onChange={(e) => setKeyword3(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드 3"
            className={`flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md outline-none transition-colors ${HIGHLIGHT_COLORS[2].inputBg}`}
          />
        </div>

        {/* Row 2: 역본 + 범위 + 검색 버튼 */}
        <div className="flex gap-2 items-center">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-slate-400 bg-white transition-colors"
          >
            {ALL_VERSIONS.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-slate-500">
            <input
              ref={startBookRef}
              type="text"
              list="search-bible-books"
              value={startBookAbbr}
              onChange={(e) => setStartBookAbbr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="창"
              className="w-16 px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-slate-400 text-center bg-white transition-colors"
            />
            <span className="text-xs">~</span>
            <input
              ref={endBookRef}
              type="text"
              list="search-bible-books"
              value={endBookAbbr}
              onChange={(e) => setEndBookAbbr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="계"
              className="w-16 px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-slate-400 text-center bg-white transition-colors"
            />
          </div>

          <datalist id="search-bible-books">
            {BIBLE_BOOKS.map((book) => (
              <option key={book.id} value={book.abbr} />
            ))}
          </datalist>

          <button
            onClick={handleSearch}
            disabled={isSearchDisabled}
            className="px-4 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div ref={resultsRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            <span className="ml-2 text-sm text-slate-400">검색 중...</span>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100">
              {results.map((result, index) => (
                <button
                  key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    {getBookName(result.book)} {result.chapter}:{result.verse}
                  </div>
                  <div className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                    {highlightText(cleanText(result.text), searchedKeywords)}
                  </div>
                </button>
              ))}
            </div>
            {isLoadingMore && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            )}
          </>
        ) : hasSearched ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">검색어를 입력하세요</p>
          </div>
        )}
      </div>

      {/* 푸터 - 총 개수 */}
      {hasSearched && totalCount > 0 && (
        <div className="px-3 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            {totalCount.toLocaleString()}개 발견
            {results.length < totalCount && ` · ${results.length}개 표시`}
          </p>
        </div>
      )}
    </div>
  )
}
