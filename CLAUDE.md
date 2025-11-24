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
- Recent searches stored in Zustand (in-memory, not persisted)