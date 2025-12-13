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

| 플랫폼 | IME 상태 관리 | Focus 변경 시 |
|--------|--------------|---------------|
| **macOS** | 시스템 전역 관리 | 상태 유지됨 |
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

## 해결 방법

### 근본적 해결의 한계

#### 왜 프로그래밍으로 해결하기 어려운가?

Microsoft 공식 문서에 명시된 내용:

> "Beginning with Windows 8: By default, the input switch is set per user instead of per thread. The Microsoft IME (Japanese) respects the mode globally, and therefore **ImmSetConversionStatus fails when getting focus**."

Windows 8 이후부터 Microsoft가 **의도적으로** 앱이 IME 모드를 프로그래밍적으로 변경하는 것을 막았습니다. 사용자의 IME 설정을 앱이 임의로 바꾸는 것을 원치 않기 때문입니다.

#### 검토했으나 불가능한 방법들

| 방법 | 불가능한 이유 |
|------|--------------|
| **Native IME API (ffi-napi)** | Windows 8+에서 `ImmSetConversionStatus` 무시됨 |
| **ffi-napi + Electron** | Electron 20+ 호환성 문제, 5년간 업데이트 없음 |
| **InputScope** | input 힌트 역할만, 한/영 강제 전환 불가 |
| **TSF (Text Services Framework)** | IMM32 대체이나 구현 매우 복잡, 같은 제한 적용 |

#### 웹 표준 속성의 한계

- `inputMode` 속성: 모바일 가상 키보드 타입 힌트만 제공, 데스크톱 IME에는 영향 없음
- `lang` 속성: 콘텐츠 언어 선언용, IME 동작 제어 불가
- CSS `ime-mode`: deprecated, Chrome/Electron에서 미지원

#### 결론

Chromium의 IME context 관리 방식 + Windows API 제한이 결합된 문제로, **앱 레벨에서 완벽하게 해결하기가 구조적으로 불가능**합니다.

### 적용된 우회 해결책: 영문 → 한글 자동 변환

IME가 영문 상태여도 두벌식 키보드 배열로 입력하면 자동으로 한글로 변환됩니다.

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

| 영문 입력 | 한글 변환 | 설명 |
|----------|----------|------|
| `dy` | 요 | 요한복음 |
| `ckd` | 창 | 창세기 |
| `tkfwjs` | 살전 | 데살로니가전서 |
| `ele` | 딛 | 디도서 |
| `elawjs` | 딤전 | 디모데전서 |

#### 적용 위치

```typescript
// src/renderer/src/App.tsx

<Footer
  // ...
  onBookChange={(value) => setBook(engToKor(value))}
  // ...
/>
```

## 두벌식 키보드 매핑

### 자음

| 영문 | 한글 | 영문 (Shift) | 한글 (쌍자음) |
|------|------|--------------|---------------|
| q | ㅂ | Q | ㅃ |
| w | ㅈ | W | ㅉ |
| e | ㄷ | E | ㄸ |
| r | ㄱ | R | ㄲ |
| t | ㅅ | T | ㅆ |
| a | ㅁ | | |
| s | ㄴ | | |
| d | ㅇ | | |
| f | ㄹ | | |
| g | ㅎ | | |
| z | ㅋ | | |
| x | ㅌ | | |
| c | ㅊ | | |
| v | ㅍ | | |

### 모음

| 영문 | 한글 | 영문 (Shift) | 한글 |
|------|------|--------------|------|
| y | ㅛ | | |
| u | ㅕ | | |
| i | ㅑ | | |
| o | ㅐ | O | ㅒ |
| p | ㅔ | P | ㅖ |
| h | ㅗ | | |
| j | ㅓ | | |
| k | ㅏ | | |
| l | ㅣ | | |
| b | ㅠ | | |
| n | ㅜ | | |
| m | ㅡ | | |

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
