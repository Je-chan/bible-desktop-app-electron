import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Bible API for renderer
const bibleApi = {
  getVerse: (version: string, book: number, chapter: number, verse: number) =>
    ipcRenderer.invoke('bible:getVerse', version, book, chapter, verse),

  getChapter: (version: string, book: number, chapter: number) =>
    ipcRenderer.invoke('bible:getChapter', version, book, chapter),

  getMaxVerse: (version: string, book: number, chapter: number) =>
    ipcRenderer.invoke('bible:getMaxVerse', version, book, chapter)
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
}
