# Google Messages for Mac

## Project Information

A simple computer ("Macintosh") application that takes the official Google Messages web application and transforms it into an actual application installed on your computer ("Macintosh").

#### Disclaimer: Unofficial Electron-based Wrapper for Google Messages

## Project Specifications

```
mac-google-messages/
│── README.md → Documentation & Information
│── LICENSE.md → License pertaining to Copyright Information revolving this project/repository.
│── index.js → Primary App Entry Point
│── preload.js → Security Bridge
│── package.json → Project Config File
│── system-detecter.js → System Detector File
│── /github
│     └──  /workflows
│            └── build.yml → GitHub Action File; Processes & Maintains Releases.
│── /icons
│     └──  (Icons & Assets Located Here)

```

- **index.js** — The main application entry point. It creates and manages the Electron window, loads the Google Messages web app, handles window state persistence (position and size), manages desktop notifications, and sets up global keyboard shortcuts (Cmd+Shift+M) and tray icon functionality.

- **preload.js** — A security bridge between the renderer process and main process. It exposes safe APIs to the web app through `contextBridge`, including local storage access and notification click handlers. It also injects custom CSS for light/dark mode styling.

- **package.json** — Project configuration file that defines metadata (name, version, description), build scripts, dependencies (Electron and electron-builder), and build settings for creating macOS distributable formats (DMG and ZIP).

## Project Installation Guide

1. Head to Releases
2. Click on the Newest Release
3. Follow the Instructions provided.

### Project Remixing

How to run this project from source:

1. Clone This Repository
2. Run `npm install`
3. Start the app with `npm start`

In order to build your own version:

```bash
npm run build
```

This creates a distrubutable in the `dist` folder.

## Project Details

### Project Compatibality

As far as right now I've not planned the installer function that would ask for details such as Intel or Silicon & MacOS Model to ensure installing compatible app. Only a version for the MacBook Air, Silicon M4 Chip, with Tahoe 26.2 is planned.

### Project Roadmap

```
  No.1 | Create Outline & Files
  No.2 | Code **index.js**
  No.3 | Code **preload.js**
  No.4 | Code **package.json** & **build.yml** → Test
  No.5 | Request Feedback → Improve Project
  No.6 | Debug Code
  No.7 | MVP Released
  No.8 | Code **system-detector.js**
  No.9 | Update **index.js** & **package.json** → Test
 No.10 | Request Feedback → Improve Project
 No.11 | Debug Code
 No.12 | MDP Released

```

#### Signed by Ananta the Developer
