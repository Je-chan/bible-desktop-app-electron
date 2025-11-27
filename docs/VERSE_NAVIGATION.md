# 구절 탐색

## 개요

방향키(`←` `→`)로 이전/다음 절을 탐색합니다.
장과 책의 경계를 자동으로 처리하여 끊김 없는 탐색 경험을 제공합니다.

## 경계 조건

| 상황 | 동작 |
|------|------|
| 요한복음 3:16 → | 요한복음 3:17 |
| 요한복음 3:36 (마지막 절) → | 요한복음 4:1 |
| 요한복음 21:25 (마지막 장 마지막 절) → | 사도행전 1:1 |
| 요한계시록 22:21 (성경 마지막) → | 이동 안함 |
| 창세기 1:1 (성경 처음) ← | 이동 안함 |

## 구현

```typescript
// src/renderer/src/features/verse-navigation/useVerseNavigation.ts

export const useVerseNavigation = (
  currentBookId: number,
  setCurrentBookId: (id: number) => void
) => {
  const { currentVerse, currentVersion, fetchVerse } = useBibleStore()

  const navigateVerse = async (direction: 1 | -1) => {
    if (!currentVerse) return

    const { chapter, verse } = currentVerse

    if (direction === 1) {
      // 다음 절
      await navigateNext(chapter, verse)
    } else {
      // 이전 절
      await navigatePrev(chapter, verse)
    }
  }

  return { navigateVerse }
}
```

### 다음 절 이동

```typescript
const navigateNext = async (chapter: number, verse: number) => {
  const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
  if (!currentBook) return

  // 1. 현재 장의 최대 절 확인
  const maxVerseResult = await window.bibleApi.getMaxVerse(
    currentVersion, currentBookId, chapter
  )
  const maxVerse = maxVerseResult?.maxVerse ?? 0

  // 2. 아직 절이 남았으면 다음 절로
  if (verse < maxVerse) {
    await fetchVerse(currentBook.abbr, currentBookId, chapter, verse + 1)
    return
  }

  // 3. 마지막 절이면 다음 장으로
  if (chapter < currentBook.chapters) {
    await fetchVerse(currentBook.abbr, currentBookId, chapter + 1, 1)
    return
  }

  // 4. 마지막 장이면 다음 책으로
  const nextBook = BIBLE_BOOKS.find((b) => b.id === currentBookId + 1)
  if (nextBook) {
    setCurrentBookId(nextBook.id)
    await fetchVerse(nextBook.abbr, nextBook.id, 1, 1)
  }

  // 5. 요한계시록 마지막이면 아무것도 안함
}
```

### 이전 절 이동

```typescript
const navigatePrev = async (chapter: number, verse: number) => {
  const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
  if (!currentBook) return

  // 1. 아직 절이 남았으면 이전 절로
  if (verse > 1) {
    await fetchVerse(currentBook.abbr, currentBookId, chapter, verse - 1)
    return
  }

  // 2. 첫 절이면 이전 장의 마지막 절로
  if (chapter > 1) {
    const prevMaxVerse = await window.bibleApi.getMaxVerse(
      currentVersion, currentBookId, chapter - 1
    )
    await fetchVerse(
      currentBook.abbr,
      currentBookId,
      chapter - 1,
      prevMaxVerse?.maxVerse ?? 1
    )
    return
  }

  // 3. 첫 장이면 이전 책의 마지막 장 마지막 절로
  const prevBook = BIBLE_BOOKS.find((b) => b.id === currentBookId - 1)
  if (prevBook) {
    setCurrentBookId(prevBook.id)
    const prevMaxVerse = await window.bibleApi.getMaxVerse(
      currentVersion, prevBook.id, prevBook.chapters
    )
    await fetchVerse(
      prevBook.abbr,
      prevBook.id,
      prevBook.chapters,
      prevMaxVerse?.maxVerse ?? 1
    )
  }

  // 4. 창세기 첫 절이면 아무것도 안함
}
```

## 왜 DB 조회가 필요한가?

### 장 수는 정적 데이터

```typescript
// BIBLE_BOOKS에 정의됨
{ id: 43, name: '요한복음', abbr: '요', chapters: 21 }
```

### 절 수는 동적 데이터

각 장마다 절 수가 다릅니다:
- 시편 117편: 2절
- 시편 119편: 176절

매번 `getMaxVerse()`로 조회해야 합니다.

## 비교 패널 동기화

구절이 변경되면 비교 패널도 자동으로 같은 위치로 이동합니다:

```typescript
// useBibleStore.ts - fetchVerse 내부

// 현재 구절 fetch
const data = await window.bibleApi.getVerse(currentVersion, bookId, chapter, verse)
set({ currentVerse: data })

// 비교 패널이 열려 있으면 같이 fetch
if (get().isCompareOpen) {
  const comparedData = await window.bibleApi.getVerse(
    get().comparedVersion, bookId, chapter, verse
  )
  set({ comparedVerse: comparedData })
}
```

## 탐색 흐름도

```
← 키 입력
    ↓
isInteractiveElementFocused()?
├─ Yes → 무시 (INPUT에서 커서 이동)
└─ No ↓
    navigateVerse(-1) 호출
        ↓
    verse > 1?
    ├─ Yes → 같은 장 이전 절
    └─ No ↓
        chapter > 1?
        ├─ Yes → 이전 장 마지막 절 (DB 조회)
        └─ No ↓
            이전 책 있음?
            ├─ Yes → 이전 책 마지막 장 마지막 절
            └─ No → 아무것도 안함 (창세기 1:1)
```

---

## 관련 파일

- `src/renderer/src/features/verse-navigation/useVerseNavigation.ts`
- `src/renderer/src/features/version-switch/useVersionSwitch.ts` - 키 이벤트 처리
- `src/renderer/src/store/useBibleStore.ts` - fetchVerse
- `src/main/database.ts` - getMaxVerse
