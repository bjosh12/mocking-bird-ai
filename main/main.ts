import { app, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron';
import path from 'path';
import { dbHelpers } from './db';
import { cloudSync } from './cloud';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    console.log('Update available.');
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update ready',
      message: 'A new version is ready. Restart now to apply?',
      buttons: ['Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#ffffff',
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  // Register global hotkey to toggle stealth
  globalShortcut.register('Alt+C', () => {
    if (widgetWindow) {
      if (widgetWindow.isVisible()) {
        widgetWindow.hide();
      } else {
        widgetWindow.show();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window:toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Register DB IPC Handlers
ipcMain.handle('db:getSessions', () => dbHelpers.getSessions());
ipcMain.handle('db:createSession', (_, session) => dbHelpers.createSession(session));
ipcMain.handle('db:getSession', (_, id) => dbHelpers.getSession(id));
ipcMain.handle('db:saveTranscript', (_, transcript) => dbHelpers.saveTranscript(transcript));
ipcMain.handle('db:getTranscripts', (_, sessionId) => dbHelpers.getTranscripts(sessionId));
ipcMain.handle('db:saveAnswer', (_, answer) => dbHelpers.saveAnswer(answer));
ipcMain.handle('db:getAnswers', (_, sessionId) => dbHelpers.getAnswers(sessionId));
ipcMain.handle('db:getProfile', (_, userId) => dbHelpers.getProfile(userId));
ipcMain.handle('db:saveProfile', (_, profile) => dbHelpers.saveProfile(profile));
ipcMain.handle('db:getTemplates', () => dbHelpers.getTemplates());
ipcMain.handle('db:saveTemplate', (_, template) => dbHelpers.saveTemplate(template));
ipcMain.handle('db:deleteTemplate', (_, id) => dbHelpers.deleteTemplate(id));
ipcMain.handle('db:getDocuments', () => dbHelpers.getDocuments());
ipcMain.handle('db:saveDocument', (_, doc) => dbHelpers.saveDocument(doc));
ipcMain.handle('db:deleteDocument', (_, id) => dbHelpers.deleteDocument(id));

// Cloud Sync IPC Handlers
ipcMain.handle('cloud:signIn', (_, email, password) => cloudSync.signIn(email, password));
ipcMain.handle('cloud:signUp', (_, email, password, metadata) => cloudSync.signUp(email, password, metadata));
ipcMain.handle('cloud:signOut', () => cloudSync.signOut());
ipcMain.handle('cloud:getUser', () => cloudSync.getUser());
ipcMain.handle('cloud:getProfile', (_, userId) => cloudSync.getProfile(userId));
ipcMain.handle('cloud:getDocuments', (_, userId) => cloudSync.getDocuments(userId));
ipcMain.handle('cloud:syncDocument', (_, doc, userId) => cloudSync.syncDocument(doc, userId));
ipcMain.handle('cloud:deleteDocument', (_, id) => cloudSync.deleteDocument(id));
ipcMain.handle('cloud:syncSession', (_, session, userId) => cloudSync.syncSession(session, userId));
ipcMain.handle('cloud:incrementMinutes', (_, userId, minutes) => cloudSync.incrementMinutes(userId, minutes));
ipcMain.handle('cloud:checkTrial', (_, userId) => cloudSync.checkTrial(userId));
ipcMain.handle('cloud:verifyLicense', (_, key, machineId, userId) => cloudSync.verifyLicense(key, machineId, userId));

// Initialize electron-store
import Store from 'electron-store';
const store = new Store();

// Register Store IPC Handlers
ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, value) => {
  store.set(key, value);
});

import fs from 'fs';
const pdfParse = require('pdf-parse');

ipcMain.handle('file:parsePdf', async (_, filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw error;
  }
});

ipcMain.handle('url:fetch', async (_, url) => {
  return new Promise((resolve, reject) => {
    let win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    win.webContents.on('did-finish-load', async () => {
      try {
        const text = await win.webContents.executeJavaScript(`document.body.innerText`);
        win.destroy();
        resolve(text.replace(/\\s+/g, ' ').trim());
      } catch (err) {
        win.destroy();
        reject(err);
      }
    });

    win.webContents.on('did-fail-load', (_, _errorCode, errorDescription) => {
      win.destroy();
      reject(new Error(`Failed to load: ${errorDescription}`));
    });

    // Set a timeout just in case it hangs
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.destroy();
        reject(new Error("Timeout waiting for page to load."));
      }
    }, 15000);

    win.loadURL(url).catch(err => {
      if (!win.isDestroyed()) win.destroy();
      reject(err);
    });
  });
});

// --- Widget Logic ---
let widgetWindow: BrowserWindow | null = null;

ipcMain.handle('widget:open', () => {
  if (widgetWindow) {
    widgetWindow.show();
    return;
  }

  widgetWindow = new BrowserWindow({
    width: 450,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true, // Stealth
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    widgetWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#widget`);
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'widget' });
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
});

ipcMain.handle('widget:close', () => {
  if (widgetWindow) {
    widgetWindow.close();
    widgetWindow = null;
  }
});

ipcMain.on('widget:update', (_, text: string) => {
  if (widgetWindow) {
    widgetWindow.webContents.send('widget:onUpdate', text);
  }
});

ipcMain.on('widget:setOpacity', (_, opacity: number) => {
  if (widgetWindow) {
    widgetWindow.setOpacity(opacity);
  }
});

ipcMain.on('widget:setIgnoreMouseEvents', (_, ignore: boolean) => {
  if (widgetWindow) {
    widgetWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});
// ---------------------

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function getMachineId() {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execPromise('wmic csproduct get uuid');
      return stdout.split('\n')[1].trim();
    } else {
      const { stdout } = await execPromise('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID');
      return stdout.split('"')[3];
    }
  } catch (error) {
    console.error("Machine ID Error:", error);
    return 'unknown-hwid-' + process.platform;
  }
}

ipcMain.handle('license:getMachineId', async () => {
  return await getMachineId();
});

ipcMain.handle('license:verify', async (_, licenseKey: string) => {
  const machineId = await getMachineId();
  // We will call Supabase from the renderer for the actual check, 
  // but we provide the machineId here to the renderer.
  return { machineId, licenseKey };
});

ipcMain.handle('ping', () => 'pong');
