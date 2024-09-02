const path = require('path')
const fs = require('fs')
const {
  app,
  Menu,
  nativeImage,
  Notification,
  powerMonitor,
  screen,
  systemPreferences,
  Tray,
} = require('electron')
const { pressKey } = require('bindings')('attaqr')
const { getKeyCodeFor } = require('./keys')
const { Window } = require('node-screenshots')

let readQR, Bitmap
;(async () => {
  readQR = (await import('@paulmillr/qr/decode.js')).default
  Bitmap = (await import('@paulmillr/qr')).Bitmap
})()

let DEBUG_LEVEL = null
// DEBUG_LEVEL = 'info'
// DEBUG_LEVEL = 'debug'

let isPaused = false

const IDLE_INTERVAL = 2500
const MAIN_INTERVAL = 0
const REPEAT_DELAY = 50

const isMacOS = process.platform === 'darwin'

if (isMacOS) app.dock.hide()

let lastMsg = null
let lastMsgAt = Date.now()
let scanRect = null

let tray

async function scan() {
  let now
  let result
  if (DEBUG_LEVEL) now = performance.now()
  try {
    const capture = await captureScreen(scanRect)

    if (capture) {
      result = readQR(capture, { detectFn: scanRect ? undefined : setScanRect })
      if (result) handleMessage(result)
    }
  } catch (error) {
    if (error.message === 'Finder: len(found) = 0') {
      scanRect = null
    } else {
      if (DEBUG_LEVEL) console.error(error.message)
    }
  }
  if (!isPaused) setTimeout(scan, scanRect ? MAIN_INTERVAL : IDLE_INTERVAL)
  if (DEBUG_LEVEL) {
    console.log({ scanRect, result })
    console.log(`scan: ${performance.now() - now}ms`)
  }
}

function setScanRect(points, a, b, c) {
  // const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const x = points[0].x
  const y = points[0].y
  const w = Math.abs(points[2].x - x)
  const h = Math.abs(points[2].y - y)

  scanRect = {
    x: Math.floor(x - w/4),
    y: Math.floor(y - h/4),
    w: Math.ceil(w*1.5),
    h: Math.ceil(h*1.5),
  }
}

async function captureScreen(rect) {
  const windows = Window.all()
  const window = windows.find((w) => w.title === 'World of Warcraft')

  if (!window) return null

  let image = await window.captureImage()

  if (rect) {
    const scaleFactor = window.currentMonitor.scaleFactor
    const cropped = await image.crop(
      rect.x * scaleFactor,
      rect.y * scaleFactor,
      rect.w * scaleFactor,
      rect.h * scaleFactor
    )
    if (DEBUG_LEVEL) {
      fs.writeFileSync(`cropped.jpeg`, cropped.toJpegSync());
    }
    return {
      width: rect.w * scaleFactor,
      height: rect.h * scaleFactor,
      data: await cropped.toRaw(true),
    }
  } else {
    if (DEBUG_LEVEL) {
      fs.writeFileSync(`image.jpeg`, image.toJpegSync());
    }
    return {
      width: image.width,
      height: image.height,
      data: await image.toRaw(true),
    }
  }
}

function handleMessage(msg) {
  if (DEBUG_LEVEL === 'debug') console.log({ msg })
  if (msg && msg !== 'noop') {
    const now = performance.now()
    if (msg === lastMsg && now - lastMsgAt < REPEAT_DELAY) return
    if (DEBUG_LEVEL === 'info') console.log({ msg })
    lastMsgAt = now
    lastMsg = msg
    pressKey(getKeyCodeFor(msg))
  }
}

function checkForScreenAccess() {
  const status = systemPreferences.getMediaAccessStatus('screen')
  if (status !== 'granted') {
    new Notification({
      title: 'AttaQR requires additional permissions.',
      body: `Screen captured access status is "${status}."`,
      silent: true,
      icon: '../res/icon.png',
    }).show()
  }
}

app.whenReady().then(() => {
  const image = nativeImage.createFromPath(
    path.resolve(
      __dirname,
      isMacOS ? '../res/trayTemplate.png' : '../res/icon.png'
    )
  )
  tray = new Tray(image)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        app.quit()
      },
    },
  ])
  tray.setToolTip('AttaQR')
  tray.setContextMenu(contextMenu)

  powerMonitor.on('suspend', () => {
    isPaused = true
  })

  powerMonitor.on('resume', () => {
    isPaused = false
    scan()
  })

  if (isMacOS) checkForScreenAccess()

  scan()
})

if (require('electron-squirrel-startup')) {
  app.quit()
}
