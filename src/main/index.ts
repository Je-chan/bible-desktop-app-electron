import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getVerse, getChapter, getMaxVerse } from './database'
import fontList from 'font-list'

// 설정 스토어
interface Settings {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
}

// electron-store는 ESM이므로 동적 import 필요
let store: any

const initStore = async () => {
  const Store = (await import('electron-store')).default
  store = new Store<Settings>({
    defaults: {
      backgroundColor: '#f8fafc', // slate-50
      fontFamily: 'serif',
      fontSize: 30,
      fontColor: '#1e293b' // slate-800
    }
  })
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Store 초기화
  await initStore()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Bible IPC handlers
  ipcMain.handle('bible:getVerse', (_, version, book, chapter, verse) => {
    return getVerse(version, book, chapter, verse)
  })

  ipcMain.handle('bible:getChapter', (_, version, book, chapter) => {
    return getChapter(version, book, chapter)
  })

  ipcMain.handle('bible:getMaxVerse', (_, version, book, chapter) => {
    return getMaxVerse(version, book, chapter)
  })

  // Settings IPC handlers
  ipcMain.handle('settings:get', () => {
    return store.store
  })

  ipcMain.handle('settings:set', (_, settings: Partial<Settings>) => {
    Object.entries(settings).forEach(([key, value]) => {
      store.set(key as keyof Settings, value)
    })
    return store.store
  })

  // 시스템 폰트 목록 가져오기
  ipcMain.handle('fonts:list', async () => {
    const fonts = await fontList.getFonts()
    // 따옴표 제거하고 정렬
    return fonts.map((f) => f.replace(/"/g, '')).sort()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
