# 키보드 단축키 시스템

## 개요

이 앱은 마우스 없이 키보드만으로 모든 기능을 사용할 수 있도록 설계되었습니다.
단축키 시스템에서 가장 중요한 기술적 과제는 **충돌 방지**입니다.

## 문제: 단축키 충돌

방향키(`↑↓←→`)는 다음 용도로 사용됩니다:

1. **앱 전역**: 글자 크기 조절, 이전/다음 절 이동
2. **SELECT 요소**: 옵션 탐색
3. **INPUT 요소**: 커서 이동
4. **슬라이더**: 값 조절

사용자가 폰트 SELECT에서 옵션을 탐색하려는데 글자 크기가 바뀌면 안 됩니다.

## 해결: Interactive Element 감지

```typescript
// src/renderer/src/features/version-switch/useVersionSwitch.ts

const isInteractiveElementFocused = (): boolean => {
  const activeElement = document.activeElement
  if (!activeElement || activeElement === document.body) return false

  const tag = activeElement.tagName

  // 1. 폼 요소 체크
  if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag)) return true

  // 2. contenteditable 체크
  if (activeElement.getAttribute('contenteditable') === 'true') return true

  // 3. ARIA role 체크
  const role = activeElement.getAttribute('role')
  if (role) {
    const interactiveRoles = [
      'textbox', 'listbox', 'slider', 'spinbutton',
      'combobox', 'option', 'menuitem', 'menu', 'menubar',
      'tab', 'tablist', 'switch', 'searchbox'
    ]
    if (interactiveRoles.includes(role)) return true
  }

  return false
}
```

### 동작 방식

1. 방향키 이벤트 발생
2. `isInteractiveElementFocused()` 호출
3. `true`면 이벤트 무시 → 브라우저 기본 동작 유지
4. `false`면 앱 단축키 실행

## 단축키 매핑: VERSION_MAP

16개 역본을 단일 알파벳으로 매핑합니다:

```typescript
// src/renderer/src/shared/config/versionMap.ts

export const VERSION_MAP: Record<string, string> = {
  r: '개역한글',
  w: '개역개정',
  s: '새번역',
  // ...
  n: 'NIV2011',
  k: 'NKJV',
}
```

### 활용

| 단축키 | 동작 |
|--------|------|
| `Alt + R` | 현재 역본을 개역한글로 변경 |
| `Alt + Shift + R` | 비교 패널에 개역한글 표시 |

```typescript
// Alt + 알파벳: 현재 버전 변경
if (e.altKey && !e.shiftKey && VERSION_MAP[e.key.toLowerCase()]) {
  const newVersion = VERSION_MAP[e.key.toLowerCase()]
  setCurrentVersion(newVersion)
  // ...
}

// Alt + Shift + 알파벳: 비교 버전 변경
if (e.altKey && e.shiftKey && VERSION_MAP[e.key.toLowerCase()]) {
  const newVersion = VERSION_MAP[e.key.toLowerCase()]
  setComparedVersion(newVersion)
  // ...
}
```

## 복사 단축키: Cmd/Ctrl + C

### 문제

`Cmd/Ctrl + C`는 브라우저의 기본 복사 기능입니다.
INPUT에서 텍스트를 선택하고 복사하려는데 구절이 복사되면 안 됩니다.

### 해결

```typescript
// src/renderer/src/features/verse-copy/useVerseCopy.ts

useEffect(() => {
  const handleCopy = async (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
      // INPUT에 포커스가 있으면 기본 동작 유지
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT') {
        return // 이벤트 가로채지 않음
      }

      e.preventDefault()
      await copyVerseToClipboard()
    }
  }

  window.addEventListener('keydown', handleCopy)
  return () => window.removeEventListener('keydown', handleCopy)
}, [])
```

## 단축키 도움말 자동 생성

`VERSION_MAP`을 순회하여 단축키 목록을 동적으로 생성합니다:

```typescript
// src/renderer/src/widgets/KeyboardShortcutsModal/KeyboardShortcutsModal.tsx

const versionShortcuts = Object.entries(VERSION_MAP).map(([key, version]) => ({
  key: `Alt + ${key.toUpperCase()}`,
  description: version
}))
```

새 역본을 추가하면 도움말에 자동 반영됩니다.

---

## 관련 문서

- [ESC 키 동작](./ESC_KEY_BEHAVIOR.md) - ESC 키의 컨텍스트별 동작

## 관련 파일

- `src/renderer/src/features/version-switch/useVersionSwitch.ts`
- `src/renderer/src/features/verse-copy/useVerseCopy.ts`
- `src/renderer/src/shared/config/versionMap.ts`
- `src/renderer/src/widgets/KeyboardShortcutsModal/`
