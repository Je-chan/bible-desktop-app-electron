# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server with HMR
pnpm dev

# Type checking
pnpm run typecheck           # Both main and renderer
pnpm run typecheck:node      # Main process only
pnpm run typecheck:web       # Renderer process only

# Lint and format
pnpm run lint
pnpm run format

# Build for production
pnpm run build:mac           # macOS
pnpm run build:win           # Windows
pnpm run build:linux         # Linux
```

## Architecture

This is an Electron desktop app for Bible verse lookup, built with React and TypeScript using electron-vite.

### Process Structure

- **Main process** (`src/main/index.ts`): Electron app lifecycle, window management, IPC handlers
- **Preload** (`src/preload/index.ts`): Bridge between main and renderer with contextBridge
- **Renderer** (`src/renderer/`): React UI with Tailwind CSS

### Feature-Sliced Design (Renderer)

- `features/` - Feature modules with business logic hooks
  - `verse-navigation/` - 책/장/절 탐색
  - `verse-search/` - 성경 검색
  - `version-switch/` - 역본 전환
- `widgets/` - UI 컴포넌트 (Header, Footer, VerseContent, SettingsModal)
- `shared/` - 공유 코드 (config, hooks, lib)

### IPC Channels

- `bible:getVerse`, `bible:getChapter`, `bible:getMaxVerse` - 성경 데이터 조회
- `settings:get`, `settings:set` - 설정 저장/불러오기 (electron-store)
- `fonts:list` - 시스템 폰트 목록

### Database

- **SQLite**: better-sqlite3 for synchronous, fast database access
- **Database files**: `resources/bible/*.bdb` (e.g., `개역한글.bdb`)
- **Schema**: `Bible` table with columns `book`, `chapter`, `verse`, `btext`
- **Access pattern**: Main process (`src/main/database.ts`) → IPC → Renderer

### Key Technologies

- **State management**: Zustand (`src/renderer/src/store/useBibleStore.ts`)
- **Database**: better-sqlite3 with DB instance caching
- **Styling**: Tailwind CSS with custom primary colors
- **Build**: electron-vite with electron-builder for distribution

### Path Aliases

- `@renderer` → `src/renderer/src` (configured in electron.vite.config.ts)

### Notes

- UI language is Korean
- Default Bible version: `개역한글`
- Bible books defined in `src/renderer/src/data/bibleBooks.ts` with id, name, abbr, chapters
- Version shortcodes in `src/renderer/src/shared/config/versionMap.ts` (e.g., `r` → `개역한글`, `n` → `NIV2011`)
- Recent searches stored in Zustand (in-memory), settings persisted via electron-store