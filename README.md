<div align="center">

# 📖 성경 데스크톱 앱

**예배와 묵상을 위한 미니멀 성경 뷰어**

[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<br />

*말씀을 크게 표시하고, 키보드만으로 빠르게 탐색하세요.*

</div>

<br />

## ✨ 주요 기능

| 기능 | 설명 |
|:-----|:-----|
| 🔤 **구절 표시** | 책-장-절을 입력하여 원하는 말씀을 화면 가득 표시 |
| 📚 **16개 역본** | 개역한글, 개역개정, 새번역, NIV, NKJV 등 다양한 역본 |
| ⚖️ **역본 비교** | 두 역본을 나란히 비교하며 읽기 |
| 🔍 **키워드 검색** | 최대 3개 키워드로 말씀 검색 (AND 조건) |
| 📑 **본문 말씀** | 오늘의 본문 범위를 지정하고 단축키로 빠르게 이동 |
| 🎨 **커스터마이징** | 배경색, 폰트, 글자 크기, 여백 등 자유롭게 설정 |
| ⌨️ **키보드 중심** | 마우스 없이 키보드만으로 모든 기능 사용 |

<br />

## 🚀 시작하기

### 설치

```bash
# 의존성 설치
pnpm install

# 네이티브 모듈 (better-sqlite3) 리빌드
pnpm exec electron-rebuild

# 개발 서버 실행
pnpm dev
```

> **Note**: `better-sqlite3`는 네이티브 모듈이라 Electron 버전에 맞게 리빌드가 필요합니다.

### 빌드

```bash
pnpm run build:mac    # macOS
pnpm run build:win    # Windows
pnpm run build:linux  # Linux
```

<br />

## 📖 사용법

### 구절 탐색

하단 입력창에 **책-장-절**을 입력하고 `Enter`

```
요 3 16   →   요한복음 3장 16절
창 1 1    →   창세기 1장 1절
롬 8 28   →   로마서 8장 28절
```

<br />

### ⌨️ 키보드 단축키

<details>
<summary><b>역본 변경</b> — <code>Alt + 알파벳</code></summary>

<br />

| 단축키 | 역본 | 단축키 | 역본 |
|:------:|:-----|:------:|:-----|
| `Alt + R` | 개역한글 | `Alt + N` | NIV2011 |
| `Alt + W` | 개역개정 | `Alt + M` | NIV1984 |
| `Alt + S` | 새번역 | `Alt + K` | NKJV |
| `Alt + E` | 쉬운성경 | `Alt + C` | 바른성경 |
| `Alt + Z` | 한글킹 | `Alt + A` | 우리말 |
| `Alt + G` | 현대인 | `Alt + Q` | 쉬운말 |
| `Alt + X` | 킹흠정역 | `Alt + V` | 베트남 |
| `Alt + F` | 현대어 | `Alt + B` | 베트남2 |

</details>

<details>
<summary><b>화면 조절</b></summary>

<br />

| 단축키 | 동작 |
|:------:|:-----|
| `↑` | 글자 크기 증가 |
| `↓` | 글자 크기 감소 |
| `←` | 이전 절 |
| `→` | 다음 절 |

</details>

<details open>
<summary><b>주요 기능</b></summary>

<br />

| 단축키 | 동작 |
|:------:|:-----|
| `Cmd/Ctrl + C` | 현재 구절 복사 |
| `Cmd/Ctrl + F` | 말씀 검색 패널 |
| `Cmd/Ctrl + B` | 역본 비교 패널 |
| `Alt + Shift + 알파벳` | 해당 역본으로 비교 |
| `Cmd/Ctrl + Shift + C` | 본문 말씀으로 이동 |
| `ESC` | 패널 닫기 / 포커스 해제 |

</details>

<br />

### ⚖️ 역본 비교

1. `Cmd/Ctrl + B` — 비교 패널 열기
2. `Alt + Shift + 알파벳` — 비교할 역본 선택
3. 화면이 분할되어 두 역본을 나란히 표시

<br />

### 🔍 말씀 검색

1. `Cmd/Ctrl + F` — 검색 패널 열기
2. 키워드 입력 (최대 3개, AND 조건)
3. 역본과 검색 범위 선택
4. 결과 클릭하여 해당 구절로 이동

<br />

### 📑 본문 말씀

1. 하단의 📖 버튼 클릭
2. 시작/끝 구절 입력 (예: 요한복음 3:1 ~ 3:21)
3. `Cmd/Ctrl + Shift + C`로 언제든 본문으로 복귀

<br />

## 🛠 기술 스택

<table>
<tr>
<td align="center" width="100">
<img src="https://techstack-generator.vercel.app/react-icon.svg" width="48" height="48" alt="React" />
<br /><sub><b>React</b></sub>
</td>
<td align="center" width="100">
<img src="https://techstack-generator.vercel.app/ts-icon.svg" width="48" height="48" alt="TypeScript" />
<br /><sub><b>TypeScript</b></sub>
</td>
<td align="center" width="100">
<img src="https://www.vectorlogo.zone/logos/electronjs/electronjs-icon.svg" width="48" height="48" alt="Electron" />
<br /><sub><b>Electron</b></sub>
</td>
<td align="center" width="100">
<img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" width="48" height="48" alt="Tailwind" />
<br /><sub><b>Tailwind</b></sub>
</td>
<td align="center" width="100">
<img src="https://raw.githubusercontent.com/pmndrs/zustand/main/bear.jpg" width="48" height="48" alt="Zustand" style="border-radius: 8px" />
<br /><sub><b>Zustand</b></sub>
</td>
</tr>
</table>

- **electron-vite** — 빠른 개발 환경
- **better-sqlite3** — 성경 데이터베이스
- **electron-store** — 설정 저장
- **zod** — 입력 유효성 검사

<br />

## 🔧 트러블슈팅

<details>
<summary><b>Electron 바이너리 다운로드 실패</b></summary>

<br />

`pnpm install` 후 Electron 바이너리가 제대로 다운로드되지 않은 경우:

```bash
node node_modules/electron/install.js
```

</details>

<details>
<summary><b>네이티브 모듈 (better-sqlite3) 오류</b></summary>

<br />

`MODULE_NOT_FOUND` 또는 `was compiled against a different Node.js version` 오류 시:

```bash
# Electron 버전에 맞게 리빌드
pnpm exec electron-rebuild

# 그래도 안 되면 node_modules 삭제 후 재설치
rm -rf node_modules
pnpm install
pnpm exec electron-rebuild
```

</details>

<details>
<summary><b>빌드 도구 관련 오류 (node-gyp)</b></summary>

<br />

네이티브 모듈 컴파일에 필요한 빌드 도구가 없는 경우:

**macOS**
```bash
xcode-select --install
```

**Windows**
```bash
# 관리자 권한 PowerShell에서 실행
npm install -g windows-build-tools
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt-get install build-essential python3
```

</details>

<details>
<summary><b>macOS에서 앱이 실행되지 않음</b></summary>

<br />

빌드된 앱이 "손상되었습니다" 또는 실행이 안 될 때:

```bash
# 앱에 대한 격리 속성 제거
xattr -cr /Applications/성경.app
```

또는 시스템 설정 > 개인 정보 보호 및 보안에서 "확인 없이 열기" 선택

</details>

<details>
<summary><b>데이터베이스 파일을 찾을 수 없음</b></summary>

<br />

`resources/bible/` 폴더에 성경 데이터베이스 파일(`.bdb`)이 있는지 확인하세요.

```
resources/
└── bible/
    ├── 개역한글.bdb
    ├── 개역개정.bdb
    ├── NIV2011.bdb
    └── ...
```

</details>

<br />

## 📄 라이선스

[MIT](LICENSE) © 2024
