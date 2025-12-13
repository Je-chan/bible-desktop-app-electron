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
4. Input에서 Blur (핵심 문제 지점)
   ┌─────────────────────────────────────────────────────────────────┐
   │ Chromium ime_input.cc:                                         │
   │                                                                 │
   │   void ImeInput::DisableIME(HWND window_handle) {              │
   │     CleanupComposition(window_handle);                         │
   │     ImmAssociateContextEx(window_handle, NULL, 0);             │
   │   }                                                             │
   │                                                                 │
   │ → HIMC와 window의 연결이 해제됨                                 │
   │ → 또는 context가 "비활성화" 상태가 됨                           │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
5. 다시 Input에 Focus (문제 발생)
   ┌─────────────────────────────────────────────────────────────────┐
   │ Chromium:                                                       │
   │   ImmAssociateContextEx(window_handle, NULL, IACE_DEFAULT)     │
   │                                                                 │
   │ → "기본" context가 다시 연결됨                                  │
   │ → 기본 context의 conversion mode = 영문 (초기값)                │
   │                                                                 │
   │ 이전에 설정한 한글 모드가 사라짐!                               │
   └─────────────────────────────────────────────────────────────────┘
```

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

### 적용된 해결책 1: 영문 → 한글 자동 변환 (engToKor)

IME가 영문 상태여도 두벌식 키보드 배열로 입력하면 자동으로 한글로 변환됩니다.

#### 핵심 기능: 점진적 입력 지원

기존 문제: 영문 모드에서 "살전"을 입력하면 "사ㄹ저ㄴ"으로 잘못 조합됨

원인: onChange 이벤트마다 engToKor이 호출되는데, 이미 변환된 완성형 한글("사")과 새 영문("f")이 섞이면서 조합이 깨짐

해결: **완성형 한글을 자모로 분해한 후 재조합**

```typescript
// src/renderer/src/shared/lib/engToKor.ts

// 완성형 한글을 자모로 분해
const decomposeHangul = (char: string): string[] => {
  const code = char.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) {
    return [char]
  }

  const offset = code - 0xac00
  const choIndex = Math.floor(offset / (21 * 28))
  const jungIndex = Math.floor((offset % (21 * 28)) / 28)
  const jongIndex = offset % 28

  const result: string[] = []
  result.push(CHOSUNG[choIndex])

  // 복합 모음 분리
  const jung = JUNGSUNG[jungIndex]
  if (DOUBLE_JUNGSUNG_SPLIT[jung]) {
    result.push(...DOUBLE_JUNGSUNG_SPLIT[jung])
  } else {
    result.push(jung)
  }

  // 복합 종성 분리
  if (jongIndex > 0) {
    const jong = JONGSUNG[jongIndex]
    if (DOUBLE_JONGSUNG_SPLIT[jong]) {
      result.push(...DOUBLE_JONGSUNG_SPLIT[jong])
    } else {
      result.push(jong)
    }
  }

  return result
}

export function engToKor(input: string): string {
  if (!/[a-zA-Z]/.test(input)) {
    return input
  }

  // 영문 → 자모 변환 (완성형 한글은 분해)
  const jamos: string[] = []
  for (const char of input) {
    if (ENG_TO_JAMO[char]) {
      jamos.push(ENG_TO_JAMO[char])
    } else if (isCompleteHangul(char)) {
      jamos.push(...decomposeHangul(char))  // 완성형 한글 분해!
    } else {
      jamos.push(char)
    }
  }

  // 자모 조합...
}
```

#### 동작 흐름 (점진적 입력)

| 입력 | input 값 | engToKor 처리 | 결과 |
|------|----------|--------------|------|
| t | "t" | ㅅ | "ㅅ" |
| k | "ㅅk" | ㅅ+ㅏ → 사 | "사" |
| f | "사f" | 사→ㅅㅏ + ㄹ → 살 | "살" |
| w | "살w" | 살→ㅅㅏㄹ + ㅈ | "살ㅈ" |
| j | "살ㅈj" | ... + ㅓ → 살저 | "살저" |
| s | "살저s" | ... + ㄴ → 살전 | "살전" |

#### 적용 위치

```typescript
// src/renderer/src/App.tsx

import { engToKor } from './shared/lib'

<Footer
  // ...
  onBookChange={(value) => setBook(engToKor(value))}
  // ...
/>
```

### 적용된 해결책 2: Windows IME 설정 최적화 (선택)

환경설정(SettingsModal)에서 Windows 레지스트리 설정을 변경하여 IME 동작을 개선할 수 있습니다.

#### 구현

**Main Process (src/main/index.ts)**:

```typescript
const REGISTRY_PATH = 'HKCU\\Control Panel\\Input Method'
const REGISTRY_KEY = 'EnablePerThreadInputMethod'

// IME 설정 상태 확인
function getIMESettingStatus(): 'per-thread' | 'global' | 'not-windows' {
  if (process.platform !== 'win32') return 'not-windows'

  try {
    const result = execSync(`reg query "${REGISTRY_PATH}" /v ${REGISTRY_KEY}`, {
      encoding: 'utf-8',
      windowsHide: true
    })
    return result.includes('0x1') ? 'per-thread' : 'global'
  } catch {
    return 'per-thread'
  }
}

// IME 설정을 전역 모드로 변경
function setIMEToGlobal(): boolean {
  if (process.platform !== 'win32') return false

  try {
    execSync(`reg add "${REGISTRY_PATH}" /v ${REGISTRY_KEY} /t REG_SZ /d 0 /f`, {
      encoding: 'utf-8',
      windowsHide: true
    })
    return true
  } catch {
    return false
  }
}

// IPC 핸들러
ipcMain.handle('ime:getStatus', () => getIMESettingStatus())
ipcMain.handle('ime:setGlobal', () => setIMEToGlobal())
ipcMain.handle('ime:isWindows', () => process.platform === 'win32')
```

**Preload (src/preload/index.ts)**:

```typescript
const imeApi = {
  getStatus: () => ipcRenderer.invoke('ime:getStatus'),
  setGlobal: () => ipcRenderer.invoke('ime:setGlobal'),
  isWindows: () => ipcRenderer.invoke('ime:isWindows')
}

contextBridge.exposeInMainWorld('imeApi', imeApi)
```

**SettingsModal UI**:

Windows에서만 "한글 입력 최적화" 섹션이 표시되며, 현재 설정 상태를 확인하고 최적화 버튼을 통해 레지스트리를 변경할 수 있습니다. 변경 후 **재부팅이 필요**합니다.

#### 한계

레지스트리 설정은 **앱 간** IME 상태 공유를 제어하지만, **Chromium 내부**의 input 간 focus 이동 시 IME 리셋은 별개의 문제입니다. 따라서 engToKor 우회 방식이 더 효과적입니다.

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

## 변환 예시

| 영문 입력 | 한글 변환 | 설명 |
|----------|----------|------|
| `dy` | 요 | 요한복음 |
| `ckd` | 창 | 창세기 |
| `tkfwjs` | 살전 | 데살로니가전서 |
| `ele` | 딛 | 디도서 |
| `elawjs` | 딤전 | 디모데전서 |

## 한계점

- 영문 → 한글 변환은 **두벌식 키보드 배열**만 지원
- 세벌식 등 다른 키보드 배열은 미지원

---

## 관련 파일

- `src/renderer/src/shared/lib/engToKor.ts` - 영문 → 한글 변환 유틸리티 (점진적 입력 지원)
- `src/renderer/src/App.tsx` - 변환 함수 적용
- `src/renderer/src/widgets/Footer/Footer.tsx` - 책 이름 입력 input
- `src/main/index.ts` - Windows IME 레지스트리 관련 IPC 핸들러
- `src/preload/index.ts` - imeApi 브릿지
- `src/renderer/src/widgets/SettingsModal/SettingsModal.tsx` - IME 최적화 UI
