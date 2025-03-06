import { ElectronAPI } from '@electron-toolkit/preload'

interface SearchResult {
  book: number
  chapter: number
  verse: number
  text: string
}

interface BibleApi {
  getVerse: (
    version: string,
    book: number,
    chapter: number,
    verse: number
  ) => Promise<string | null>
  getChapter: (
    version: string,
    book: number,
    chapter: number
  ) => Promise<Array<{ verse: number; text: string }>>
  getMaxVerse: (version: string, book: number, chapter: number) => Promise<number>
  search: (
    version: string,
    keywords: string[],
    startBook?: number,
    endBook?: number,
    limit?: number,
    offset?: number
  ) => Promise<SearchResult[]>
  searchCount: (
    version: string,
    keywords: string[],
    startBook?: number,
    endBook?: number
  ) => Promise<number>
  countVersesInRange: (
    version: string,
    startBook: number,
    startChapter: number,
    startVerse: number,
    endBook: number,
    endChapter: number,
    endVerse: number
  ) => Promise<number>
  getVerseIndexInRange: (
    version: string,
    bookNumber: number,
    chapter: number,
    verse: number,
    startBook: number,
    startChapter: number,
    startVerse: number
  ) => Promise<number>
}

interface Settings {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  paddingY: number
  headerFontSize: number
  headerPaddingY: number
  headerAlign: 'left' | 'center' | 'right'
  viewMode: 'verse' | 'chapter' | 'focus'
  responsiveReadingColors: { leader: string; congregation: string; unison: string }
}

interface SettingsApi {
  getInitial: () => Settings
  get: () => Promise<Settings>
  set: (settings: Partial<Settings>) => Promise<Settings>
}

interface FontsApi {
  list: () => Promise<string[]>
}

interface ImeApi {
  getStatus: () => Promise<'per-thread' | 'global' | 'not-windows'>
  setGlobal: () => Promise<boolean>
  isWindows: () => Promise<boolean>
}

interface WindowApi {
  isKiosk: () => Promise<boolean>
  toggleKiosk: () => Promise<boolean>
  setKiosk: (value: boolean) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    bibleApi: BibleApi
    settingsApi: SettingsApi
    fontsApi: FontsApi
    imeApi: ImeApi
    windowApi: WindowApi
  }
}
