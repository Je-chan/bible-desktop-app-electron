# 상태 관리

## 개요

Zustand를 사용하여 전역 상태를 관리합니다. 설정은 이중 레이어로 관리됩니다:
- **메모리**: 실시간 미리보기
- **영구 저장**: 명시적 저장 시 electron-store에 반영

## Zustand Store 구조

```typescript
// src/renderer/src/store/useBibleStore.ts

interface BibleState {
  // 현재 표시 중인 구절
  currentVerse: SearchResult | null
  currentVersion: string

  // 역본 비교
  isCompareOpen: boolean
  comparedVersion: string
  comparedVerse: SearchResult | null

  // 본문 말씀
  todayScriptureRange: ScriptureRange | null
  currentScripture: VersePosition | null

  // 최근 검색
  recentSearches: string[]

  // 액션
  fetchVerse: (book: string, bookId: number, chapter: number, verse: number) => Promise<void>
  setCurrentVersion: (version: string) => void
  // ...
}
```

## 본문 말씀 범위 체크

### 절대 위치 계산

범위 체크를 위해 책/장/절을 단일 숫자로 변환합니다:

```typescript
const getAbsolutePosition = (bookId: number, chapter: number, verse: number) => {
  return bookId * 1000000 + chapter * 1000 + verse
}

// 예시
// 창세기 1:1  → 1 * 1000000 + 1 * 1000 + 1 = 1001001
// 요한복음 3:16 → 43 * 1000000 + 3 * 1000 + 16 = 43003016
```

### 범위 내 여부 확인

```typescript
// fetchVerse 내부

const checkScriptureRange = () => {
  if (!todayScriptureRange) {
    set({ currentScripture: null })
    return
  }

  const { start, end } = todayScriptureRange
  const currentPos = getAbsolutePosition(bookId, chapter, verse)
  const startPos = getAbsolutePosition(start.bookId, start.chapter, start.verse)
  const endPos = getAbsolutePosition(end.bookId, end.chapter, end.verse)

  if (currentPos >= startPos && currentPos <= endPos) {
    set({ currentScripture: { book: bookAbbr, bookId, chapter, verse } })
  } else {
    set({ currentScripture: null })
  }
}
```

`currentScripture`가 있으면 Header에 "본문 말씀" 표시가 나타납니다.

## 역본 비교 동기화

비교 패널이 열려 있을 때, 현재 구절이 변경되면 비교 구절도 자동으로 업데이트됩니다:

```typescript
// fetchVerse 내부

// 현재 구절 fetch
const data = await window.bibleApi.getVerse(currentVersion, bookId, chapter, verse)
set({ currentVerse: data })

// 비교 패널이 열려 있으면 비교 구절도 fetch
if (isCompareOpen) {
  const comparedData = await window.bibleApi.getVerse(comparedVersion, bookId, chapter, verse)
  set({ comparedVerse: comparedData })
}
```

## 설정 관리: 이중 레이어

### 문제

환경설정 모달에서 색상을 바꾸면 즉시 미리보기가 되어야 합니다.
하지만 "취소"를 누르면 원래대로 돌아가야 합니다.

### 해결: useSettings Hook

```typescript
// src/renderer/src/shared/hooks/useSettings.ts

export const useSettings = () => {
  // 로컬 상태 (실시간 미리보기용)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // 앱 시작 시 저장된 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await window.settingsApi.get()
      const merged = { ...DEFAULT_SETTINGS, ...saved }
      setSettings(merged)
      setOriginalSettings(merged)  // 원본 백업
    }
    loadSettings()
  }, [])

  // 실시간 변경 (미리보기)
  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
    // electron-store에는 저장하지 않음!
  }

  // 명시적 저장
  const saveSettings = async () => {
    await window.settingsApi.set(settings)
    setOriginalSettings(settings)  // 원본 갱신
  }

  // 취소 (원본으로 복구)
  const resetSettings = () => {
    setSettings(originalSettings)
  }

  return { settings, updateSettings, saveSettings, resetSettings }
}
```

### 흐름

```
사용자가 색상 변경
    ↓
updateSettings() 호출
    ↓
React 상태만 변경 (미리보기 반영)
    ↓
[저장] 클릭 → saveSettings() → electron-store에 저장
[취소] 클릭 → resetSettings() → 원본으로 복구
```

## 최근 검색 관리

```typescript
addRecentSearch: (query: string) => {
  set((state) => {
    // 중복 제거
    const filtered = state.recentSearches.filter(q => q !== query)
    // 맨 앞에 추가, 최대 10개
    return {
      recentSearches: [query, ...filtered].slice(0, 10)
    }
  })
}
```

---

## 관련 파일

- `src/renderer/src/store/useBibleStore.ts` - 전역 상태
- `src/renderer/src/shared/hooks/useSettings.ts` - 설정 관리
- `src/main/index.ts` - electron-store IPC 핸들러
