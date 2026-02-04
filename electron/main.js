const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let mainWindow = null
let lcuProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: '#0f172a',
    title: "LoL Chat Spammer",
    icon: path.join(__dirname, '../public/logo.svg')
  })

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000'
  
  mainWindow.loadURL(startUrl)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startLCUService() {
  const servicePath = path.join(__dirname, '../mini-services/lcu-service')
  
  console.log('Starting LCU Service from:', servicePath)

  console.log('Starting LCU Service from:', servicePath)

  // On Windows with shell: true, we can just use 'npm'
  lcuProcess = spawn('npm', ['run', 'start'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true, // Required for Windows to resolve npm correctly and avoid EINVAL
    env: { ...process.env, PORT: '3003' }
  })

  lcuProcess.on('error', (err) => {
    console.error('Failed to start LCU Service:', err)
  })

  lcuProcess.on('exit', (code, signal) => {
    console.log(`LCU Service exited with code ${code} and signal ${signal}`)
  })
}

app.on('ready', () => {
  startLCUService()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (lcuProcess) {
    console.log('Killing LCU Service...')
    lcuProcess.kill()
  }
})
