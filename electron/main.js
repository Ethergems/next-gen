const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
require('dotenv').config();

// Enhanced security and performance settings
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-hardware-overlays');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      additionalArguments: [
        `--e2b-api-key=${process.env.E2B_API_KEY}`,
        `--deep-ai-key=${process.env.DEEP_AI_API_KEY}`,
        `--hugging-face-key=${process.env.HUGGING_FACE_API_KEY}`,
        `--together-key=${process.env.TOGETHER_API_KEY}`
      ],
      spellcheck: false,
      enableWebSQL: false,
      autoplayPolicy: 'user-gesture-required'
    },
    backgroundColor: '#000000',
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../build/icon.ico'),
    autoHideMenuBar: true,
    darkTheme: true,
    paintWhenInitiallyHidden: true,
    thickFrame: true,
    visualEffectState: 'active'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  const startUrl = isDev 
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window state
  let isQuitting = false;

  app.on('before-quit', () => {
    isQuitting = true;
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Handle system events
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    mainWindow.show();
  });

  // Handle crashes and hangs
  app.on('render-process-gone', (event, webContents, details) => {
    console.error('Render process gone:', details);
    if (!isDev) {
      app.relaunch();
      app.exit(0);
    }
  });

  // Handle GPU process crashes
  app.on('gpu-process-crashed', (event, killed) => {
    console.error('GPU process crashed:', killed);
    if (!isDev) {
      app.relaunch();
      app.exit(0);
    }
  });
}

app.whenReady().then(createWindow);

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (!isDev) {
    app.relaunch();
    app.exit(1);
  }
});