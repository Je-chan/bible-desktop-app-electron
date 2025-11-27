# 검색 시스템

## 개요

최대 3개의 키워드로 성경 구절을 검색하고, 검색 결과에서 각 키워드를 다른 색상으로 하이라이트합니다.

## 다중 키워드 검색

### 요구사항

1. 3개의 키워드 입력 필드
2. 비어있는 필드는 검색 조건에서 제외
3. 모든 키워드가 AND 조건으로 결합
4. 각 키워드마다 고유한 하이라이트 색상

### SQL 쿼리 생성

```typescript
// src/main/database.ts

export const searchVerses = (
  version: string,
  keywords: string[],  // ['사랑', '하나님', ''] → 빈 문자열 포함 가능
  startBook: number = 1,
  endBook: number = 66,
  limit: number = 100,
  offset: number = 0
) => {
  // 1. 빈 키워드 필터링
  const validKeywords = keywords.filter((k) => k.trim() !== '')
  if (validKeywords.length === 0) return []

  // 2. 동적 LIKE 조건 생성
  const likeConditions = validKeywords.map(() => 'btext LIKE ?').join(' AND ')
  const likeParams = validKeywords.map((k) => `%${k}%`)

  // 3. 최종 쿼리
  const query = `
    SELECT book, chapter, verse, btext as text
    FROM Bible
    WHERE book >= ? AND book <= ?
      AND ${likeConditions}
    ORDER BY book, chapter, verse
    LIMIT ? OFFSET ?
  `

  return db.prepare(query).all(startBook, endBook, ...likeParams, limit, offset)
}
```

**예시**: 키워드가 `['사랑', '하나님']`이면:
```sql
WHERE book >= 1 AND book <= 66
  AND btext LIKE '%사랑%' AND btext LIKE '%하나님%'
```

## 하이라이트 오버랩 처리

### 문제

"하나님의 사랑"에서 "하나"와 "하나님"을 둘 다 검색하면 어떻게 될까요?

```
텍스트: "하나님의 사랑"
키워드1: "하나"   → 위치 0-2
키워드2: "하나님" → 위치 0-3  ← 겹침!
```

두 하이라이트가 겹치면 HTML이 깨집니다.

### 해결: 오버랩 필터링

```typescript
// src/renderer/src/widgets/SearchPanel/SearchPanel.tsx

const highlightKeywords = (text: string, keywords: string[]) => {
  const validKeywords = keywords.filter((k) => k.trim())
  if (validKeywords.length === 0) return text

  // 1. 모든 키워드의 모든 매치 위치 수집
  const allMatches: Array<{
    start: number
    end: number
    keyword: string
    colorIndex: number
  }> = []

  validKeywords.forEach((keyword, colorIndex) => {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        keyword: match[0],
        colorIndex
      })
    }
  })

  // 2. 시작 위치로 정렬
  allMatches.sort((a, b) => a.start - b.start)

  // 3. 오버랩 필터링 (먼저 나온 것 우선)
  const filtered: typeof allMatches = []
  let lastEnd = 0

  for (const match of allMatches) {
    if (match.start >= lastEnd) {  // 겹치지 않으면 추가
      filtered.push(match)
      lastEnd = match.end
    }
    // 겹치면 스킵 (먼저 매치된 것이 우선)
  }

  // 4. JSX 생성
  const result: React.ReactNode[] = []
  let cursor = 0

  filtered.forEach((match, idx) => {
    // 매치 이전 텍스트
    if (match.start > cursor) {
      result.push(text.slice(cursor, match.start))
    }
    // 하이라이트된 텍스트
    result.push(
      <mark key={idx} className={HIGHLIGHT_COLORS[match.colorIndex]}>
        {match.keyword}
      </mark>
    )
    cursor = match.end
  })

  // 남은 텍스트
  if (cursor < text.length) {
    result.push(text.slice(cursor))
  }

  return result
}
```

### 색상 매핑

```typescript
const HIGHLIGHT_COLORS = [
  'bg-amber-200',   // 키워드 1
  'bg-emerald-200', // 키워드 2
  'bg-sky-200'      // 키워드 3
]
```

입력 필드 배경색과 동일하게 맞춰 직관적인 UX를 제공합니다.

## 무한 스크롤 페이지네이션

### 구현

```typescript
// SearchPanel.tsx

const [results, setResults] = useState<SearchResult[]>([])
const [offset, setOffset] = useState(0)
const [hasMore, setHasMore] = useState(true)
const LIMIT = 100

// 스크롤 이벤트
const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

  // 바닥에서 100px 이내면 다음 페이지 로드
  if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoading) {
    loadMore()
  }
}, [hasMore, isLoading])

// 추가 로드
const loadMore = async () => {
  const newResults = await window.bibleApi.searchVerses(
    version, keywords, startBook, endBook, LIMIT, offset
  )

  if (newResults.length < LIMIT) {
    setHasMore(false)  // 더 이상 결과 없음
  }

  setResults(prev => [...prev, ...newResults])
  setOffset(prev => prev + LIMIT)
}
```

## 검색 범위 입력

### 약어 기반 입력

SELECT 대신 INPUT + datalist로 빠른 입력을 지원합니다:

```tsx
<input
  type="text"
  list="book-list"
  placeholder="창"
  value={startBookAbbr}
  onChange={(e) => setStartBookAbbr(e.target.value)}
/>
<datalist id="book-list">
  {BIBLE_BOOKS.map((book) => (
    <option key={book.id} value={book.abbr} />
  ))}
</datalist>
```

### 유효성 검사

```typescript
const startBook = BIBLE_BOOKS.find(b => b.abbr === startBookAbbr)
const endBook = BIBLE_BOOKS.find(b => b.abbr === endBookAbbr)

// 없으면 기본값 사용
const startId = startBook?.id ?? 1   // 창세기
const endId = endBook?.id ?? 66      // 요한계시록

// 순서 보정
if (startId > endId) {
  [startId, endId] = [endId, startId]
}
```

---

## 관련 파일

- `src/main/database.ts` - searchVerses, searchVersesCount
- `src/renderer/src/widgets/SearchPanel/SearchPanel.tsx`
- `src/renderer/src/shared/config/bibleBooks.ts`
