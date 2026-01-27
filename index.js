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