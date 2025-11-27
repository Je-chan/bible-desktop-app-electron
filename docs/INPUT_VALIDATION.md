# 입력 유효성 검사

## 개요

본문 말씀 범위 설정에서 Zod를 활용한 동기/비동기 유효성 검사를 수행합니다.

## 검증 요구사항

1. **책 이름**: 유효한 성경 약어인가?
2. **장 번호**: 해당 책의 장 수 범위 내인가?
3. **절 번호**: 해당 장의 절 수 범위 내인가?
4. **범위 순서**: 끝 위치가 시작 위치보다 앞서지 않는가?

## Zod 스키마

```typescript
// src/renderer/src/shared/lib/validation.ts

import { z } from 'zod'
import { BIBLE_BOOKS } from '../config'

// 책 약어 → 책 정보 찾기
const findBook = (abbr: string) => BIBLE_BOOKS.find((b) => b.abbr === abbr)

// 단일 위치 스키마
const versePositionSchema = z.object({
  bookAbbr: z.string().refine(
    (abbr) => findBook(abbr) !== undefined,
    { message: '유효하지 않은 책입니다' }
  ),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive()
}).refine(
  // 장 범위 검증
  (data) => {
    const book = findBook(data.bookAbbr)
    return book ? data.chapter <= book.chapters : false
  },
  { message: '장 번호가 범위를 벗어났습니다', path: ['chapter'] }
)

// 범위 스키마
export const scriptureRangeSchema = z.object({
  start: versePositionSchema,
  end: versePositionSchema
}).refine(
  // 끝이 시작보다 앞서면 안됨
  (data) => {
    const startBook = findBook(data.start.bookAbbr)
    const endBook = findBook(data.end.bookAbbr)
    if (!startBook || !endBook) return false

    const startPos = startBook.id * 1000000 + data.start.chapter * 1000 + data.start.verse
    const endPos = endBook.id * 1000000 + data.end.chapter * 1000 + data.end.verse

    return endPos >= startPos
  },
  { message: '끝 위치가 시작 위치보다 앞설 수 없습니다', path: ['end'] }
)
```

## 비동기 검증: 절 최대값

절 번호는 DB 조회가 필요합니다. Zod의 동기 검증 후 별도로 수행합니다.

```typescript
// validation.ts

export const validateVerseMax = async (
  bookId: number,
  chapter: number,
  verse: number,
  version: string = '개역한글'
): Promise<{ valid: boolean; maxVerse?: number }> => {
  const result = await window.bibleApi.getMaxVerse(version, bookId, chapter)
  const maxVerse = result?.maxVerse ?? 0

  if (verse > maxVerse) {
    return { valid: false, maxVerse }
  }

  return { valid: true }
}
```

## 모달에서의 활용

```typescript
// ScriptureRangeModal.tsx

const handleSave = async () => {
  // 1. 동기 검증 (Zod)
  const result = scriptureRangeSchema.safeParse({
    start: { bookAbbr: startBook, chapter: parseInt(startChapter), verse: parseInt(startVerse) },
    end: { bookAbbr: endBook, chapter: parseInt(endChapter), verse: parseInt(endVerse) }
  })

  if (!result.success) {
    // Zod 에러 → 사용자에게 표시
    const error = result.error.errors[0]
    setError(`${error.path.join('.')}: ${error.message}`)
    return
  }

  // 2. 비동기 검증 (절 최대값)
  const startBookInfo = findBook(startBook)!
  const endBookInfo = findBook(endBook)!

  const startVerseCheck = await validateVerseMax(
    startBookInfo.id,
    parseInt(startChapter),
    parseInt(startVerse)
  )

  if (!startVerseCheck.valid) {
    setError(`시작 절이 범위를 벗어났습니다 (최대: ${startVerseCheck.maxVerse}절)`)
    return
  }

  const endVerseCheck = await validateVerseMax(
    endBookInfo.id,
    parseInt(endChapter),
    parseInt(endVerse)
  )

  if (!endVerseCheck.valid) {
    setError(`끝 절이 범위를 벗어났습니다 (최대: ${endVerseCheck.maxVerse}절)`)
    return
  }

  // 3. 모두 통과 → 저장
  onSave({
    start: { bookId: startBookInfo.id, bookAbbr: startBook, chapter: ..., verse: ... },
    end: { bookId: endBookInfo.id, bookAbbr: endBook, chapter: ..., verse: ... }
  })
}
```

## 왜 2단계 검증인가?

### 동기 검증 (Zod)

- 즉시 실행 가능
- 스키마 정의가 명확함
- 타입 추론 지원

### 비동기 검증 (DB 조회)

- 절 최대값은 장마다 다름 (예: 시편 119편은 176절)
- 정적 데이터로 정의하기 어려움
- DB 조회가 필수

```
사용자 입력
    ↓
Zod 검증 (동기)
├─ 실패 → 에러 표시
└─ 성공 ↓
    DB 검증 (비동기)
    ├─ 실패 → 에러 표시
    └─ 성공 → 저장
```

## 에러 표시 UX

```tsx
{error && (
  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-600">{error}</p>
  </div>
)}
```

에러는 모달 하단에 빨간 박스로 표시되며, 입력을 수정하면 자동으로 사라집니다.

---

## 관련 파일

- `src/renderer/src/shared/lib/validation.ts` - Zod 스키마, 비동기 검증
- `src/renderer/src/widgets/ScriptureRangeModal/ScriptureRangeModal.tsx`
- `src/renderer/src/shared/config/bibleBooks.ts` - 책 정보 (장 수 포함)
