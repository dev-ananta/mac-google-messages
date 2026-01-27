// Constants
const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    globalShortcut,
    screen,
    ipcMain,
    shell,
    nativeTheme,
} = require("electron");

const path = require("path");
const Store = require("electron-store");

const store = new Store();
let tray, mainWindow;
const iconPath = path.join(__dirname, "icon.icns");
const appName = "Google Messages";

// Functions

function exec(code) {
    return mainWindow.webContents.executeJavaScript(code).catch(console.error);
}

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const winWidth = store.get(
        "windowWidth",
        Math.min(1200, Math.round(width * 0.8)),
    );

    const winHeight = store.get(
        "windowHeight",
        Math.min(900, Math.round(height * 0.8)),
    );

    mainWindow = new BrowserWindow ({
        width: winWidth,
        height: winHeight,
        x: store.get("windowX"),
        y: store.get("windowY"),
        frame: process.platform !== "darwin",
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        vibrancy: process.platform === "darwin" ? "under-window" : undefined,
        visualEffectState: "active",
        trafficLightPosition: { x: 18, y: 18 },
        maximizable: true,
        resizable: true,
        center: true,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration:false,
        },
        icon: iconPath,
        backgroundColor: "#00000000",
    });

    mainWindow.loadURL("https://messages.google.com/web/conversations");

    mainWindow.webContents.on("did-finish-load", optimizePage);

    mainWindow.on("close", (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on("resize", () => {
        const { x, y, width, height } = mainWindow.getBounds();

        store.set("windowX", x);
        store.set("windowY", y);
        store.set("windowWidth", width);
        store.set("windowHeight", height);
    });

    setupNotifications();
}

function setupNotifications() {
    exec(`
        const originalNotification = Notification;

        Notification = function(title, options) {
            const notification = new originalNotification(title, options);

            notification.addEventListener('click', () => {
                window.postMessage({ type: 'NOTIFICATION_CLICK' }, '*')
            });

            return notification;
        };

        Notification.requestPermission = originalNotification.requestPermission;
        Notification.permission = originalNotification.permission;
    `);

    mainWindow.webContents.on("ipc-message", (event, channel) => {
        if (channel === "NOTIFICATION_CLICK") {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function optimizePage() {
    const isDarkMode = nativeTheme.shouldUseDarkColors;

    exec(`
        const style = document.createElement('style');

        style.textContent = \`
            body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                ${process.platform === "darwin" ? "padding-top: 24px;" : ""}
            }
            
            /* Add Custom Styles For Better Native Feel Remixers! */

            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            ::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, ${isDarkMode ? "0.5" : "0.3"});
                border-radius: 4px;
            }

            ::-webkit-scrollbar-track {
                background-color: transparent;
            }
        \`;

        document.head.appendChild(style);

        // Implement Custom Behaviors/Optimizations Here Remixers!
    `);
}

function toggleWindow() {
    if (mainWindow.isVisible()) mainWindow.hide();
    else {
        mainWindow.show();
        mainWindow.focus();
    }
}

function createTray() {
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        { label: "Show/Hide Window", click: toggleWindow },
        { type: "separator" },
        { label: "Check for Updates", click: checkForUpdates },
        { type: "separator" },
        {
            label: "Quit",

            click: () => {
                app.isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip(appName);
    tray.setContextMenu(contextMenu);
    tray.on("click", toggleWindow);
}

function createMenu() {
    const template = [
        {
            label: app.name,
            
            submenu: [
                { role: "about" },
                { type: "separator" },
                { label: "Check for Updates", click: checkForUpdates },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { type: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
            ],
        },

        {
            label: "Edit",

            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "delete" },
                { role: "selectAll" },
            ],
        },

        {
            label: "View",

            submenu: [
                { role: "reload" },
                { role: "forcedReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },

        {
            label: "Window",

            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                { type: "separator" },
                { role: "front" },
                { type: "separator" },
                { role: "window" },
            ],
        },

        {
            label: "Help",

            submenu: [
                {
                    label: "Download Google Messages Installer",
                    click: () => createDownloadWindow(),
                },
                { type: "separator" },
                {
                    label: "Learn More",

                    click: () =>
                        shell.openExternal("https://messages.google.com/web/conversations"),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function setupShortcuts() {
    globalShortcut.register("CommandOrControl+Shift+M", toggleWindow);
}
function checkForUpdates() {
    console.log("Checking for updates...");
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    createMenu();
    setupShortcuts();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
        else mainWindow.show();
    });

    // Setup Dock Menu

    if (process.platform === "darwin") {
        app.setAboutPanelOptions({
            applicationName: appName,
            applicationVersion: app.getVersion(),
            copyright: "Copyright © Ananta the Developer 2026",
            version: "Tahoe 26.2 (M4 Optimized)",
        });

        app.dock.setMenu(
            Menu.buildFromTemplate([
                { label: "Show/Hide Window", click: toggleWindow },
            ]),
        );
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
    app.isQuitting = true;
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

nativeTheme.on("updated", () => {
    if (process.platform !== "darwin") {
        mainWindow.setBackgroundColor(
            nativeTheme.shouldUseDarkColors ? "#1c1c1c" : "#ffffff",
        );
    }

    optimizePage();
});

ipcMain.handle("get-local-storage", (event, key) => {
    return store.get(key);
});

ipcMain.on("set-local-storage", (event, key, value) => {
     store.set(key, value);
});

// Dowmload Window Code:

const { getSystemInfo } = require('./system-detector');

function createDownloadWindow() {
    const systemInfo = getSystemInfo();

    const downloadWindow = new BrowserWindow({
        width: 600,
        height: 500,
        modal: true,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const html = `
        <!DOCTYPE html>
        
        <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI';
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #ececec, #f5f5f5);
                    } 

                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        max-width: 500px;
                    }
                        
                    h1 { color: #333; margin-top: 0; }

                    .info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    
                    .option { margin: 20px 0; }
                    .option input[type="radio"] { margin-right: 10px; }

                    button {
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                        width: 100%;
                    }
                    
                    button:hover { background: #5568d3; }
                </style>
            </head>

            <body>
                <div class="container">
                    <h1>Download Google Messages</h1>
                    
                    <div class="info">
                        <strong>Detected System:</strong><br>
                        Architecture: ${systemInfo.archLabel}<br>
                        macOS: ${systemInfo.osVersion}
                    </div>

                    <h3>Select Version</h3>

                    <div class="option">
                        <input type="radio" name="arch" value="auto" checked id="auto">
                        <label for="auto">Auto-Select (${systemInfo.archLabel})</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="arch" value="arm64" id="arm64">
                        <label for="arm64">Force Apple Silicon</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="arch" value="x64" id="x64">
                        <label for="x64">Force Intel</label>
                    </div>

                    <h3>macOS Version</h3>

                    <div class="option">
                        <input type="radio" name="osVersion" value="auto" checked id="osAuto">
                        <label for="osAuto">Auto-Select (${systemInfo.osVersion})</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="osVersion" value="Tahoe" id="tahoe">
                        <label for="tahoe">Tahoe 26.2</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="osVersion" value="Sequoia" id="sequoia">
                        <label for="sequoia">Sequoia</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="osVersion" value="Sonoma" id="sonoma">
                        <label for="sonoma">Sonoma</label>
                    </div>

                    <div class="option">
                        <input type="radio" name="osVersion" value="Ventura" id="ventura">
                        <label for="ventura">Ventura</label>
                    </div>

                    <button onclick="downloadInstaller()">Download DMG</button>
                </div>

                <script>
                    async function downloadInstaller() {
                        const arch = document.querySelector('input[name="arch"]:checked').value;
                        const osVersion = document.querySelector('input[name="osVersion"]:checked').value;

                        window.electron.downloadDMG({
                            architecture: arch,
                            osVersion: osVersion
                        })
                    }
                </script>
            </body>
        </html>
    `;

    downloadWindow.loadURL(`data:text/html;charset=utf-8, ${encodeURIComponent(html)}`);

    return downloadWindow;
}

// IPC Handlers for Downloading DMG

const axios = require("axios");
const { app: electronApp } = require("electron");
const path = require("path");
const fs = require("fs");

ipcMain.handle("download-dmg", async (event, options) => {
    const { architecture, osVersion } = options;
    const systemInfo = getSystemInfo();
    
    // Use user selection or default to system info
    const finalArch = architecture === "auto" ? systemInfo.architecture : architecture;
    const finalOS = osVersion === "auto" ? systemInfo.osVersion : osVersion;

    // Build download URL from GitHub releases
    const repoOwner = "aparikh1"; // Update with your GitHub username
    const repoName = "mac-google-messages";
    const downloadURL = `https://github.com/${repoOwner}/${repoName}/releases/download/latest/google-messages-${finalArch}-${finalOS}.dmg`;
    
    const downloadsPath = electronApp.getPath("downloads");
    const fileName = `google-messages-${finalArch}-${finalOS}.dmg`;
    const filePath = path.join(downloadsPath, fileName);

    try {
        const response = await axios.get(downloadURL, {
            responseType: 'stream',

            onDownloadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );

                event.sender.send('download-progress', percentCompleted);
            }
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                // Auto-mount DMG to show installer
                require('child_process').exec(`open "${filePath}"`);
                resolve({ success: true, path: filePath });
            });

            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
});

