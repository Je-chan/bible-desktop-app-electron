# ESC 키 동작 명세서

## 개요

이 문서는 애플리케이션 내에서 ESC 키가 눌렸을 때의 동작을 정의합니다.
ESC 키는 "현재 상태에서 벗어나기"라는 일관된 의미를 가지며, 가장 안쪽(깊은) 레이어부터 순차적으로 닫습니다.

## 상태 요소

### 모달 (Modal)
- `SettingsModal`: 환경 설정
- `ScriptureRangeModal`: 본문 말씀 범위 설정
- `KeyboardShortcutsModal`: 단축키 안내

### 패널 (Panel)
- `SearchPanel`: 말씀 검색 사이드 패널
- `VersionComparePanel`: 역본 비교 사이드 패널

### 드롭다운 (Dropdown)
- 폰트 선택 드롭다운 (SettingsModal 내부)

### Input Focus
- Footer 입력창: 책(book), 장(chapter), 절(verse)
- SearchPanel 검색창: 키워드 입력, 시작/끝 책 입력
- Modal 내부 입력창: 폰트 검색, 범위 입력 등

---

## 우선순위

ESC 키는 다음 우선순위에 따라 **한 번에 하나의 동작만** 수행합니다:

```
1. 폰트 드롭다운 열림      → 드롭다운 닫기
2. Modal 열림             → Modal 닫기
3. Panel 내부 Input focus → Input blur
4. Panel 열림             → Panel 닫기
5. Footer Input focus     → Input blur
6. 아무것도 없음          → 아무 동작 안함
```

---

## 시나리오별 동작

### 기본 상태

| # | 현재 상태 | ESC 동작 | 결과 |
|---|----------|----------|------|
| 1 | 아무것도 없음, Focus 없음 | 없음 | 그대로 유지 |
| 2 | Footer Input focused | Input blur | Focus 해제, 방향키로 콘텐츠 조작 가능 |

### Modal 관련

| # | 현재 상태 | ESC 동작 | 결과 |
|---|----------|----------|------|
| 3 | Modal 열림 | Modal 닫기 | Modal 닫힘 |
| 4 | Modal 열림 + 내부 Input focused | Modal 닫기 | Modal 닫힘 |
| 5 | Modal 열림 + 폰트 드롭다운 열림 | 드롭다운 닫기 | 드롭다운만 닫힘, Modal 유지 |
| 6 | Modal + 드롭다운 + 검색 Input focused | 드롭다운 닫기 | 드롭다운만 닫힘, Modal 유지 |

### Panel 관련

| # | 현재 상태 | ESC 동작 | 결과 |
|---|----------|----------|------|
| 7 | SearchPanel 열림, Focus 없음 | Panel 닫기 | Panel 닫힘 |
| 8 | SearchPanel 열림 + 검색 Input focused | Input blur | Focus만 해제, Panel 유지 |
| 9 | SearchPanel 열림, Focus 없음 (8번 이후) | Panel 닫기 | Panel 닫힘 |
| 10 | VersionComparePanel 열림 | Panel 닫기 | Panel 닫힘 |

### 복합 상태

| # | 현재 상태 | ESC 동작 | 결과 |
|---|----------|----------|------|
| 11 | SearchPanel + Footer Input focused | Input blur | Footer focus 해제, Panel 유지 |
| 12 | Modal + Panel 열림 | Modal 닫기 | Modal만 닫힘, Panel 유지 |

---

## 사용자 시나리오 예시

### 시나리오 A: 검색 후 콘텐츠 탐색

```
1. Cmd+F로 SearchPanel 열기
2. "사랑"을 검색하여 결과 확인
3. 검색 Input에 커서가 있는 상태
4. ESC 누름 → Input blur (Panel 유지)
5. 방향키로 검색 결과 스크롤 또는 콘텐츠 탐색
6. ESC 다시 누름 → Panel 닫기
7. 메인 콘텐츠에서 방향키로 이전/다음 절 탐색
```

### 시나리오 B: 환경설정에서 폰트 변경

```
1. Footer에서 설정 버튼 클릭 → SettingsModal 열림
2. 폰트 종류 클릭 → 드롭다운 열림
3. "나눔"을 검색하여 폰트 찾기
4. ESC 누름 → 드롭다운 닫기 (Modal 유지)
5. ESC 다시 누름 → Modal 닫기
```

### 시나리오 C: Footer에서 구절 입력 후 콘텐츠 조작

```
1. Footer의 책 Input 클릭하여 focus
2. "요" 입력 후 장/절 입력
3. Enter로 검색 실행
4. 여전히 Input에 focus 있음
5. ESC 누름 → Input blur
6. 방향키 ↑↓로 폰트 크기 조절
7. 방향키 ←→로 이전/다음 절 이동
```

---

## 구현 가이드

### 이벤트 처리 순서

1. **Capture Phase (먼저 실행)**
   - Modal ESC 핸들러: `window.addEventListener('keydown', handler, true)`

2. **Bubbling Phase (나중에 실행)**
   - Panel ESC 핸들러
   - Global ESC 핸들러 (Footer blur 등)

### 핵심 원칙

1. **stopPropagation 사용**: 상위 우선순위에서 처리되면 하위로 전파하지 않음
2. **한 번에 하나씩**: ESC 한 번 = 한 단계만 처리
3. **Input blur 우선**: Panel/Modal 닫기보다 Input blur를 먼저 (사용자가 입력 중일 수 있음)

### 체크 순서 (Global Handler)

```typescript
function handleEscapeKey() {
  // 1. 드롭다운 체크 (Modal 내부에서 자체 처리)

  // 2. Modal 체크 (Capture phase에서 자체 처리)

  // 3. Panel 내부 Input focus 체크
  if (isPanelOpen && isPanelInputFocused) {
    blurPanelInput()
    return
  }

  // 4. Panel 체크
  if (isPanelOpen) {
    closePanel()
    return
  }

  // 5. Footer Input focus 체크
  if (isFooterInputFocused) {
    blurFooterInput()
    return
  }

  // 6. 아무것도 없음 - 동작 안함
}
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2024-XX-XX | 최초 작성 |
