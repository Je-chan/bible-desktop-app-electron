import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Bible API for renderer
const bibleApi = {
  getVerse: (version: string, book: number, chapter: number, verse: number) =>
    ipcRenderer.invoke('bible:getVerse', version, book, chapter, verse),

  getChapter: (version: string, book: number, chapter: number) =>
    ipcRenderer.invoke('bible:getChapter', version, book, chapter),

  getMaxVerse: (version: string, book: number, chapter: number) =>
    ipcRenderer.invoke('bible:getMaxVerse', version, book, chapter),

  search: (
    version: string,
    keywords: string[],
    startBook?: number,
    endBook?: number,
    limit?: number,
    offset?: number
  ) =>
    ipcRenderer.invoke('bible:search', version, keywords, startBook, endBook, limit, offset) as Promise<
      Array<{ book: number; chapter: number; verse: number; text: string }>
    >,

  searchCount: (version: string, keywords: string[], startBook?: number, endBook?: number) =>
    ipcRenderer.invoke('bible:searchCount', version, keywords, startBook, endBook) as Promise<number>
}

// Settings - 동기적으로 초기 설정 로드 (렌더러 시작 시 즉시 사용 가능)
const initialSettings = ipcRenderer.sendSync('settings:getSync') as {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  paddingY: number
  headerFontSize: number
}

// Settings API for renderer
const settingsApi = {
  getInitial: () => initialSettings,
  get: () => ipcRenderer.invoke('settings:get'),
  set: (settings: {
    backgroundColor?: string
    fontFamily?: string
    fontSize?: number
    fontColor?: string
    paddingX?: number
    paddingY?: number
    headerFontSize?: number
  }) => ipcRenderer.invoke('settings:set', settings)
}

// Fonts API for renderer
const fontsApi = {
  list: () => ipcRenderer.invoke('fonts:list') as Promise<string[]>
}

// IME API for renderer (Windows IME 설정 관련)
const imeApi = {
  getStatus: () => ipcRenderer.invoke('ime:getStatus') as Promise<'per-thread' | 'global' | 'not-windows'>,
  setGlobal: () => ipcRenderer.invoke('ime:setGlobal') as Promise<boolean>,
  isWindows: () => ipcRenderer.invoke('ime:isWindows') as Promise<boolean>
}

// Window API for renderer (창 모드 관련)
const windowApi = {
  isKiosk: () => ipcRenderer.invoke('window:isKiosk') as Promise<boolean>,
  toggleKiosk: () => ipcRenderer.invoke('window:toggleKiosk') as Promise<boolean>,
  setKiosk: (value: boolean) => ipcRenderer.invoke('window:setKiosk', value) as Promise<boolean>
}

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('bibleApi', bibleApi)
    contextBridge.exposeInMainWorld('settingsApi', settingsApi)
    contextBridge.exposeInMainWorld('fontsApi', fontsApi)
    contextBridge.exposeInMainWorld('imeApi', imeApi)
    contextBridge.exposeInMainWorld('windowApi', windowApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.bibleApi = bibleApi
  // @ts-ignore (define in dts)
  window.settingsApi = settingsApi
  // @ts-ignore (define in dts)
  window.fontsApi = fontsApi
  // @ts-ignore (define in dts)
  window.imeApi = imeApi
  // @ts-ignore (define in dts)
  window.windowApi = windowApi
}
