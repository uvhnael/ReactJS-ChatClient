const { app, BrowserWindow } = require('electron');
const path = require('path');

async function createWindow() {
    const isDev = (await import('electron-is-dev')).default; // Sử dụng import động

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    if (isDev) {
        win.loadURL('http://localhost:2024');
    } else {
        win.loadFile(path.join(__dirname, 'build', 'index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
