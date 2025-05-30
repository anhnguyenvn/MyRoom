import { app, BrowserWindow, shell, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { update } from './update';
import template from './menuTemplate';
import fs from 'fs';
import path from 'path';
import * as ELogger from 'electron-log';
import { Constants } from 'client-core/assetSystem/constants';
import sharp from 'sharp';


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
// if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

let targetDir: string = "";
if (process.argv.length > 1) {
  targetDir = process.argv[1];

  if (targetDir && targetDir != ".") {
    app.disableHardwareAcceleration();
  }
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: 1100,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  if (url) { // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    //win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Apply electron-updater
  update(win);

  await new Promise(resolve => setTimeout(resolve, 5000));

  //컴맨드 라인 지원
  let targetDir: string = "";
  if (process.argv.length > 1) {
    targetDir = process.argv[1];
  }

  if (targetDir && targetDir != ".") {
    ELogger.log("TargetDir =" + targetDir);
    const itemDir = targetDir;
    const dir = path.basename(itemDir);
    const modelFilePath = path.join(itemDir, `${dir.toString()}.glb`);
    const manifestFilePath = path.join(itemDir, Constants.MANIFEST_FILENAME);
    if (fs.existsSync(modelFilePath)) {
      win.webContents.send('babylon:generateIcons', [modelFilePath], true);
    }
    else if (fs.existsSync(manifestFilePath)) {
      win.webContents.send('babylon:generateIcons', [manifestFilePath], true);
    }
  }
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

//-------------------------------------------------------------------
//ipc Handler 등록
//-------------------------------------------------------------------
ipcMain.handle('electron:readJsonFile', async (event, configFilePath) => {
  if (fs.existsSync(configFilePath)) {
    const buffer = fs.readFileSync(configFilePath);
    return JSON.parse(buffer.toString());
  }
  return undefined;

});

ipcMain.handle('electron:readModelFile', async (event, modelFilePath) => {
  if (fs.existsSync(modelFilePath)) {
    return fs.readFileSync(modelFilePath);
  }
  return undefined;
});

ipcMain.handle('electron:saveIconFile', async (event, dir, data, iconSize) => {
  const iconFilePath = path.join(dir, Constants.THUMBNAIL_FILENAME);
  await sharp(data).resize(iconSize, iconSize).toFile(iconFilePath); //==> 방팀장님 아이콘 찍는 방식 : sandbox에서 screenshot 잡아서 resize 한다.. ==> 그래서 그냥 1024로 찍어서 resize 한다.

  //fs.writeFileSync(iconFilePath, data);
  ELogger.log('babylon:logger:log', `Icon File Saved : ${iconFilePath}`);
  event.sender.send('babylon:logger:log', `Icon File Saved : ${iconFilePath}`);
});

ipcMain.handle('electron:openFolder', async (event, dir) => {
  shell.openPath(dir);
});

ipcMain.handle('electron:saveConfigFile', async (event, dir, data) => {
  const configFilePath = path.join(dir, "generate-icon-config.json");
  fs.writeFileSync(configFilePath, data);
  event.sender.send('babylon:logger:log', `Config File Saved : ${configFilePath}`);
});

ipcMain.handle('electron:quit', async (event) => {
  app.quit();
});

ipcMain.handle('electron:exit', async (event, exitCode) => {
  app.exit(exitCode);
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
})

