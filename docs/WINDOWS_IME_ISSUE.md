# Windows IME 입력 문제

## 개요

Windows 환경에서 Footer의 책 이름 입력 시 IME(한글 입력기) 상태가 영어로 리셋되는 문제가 발생합니다. macOS에서는 발생하지 않는 Windows 전용 이슈입니다.

## 문제 현상

1. Footer의 첫 번째 input(책 이름)에 focus
2. 한글 입력 모드로 전환
3. Tab으로 모든 input 순회 (책 → 장 → 절)
4. 절 input에서 Tab 시 모든 input이 blur 상태가 됨
5. 다시 Tab으로 첫 번째 input에 focus 시 **IME가 영어로 리셋됨**

## 원인 분석

### Windows IME 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Windows IME 아키텍처                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                                               │
│   │   Thread    │                                               │
│   │             │                                               │
│   │  ┌───────────────────┐                                      │
│   │  │  Default HIMC     │  ← 스레드당 하나의 기본 Input Context │
│   │  │  (Input Context)  │                                      │
│   │  │                   │                                      │
│   │  │  - Conversion Mode│  ← 한글/영문 상태가 여기 저장됨       │
│   │  │  - Sentence Mode  │                                      │
│   │  │  - Open Status    │                                      │
│   │  └───────────────────┘                                      │
│   │           │                                                 │
│   │           │ ImmAssociateContext()                           │
│   │           ▼                                                 │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │  │   Window A  │  │   Window B  │  │   Window C  │         │
│   │  │   (Input)   │  │   (Input)   │  │   (Input)   │         │
│   │  └─────────────┘  └─────────────┘  └─────────────┘         │
│   │                                                             │
│   └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Windows IME는 **HIMC (Input Method Context)** 라는 구조체에 한글/영문 상태를 저장합니다. 각 스레드는 기본 HIMC를 가지며, 이것이 각 window(input)에 연결됩니다.

### 문제 발생 시퀀스

```
시간 ────────────────────────────────────────────────────────────────►

1. Input에 Focus
   ┌─────────────────────────────────────────────────────────────────┐
   │ Chromium: ImmAssociateContext(hwnd, defaultHIMC)                │
   │ → 기본 HIMC가 input에 연결됨                                    │
   │ → 기본 상태: 영문 (IME_CMODE_ALPHANUMERIC)                      │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
2. 사용자가 한/영 키 누름
   ┌─────────────────────────────────────────────────────────────────┐
   │ Windows IME: conversion mode = 한글 (IME_CMODE_HANGUL)          │
   │ → HIMC 내부 상태가 한글로 변경됨                                 │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
3. 한글 입력 ("안녕하세요")
   ┌─────────────────────────────────────────────────────────────────┐
   │ 정상 작동                                                       │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
4. Input에서 Blur ⚠️ 핵심 문제 지점
   ┌─────────────────────────────────────────────────────────────────┐
   │ Chromium ime_input.cc:                                         │
   │                                                                 │
   │   void ImeInput::DisableIME(HWND window_handle) {              │
   │     CleanupComposition(window_handle);                         │
   │     ImmAssociateContextEx(window_handle, NULL, 0);  ← 💥       │
   │   }                                                             │
   │                                                                 │
   │ → HIMC와 window의 연결이 해제됨                                 │
   │ → 또는 context가 "비활성화" 상태가 됨                           │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
5. 다시 Input에 Focus ⚠️ 문제 발생
   ┌─────────────────────────────────────────────────────────────────┐
   │ Chromium:                                                       │
   │   ImmAssociateContextEx(window_handle, NULL, IACE_DEFAULT)     │
   │                                                                 │
   │ → "기본" context가 다시 연결됨                                  │
   │ → 기본 context의 conversion mode = 영문 (초기값)                │
   │                                                                 │
   │ 💥 이전에 설정한 한글 모드가 사라짐!                            │
   └─────────────────────────────────────────────────────────────────┘
```

### Chromium의 설계 철학

```cpp
// Chromium 소스 (ui/base/win/ime_input.cc)
void ImeInput::DisableIME(HWND window_handle) {
  // A renderer process have moved its input focus to a password input
  // when there is an ongoing composition, e.g. a user has clicked a
  // mouse button and selected a password input while composing a text.
  // For this case, we have to complete the ongoing composition and
  // clean up the resources attached to this object BEFORE DISABLING THE IME.
  CleanupComposition(window_handle);
  ::ImmAssociateContextEx(window_handle, NULL, 0);
}
```

Chromium은 보안과 일관성을 위해 **focus가 빠질 때 IME context를 명시적으로 해제**합니다:

- Password 필드로 이동 시 IME 조합 문자가 남아있으면 안 됨
- 웹 페이지 간 IME 상태가 공유되면 안 됨

### Windows의 기본 동작

```
IACE_DEFAULT 플래그로 context 복원 시:
→ 시스템 기본 conversion mode로 리셋
→ Korean IME의 기본값 = 영문 (A)
```

### macOS와의 차이

| 플랫폼      | IME 상태 관리    | Focus 변경 시          |
| ----------- | ---------------- | ---------------------- |
| **macOS**   | 시스템 전역 관리 | 상태 유지됨            |
| **Windows** | Per-context 관리 | Context 리셋 시 초기화 |

macOS는 IME 상태를 **시스템 레벨**에서 전역으로 관리하기 때문에 앱이나 input 간 전환에도 상태가 유지됩니다.

### 근본 원인 요약

```
┌─────────────────────────────────────────────────────────────────┐
│                        근본 원인                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Chromium이 blur 시 ImmAssociateContextEx(hwnd, NULL, 0)    │
│     호출하여 IME context 해제                                   │
│                                                                 │
│  2. Focus 시 IACE_DEFAULT로 기본 context 복원                   │
│                                                                 │
│  3. 기본 context의 conversion mode = 영문 (초기값)              │
│                                                                 │
│  4. Windows 8+ 에서 ImmSetConversionStatus로                   │
│     프로그래밍적 복원 불가 (API가 무시됨)                        │
│                                                                 │
│  → 결과: 한글 → 영문으로 리셋                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 참고 자료

- [Simplenote Electron IME Issue](https://github.com/Automattic/simplenote-electron/issues/2522)
- [Electron IME Bug on Windows](https://github.com/electron/electron/issues/41393)
- [Microsoft: ImmSetConversionStatus](https://learn.microsoft.com/en-us/windows/win32/api/imm/nf-imm-immsetconversionstatus)
- [Microsoft: IME mode model changes](https://learn.microsoft.com/en-us/windows/win32/w8cookbook/ime-mode-model-changed-from-per-user-to-per-thread)

---

## 시도했던 해결책들 (실패)

### 1. Ghost Input 방식 (실패)

#### 접근 방식

```tsx
// App.tsx
;<input
  ref={ghostInputRef}
  type="text"
  tabIndex={-1}
  className="fixed -top-[100px] left-0 w-px h-px opacity-0"
/>

// useVerseSearch.ts
if (e.key === 'Enter') {
  await handleSearch()
  ghostInputRef.current?.focus() // blur 대신 숨겨진 input으로 focus 이동
}
```

Focus를 "유령" input으로 이동시켜 IME context를 유지하려는 시도였습니다.

#### 실패 원인

Ghost input 방식이 IME 문제를 해결하지 못한 이유는 **focus 이동 자체가 문제**이기 때문입니다:

```
[절 input] --blur--> [ghost input] --focus-->
     ↓                      ↓
Chromium 호출:         새 IME context 연결
ImmAssociateContextEx   (기본값: 영문)
(hwnd, NULL, 0)
```

Ghost input이 화면 밖에 숨겨져 있어도(`fixed -top-[100px] opacity-0`), 이것은 **시각적** 숨김일 뿐입니다. **논리적으로는** 여전히:

1. 원래 input에서 blur 이벤트 발생
2. Chromium이 IME context 해제
3. Ghost input에 focus 시 **새로운 기본 context**(영문) 연결

핵심은 **Chromium 레벨에서 blur 시점에 IME context가 초기화된다**는 것입니다.

---

### 2. 조건부 렌더링 마스터 Input (실패)

#### 접근 방식

```tsx
// Footer.tsx - 조건부 렌더링 방식
const [currentField, setCurrentField] = useState<Field>('book')

// 현재 필드에만 input을 렌더링하고, 나머지는 div로 표시
{currentField === 'book' ? (
  <input ref={masterInputRef} value={book} ... />  // 마운트
) : (
  <div onClick={() => setCurrentField('book')}>{book}</div>  // input 언마운트
)}

{currentField === 'chapter' ? (
  <input ref={masterInputRef} value={chapter} ... />  // 마운트
) : (
  <div>{chapter}</div>  // input 언마운트
)}
```

Focus를 절대 이동하지 않으면 IME가 리셋되지 않을 것이라 예상하여, 하나의 `masterInputRef`를 세 개의 input 중 현재 활성화된 것에만 연결하는 방식을 시도했습니다.

#### 실패 원인: DOM 요소 교체로 인한 암묵적 Blur

**핵심 문제**: 조건부 렌더링(`{condition ? <input /> : <div />}`)은 **DOM 요소를 완전히 교체**합니다.

```
시간 ────────────────────────────────────────────────────────────────►

1. currentField = 'book'
   ┌─────────────────────────────────────────────────────────────────┐
   │ DOM 상태:                                                       │
   │   [input#book (focused)] [div#chapter] [div#verse]             │
   │                                                                 │
   │ masterInputRef → input#book                                    │
   │ IME context가 input#book에 연결됨                               │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tab 키 → setCurrentField('chapter')
                              ▼
2. React 렌더링 (currentField = 'chapter')
   ┌─────────────────────────────────────────────────────────────────┐
   │ React가 수행하는 작업:                                          │
   │                                                                 │
   │   1. input#book을 DOM에서 제거 (unmount)                        │
   │      → 💥 브라우저가 암묵적으로 focus를 잃은 것으로 처리         │
   │      → 💥 Chromium이 ImmAssociateContextEx(hwnd, NULL, 0) 호출  │
   │      → 💥 IME context 해제                                      │
   │                                                                 │
   │   2. 새로운 input#chapter를 DOM에 삽입 (mount)                  │
   │      → 완전히 새로운 DOM 요소                                   │
   │      → 새로운 IME context 연결 (기본값: 영문)                   │
   │                                                                 │
   │ 결과 DOM:                                                       │
   │   [div#book] [input#chapter (새 요소)] [div#verse]             │
   └─────────────────────────────────────────────────────────────────┘
```

#### 왜 같은 ref를 공유해도 소용없는가

```tsx
// 같은 masterInputRef를 사용하지만...
{
  currentField === 'book' && <input ref={masterInputRef} />
}
{
  currentField === 'chapter' && <input ref={masterInputRef} />
}
```

`ref`는 **참조(포인터)**일 뿐입니다. ref가 같아도:

- 이전 input이 DOM에서 제거되면 브라우저는 focus loss를 감지
- 새 input이 DOM에 추가되면 **새로운 native element**로 인식
- Windows IME 입장에서는 "다른 입력 필드"

---

### 실패한 방법들의 공통 문제

| 시도           | 방식                          | 실패 원인                              |
| -------------- | ----------------------------- | -------------------------------------- |
| Ghost Input    | focus를 숨겨진 input으로 이동 | blur 발생 → IME 리셋                   |
| 조건부 렌더링  | 현재 필드만 input 렌더링      | DOM 요소 제거 → 암묵적 blur → IME 리셋 |
| 3개 독립 Input | 일반적인 Tab 이동             | focus 이동 → blur 발생 → IME 리셋      |

모든 방식이 **"DOM 요소가 바뀌거나 focus가 이동하면 IME가 리셋된다"**는 동일한 문제에 부딪힙니다.

---

### 검토했으나 불가능한 방법들

#### 왜 프로그래밍으로 해결하기 어려운가?

Microsoft 공식 문서에 명시된 내용:

> "Beginning with Windows 8: By default, the input switch is set per user instead of per thread. The Microsoft IME (Japanese) respects the mode globally, and therefore **ImmSetConversionStatus fails when getting focus**."

Windows 8 이후부터 Microsoft가 **의도적으로** 앱이 IME 모드를 프로그래밍적으로 변경하는 것을 막았습니다.

| 방법                              | 불가능한 이유                                  |
| --------------------------------- | ---------------------------------------------- |
| **Native IME API (ffi-napi)**     | Windows 8+에서 `ImmSetConversionStatus` 무시됨 |
| **ffi-napi + Electron**           | Electron 20+ 호환성 문제, 5년간 업데이트 없음  |
| **InputScope**                    | input 힌트 역할만, 한/영 강제 전환 불가        |
| **TSF (Text Services Framework)** | IMM32 대체이나 구현 매우 복잡, 같은 제한 적용  |

#### 웹 표준 속성의 한계

- `inputMode` 속성: 모바일 가상 키보드 타입 힌트만 제공, 데스크톱 IME에는 영향 없음
- `lang` 속성: 콘텐츠 언어 선언용, IME 동작 제어 불가
- CSS `ime-mode`: deprecated, Chrome/Electron에서 미지원

#### 결론

Chromium의 IME context 관리 방식 + Windows API 제한이 결합된 문제로, **앱 레벨에서 완벽하게 해결하기가 구조적으로 불가능**합니다.

### 적용된 우회 해결책: 영문 → 한글 자동 변환

```
┌─────────────────────────────────────────────────────────────────┐
│                     핵심 원리                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IME 리셋의 원인 = Focus 이동 또는 DOM 요소 변경                 │
│                                                                 │
│  해결책 = Focus를 절대 이동하지 않고, DOM 요소도 바꾸지 않음     │
│                                                                 │
│  구현 = 단일 Input을 항상 DOM에 유지하고 CSS로 위치만 변경       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// src/renderer/src/shared/lib/engToKor.ts

export function engToKor(input: string): string {
  // 영문자가 포함되어 있는지 확인
  if (!/[a-zA-Z]/.test(input)) {
    return input
  }

  // 영문 → 자모 변환 → 한글 조합
  // ...
}
```

#### 변환 예시

| 영문 입력 | 한글 변환 | 설명           |
| --------- | --------- | -------------- |
| `dy`      | 요        | 요한복음       |
| `ckd`     | 창        | 창세기         |
| `tkfwjs`  | 살전      | 데살로니가전서 |
| `ele`     | 딛        | 디도서         |
| `elawjs`  | 딤전      | 디모데전서     |

```tsx
// src/renderer/src/widgets/Footer/Footer.tsx

export const Footer = ({ book, chapter, verse, masterInputRef, onSearch, ... }) => {
  const [activeField, setActiveField] = useState<'book' | 'chapter' | 'verse'>('book')

<Footer
  // ...
}
```

#### 위치 계산 및 스타일 적용

```tsx
// 마스터 Input 위치 계산
const updateInputPosition = useCallback(() => {
  let targetRef: React.RefObject<HTMLDivElement | null>
  switch (activeField) {
    case 'book':
      targetRef = bookDivRef
      break
    case 'chapter':
      targetRef = chapterDivRef
      break
    case 'verse':
      targetRef = verseDivRef
      break
  }

  if (!targetRef.current || !containerRef.current) return

  const targetRect = targetRef.current.getBoundingClientRect()
  const containerRect = containerRef.current.getBoundingClientRect()

  setInputStyle({
    position: 'absolute',
    left: targetRect.left - containerRect.left,
    top: targetRect.top - containerRect.top,
    width: targetRect.width,
    height: targetRect.height
    // ...스타일
  })
}, [activeField])
```

#### Tab 키 처리 (핵심!)

```tsx
const handleKeyDown = useCallback(
  async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault() // ⭐ 기본 Tab 동작 막기 = Blur 방지!

      if (e.shiftKey) {
        // Shift+Tab: 역순
        setActiveField((prev) => {
          switch (prev) {
            case 'book':
              return 'verse'
            case 'chapter':
              return 'book'
            case 'verse':
              return 'chapter'
          }
        })
      } else {
        // Tab: 순방향
        if (activeField === 'verse') {
          // 절에서 Tab: 검색 실행 후 책으로 이동
          if (book && chapter && verse) {
            await onSearch()
          }
          setActiveField('book')
        } else {
          setActiveField((prev) => (prev === 'book' ? 'chapter' : 'verse'))
        }
      }

      // 필드 변경 후 전체 선택
      setTimeout(() => masterInputRef.current?.select(), 0)
    }
    // Enter, Escape, 방향키 처리...
  },
  [activeField, book, chapter, verse, onSearch, masterInputRef]
)
```

#### JSX 구조

```tsx
return (
  <footer>
    <div ref={containerRef} className="relative flex items-center gap-3">
      {/* ⭐ 마스터 Input - 단 하나만 존재, 위치만 변경 ⭐ */}
      <input
        ref={masterInputRef}
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="absolute z-10 ..."
        style={inputStyle}
      />

      {/* 책 필드 (플레이스홀더 - div) */}
      <div className="flex items-center gap-1">
        <label>책</label>
        <div
          ref={bookDivRef}
          onClick={() => handleFieldClick('book')}
          style={{ visibility: activeField === 'book' ? 'hidden' : 'visible' }}
        >
          {book}
        </div>
      </div>

      {/* 장 필드 (플레이스홀더 - div) */}
      <div className="flex items-center gap-1">
        <label>장</label>
        <div
          ref={chapterDivRef}
          onClick={() => handleFieldClick('chapter')}
          style={{ visibility: activeField === 'chapter' ? 'hidden' : 'visible' }}
        >
          {chapter}
        </div>
      </div>

      {/* 절 필드 (플레이스홀더 - div) */}
      <div className="flex items-center gap-1">
        <label>절</label>
        <div
          ref={verseDivRef}
          onClick={() => handleFieldClick('verse')}
          style={{ visibility: activeField === 'verse' ? 'hidden' : 'visible' }}
        >
          {verse}
        </div>
      </div>
    </div>
  </footer>
)
```

## 두벌식 키보드 매핑

```
Tab 키 입력
    │
    ▼
e.preventDefault()  ← 브라우저 기본 Tab 동작(focus 이동) 차단
    │
    ▼
setActiveField('chapter')  ← React state만 변경
    │
    ▼
inputStyle 변경: left: 32px → left: 120px  ← CSS만 변경
    │
    ▼
동일한 <input> DOM 요소가 CSS로 이동
    │
    ▼
Focus 유지, Blur 이벤트 없음
    │
    ▼
Chromium이 ImmAssociateContextEx를 호출하지 않음
    │
    ▼
IME context 유지 ✅ 한글 모드 그대로!
```

### 동작 방식 요약

| 키             | 동작                                 |
| -------------- | ------------------------------------ |
| **Tab**        | 책 → 장 → 절 → (검색 실행) → 책 순환 |
| **Shift+Tab**  | 역순 순환                            |
| **Enter**      | 검색 실행 후 책 필드로 이동          |
| **ESC**        | blur (입력 필드에서 포커스 해제)     |
| **←/→ 방향키** | 커서가 끝에 있을 때 필드 이동        |
| **필드 클릭**  | 해당 필드로 이동                     |

### 조건부 렌더링 vs Master Input 패턴

| 항목       | 조건부 렌더링 (실패)         | Master Input (성공)         |
| ---------- | ---------------------------- | --------------------------- |
| Input 개수 | 필드마다 다른 input          | **단일 input**              |
| DOM 변화   | 필드 변경 시 언마운트/마운트 | **input은 항상 DOM에 존재** |
| Focus      | 필드마다 다른 요소에 focus   | **같은 요소에 focus 유지**  |
| Blur 발생  | 필드 변경 시 발생            | **발생하지 않음**           |
| IME 상태   | 리셋됨                       | **유지됨**                  |

---

## 사용자 측 Windows 설정 (선택)

Windows 설정에서 IME 동작을 조정할 수 있습니다:

1. **설정 → 시간 및 언어 → 입력 → 고급 키보드 설정**
2. "앱 창마다 다른 입력 방법 사용" 옵션 확인
3. "기본 입력 방법 재정의" 설정

## 한계점

- 영문 → 한글 변환은 **두벌식 키보드 배열**만 지원
- 세벌식 등 다른 키보드 배열은 미지원
- 복합 모음/종성 조합이 복잡한 경우 일부 예외 발생 가능

---

## 관련 파일

- `src/renderer/src/shared/lib/engToKor.ts` - 영문 → 한글 변환 유틸리티
- `src/renderer/src/App.tsx` - 변환 함수 적용
- `src/renderer/src/widgets/Footer/Footer.tsx` - 책 이름 입력 input
