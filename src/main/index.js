import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import logger from './log'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../logo/icon.png?asset'
import { initDatabase, closeDb } from './database'
import { registerAllIpc } from './ipc'
import { ensureDir } from './utils'
import { getAppRootPath } from './ipc/file.ipc'
import { registerChromaDbLifecycle, startChromaDb } from './database/chroma'
import { getMachineId } from 'native-machine-id'
import { models } from './database/services'

logger.info('=== app starting ===')
logger.info('=== init directory ===')
ensureDir(path.join(getAppRootPath(), 'temp'))
ensureDir(path.join(getAppRootPath(), 'outputs'))

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 1280,
    minHeight: 960,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d0d18',
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools({
        mode: 'detach'
      })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('did-finish-load')

    setTimeout(() => {
      getMachineId().then((hashedId) => {
        global.deviceId = hashedId
        models.config.set('auth.deviceId', hashedId, 'auth', 'PC端设备ID')
      })
    })
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/login`)
    // mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}



function createWindow2() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 1280,
    minHeight: 960,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d0d18',
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools({
        mode: 'detach'
      })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('did-finish-load')

    setTimeout(() => {
      getMachineId().then((hashedId) => {
        global.deviceId = hashedId
        models.config.set('auth.deviceId', hashedId, 'auth', 'PC端设备ID')
      })
    })
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {

    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  logger.info('app ready, initializing...')
  // 启动 ChromaDB
  startChromaDb()
  registerChromaDbLifecycle()

  electronApp.setAppUserModelId('com.electron')

  initDatabase()
  logger.info('database initialized')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // 所有 IPC 通道已拆分到 src/main/ipc/ 下，统一通过 registerAllIpc 注册
  registerAllIpc(ipcMain)

  createWindow()
  createWindow2()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  logger.info('window-all-closed, closing database')
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
