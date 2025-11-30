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

### Windows IME 특성

- Windows 한글 IME는 기본적으로 **영문 모드**로 시작
- input에 focus가 올 때마다 IME 상태가 초기화될 수 있음
- macOS는 시스템 레벨에서 입력 언어 상태를 유지하지만, Windows는 다르게 동작

### Electron/Chromium 동작

- Chromium에서는 focus를 받을 때마다 "IME와 TSF(Text Services Framework) bridge를 재초기화"하는 동작이 있음
- 이로 인해 Windows에서 input focus 시 IME 상태가 리셋될 수 있음

### 참고 자료

- [Simplenote Electron IME Issue](https://github.com/Automattic/simplenote-electron/issues/2522)
- [Electron IME Bug on Windows](https://github.com/electron/electron/issues/41393)

## 해결 방법

### 근본적 해결의 한계

브라우저/Electron에서 키보드 언어(IME)를 직접 제어할 방법이 없습니다. 이는 OS 레벨의 동작이기 때문입니다.

- `inputMode` 속성: 모바일 가상 키보드 타입 힌트만 제공, 데스크톱 IME에는 영향 없음
- `lang` 속성: 콘텐츠 언어 선언용, IME 동작 제어 불가
- CSS `ime-mode`: deprecated, Chrome/Electron에서 미지원

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
