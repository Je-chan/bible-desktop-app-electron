import { ElectronAPI } from '@electron-toolkit/preload'

interface BibleApi {
  getVerse: (version: string, book: number, chapter: number, verse: number) => Promise<string | null>
  getChapter: (version: string, book: number, chapter: number) => Promise<Array<{ verse: number; text: string }>>
  getMaxVerse: (version: string, book: number, chapter: number) => Promise<number>
}

interface Settings {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
}

interface SettingsApi {
  get: () => Promise<Settings>
  set: (settings: Partial<Settings>) => Promise<Settings>
}

interface FontsApi {
  list: () => Promise<string[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    bibleApi: BibleApi
    settingsApi: SettingsApi
    fontsApi: FontsApi
  }
}
