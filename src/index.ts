import { app, BrowserWindow, Menu, ipcMain, dialog, protocol, shell } from 'electron';
import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    icon: path.join(app.getAppPath(), 'app/resources/icon.png'),
    title: 'Application is currently initializing...',

    webPreferences: {
      devTools: !app.isPackaged,
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      // The path is getting file path from inside .webpack folder
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

   // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    const [, filePath] = process.argv;
    
    // Only read file in app init when builded
    if(app.isPackaged) {
      const resolvedPath = path.resolve(filePath);

      loadFile(resolvedPath);
    }
  });

  // Open the DevTools.
  app.isPackaged || mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  createWindow();

  protocol.registerFileProtocol('atom', (request, cb) => {
    const url = request.url.substr(6);

    cb({ path: path.normalize(decodeURI(url)) });
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: 'CmdOrCtrl+O',
        click() {
          openFile();
        },
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      // Typescript not recognizing the value of role
      ...(!app.isPackaged ? [] : [{ role: 'toggleDevTools' } as { role: 'toggleDevTools' }]),
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          await shell.openExternal('https://github.com/edumudu/tundra-player');
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Open File
function openFile() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] }],
  });

  if(!files) return;
  
  const [filePath] = files;

  loadFile(filePath);
}

function loadFile(filePath: string | undefined) {
  if(!filePath) return;

  mainWindow.webContents.send('fileOpened', filePath);
}

ipcMain.on('hideWindow', () => mainWindow.hide());
ipcMain.on('showWindow', () => mainWindow.show());
