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

// Settings API for renderer
const settingsApi = {
  get: () => ipcRenderer.invoke('settings:get'),
  set: (settings: { backgroundColor?: string; fontFamily?: string; fontSize?: number; fontColor?: string }) =>
    ipcRenderer.invoke('settings:set', settings)
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
}
