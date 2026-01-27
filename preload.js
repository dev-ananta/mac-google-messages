const {
    contextBridge,
    ipcRenderer 
} = require("electron");

contextBridge.exposeInMainWorld("electron", {
    downloadDMG: (options) =>
        ipcRenderer.invoke("download-dmg", options),

    onDownloadProgress: (callback) =>
        ipcRenderer.on('download-progress', (event, progress) => callback(progress)),

    getLocalStorage: (key) => 
        ipcRenderer.invoke("get-local-storage", key),
    
    setLocalStorage: (key, value) => 
        ipcRenderer.send("set-local-storage", key, value),

    onNotificationClick: (callback) => {
        window.addEventListener("message", (event) => {
            if (event.data.type === "NOTIFICATION_CLICK") {
                callback();
            }
        });
    },
});

// Inject Custom CSS For Smoother Loading Experience Remixers!

const style = document.createElement("style");

style.textContent = `
    body {
        background-color: ${window.matchMedia("(prefers-color-scheme: dark)").matches ? "#1c1c1c" : "#ffffff"};
    }
`;

document.head.appendChild(style);