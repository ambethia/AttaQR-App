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
const activeWindows = require('electron-active-window')
const { createActor, setup, assign } = require('xstate')
const { getKeyCodeFor } = require('./keys')
const { Window } = require('node-screenshots')

let readQR, Bitmap
;(async () => {
  readQR = (await import('@paulmillr/qr/decode.js')).default
  Bitmap = (await import('@paulmillr/qr')).Bitmap
  stateService.start()
})()

const isMacOS = process.platform === 'darwin'

if (isMacOS) app.dock.hide()

const WAIT_INTERVAL = 2800
const GAME_WINDOW_NAME = 'Wow'

let running = false // TODO: Move this check to the state machine.
let lastMsg = null
let lastMsgAt = Date.now()

const machine = setup({
  actions: {
    activateIfGameIsRunning: assign({
      timer: () => {
        activateOnGame()
        return setInterval(() => activateOnGame(), WAIT_INTERVAL)
      },
    }),
    searchForQRCode: assign({
      timer: () => {
        searchForQRCode()
        return setInterval(() => searchForQRCode(), WAIT_INTERVAL / 7)
      },
    }),
    startMainLoop: ({ context }) => {
      running = true
      main(context.scanRect)
    },
    stopMainLoop: () => {
      running = false
    },
    clearTimer: assign({
      timer: (context) => clearInterval(context.timer),
    }),
    establishScanningRect: assign({
      scanRect: ({ event }) => {
        return event.payload
      },
    }),
    resetScanningRect: assign({
      scanRect: () => null,
    }),
  },
  on: {
    STOP: {
      target: 'idle',
    },
  },
}).createMachine({
  id: 'attaq',
  initial: 'idle',
  context: { timer: null, scanRect: null },
  states: {
    idle: {
      // Doing nothing
      on: { START: { target: 'waiting' } },
    },
    waiting: {
      // Periodically checking for game to be active.
      on: { ACTIVATE: { target: 'pending' } },
      entry: ['activateIfGameIsRunning'],
      exit: ['clearTimer'],
    },
    pending: {
      // Game is running, waiting for QR
      on: { ACTIVATE: { target: 'active' }, SUSPEND: { target: 'waiting' } },
      entry: ['searchForQRCode'],
      exit: ['clearTimer'],
    },
    active: {
      // Actively scanning QR Code and sending key presses
      on: { SUSPEND: { target: 'waiting' } },
      entry: ['establishScanningRect', 'startMainLoop'],
      exit: ['stopMainLoop', 'resetScanningRect'],
    },
  },
})

const stateService = createActor(machine)
// stateService.subscribe((state) => console.log(state.value))

let tray

async function isGameInForeground() {
  w = await activeWindows().getActiveWindow()
  return w?.windowName === GAME_WINDOW_NAME
}

async function activateOnGame() {
  const isActive = await isGameInForeground()
  if (isActive) stateService.send({ type: 'ACTIVATE' })
}

async function searchForQRCode() {
  const isActive = await isGameInForeground()
  if (!isActive) {
    stateService.send({ type: 'SUSPEND' })
    return
  }

  try {
    const capture = await captureScreen()
    let result, scanRect
    try {
      result = readQR(capture, {
        detectFn: (points) => {
          const display = screen.getDisplayNearestPoint(
            screen.getCursorScreenPoint()
          )
          const m = 32
          const f = display.scaleFactor
          const x = Math.max(points[0].x - m, 0)
          const y = Math.max(points[0].y - m, 0)
          const w = points[1].x + m - x
          const h = points[3].y + m - y

          scanRect = {
            x: Math.floor(x / f),
            y: Math.floor(y / f),
            w: Math.ceil(w / f),
            h: Math.ceil(h / f),
          }
        },
      })
    } catch (error) {
      console.error(error)
    }
    if (result) {
      stateService.send({
        type: 'ACTIVATE',
        payload: scanRect,
      })
    }
  } catch (error) {
    console.error(error)
    stateService.send({ type: 'SUSPEND' })
  }
}

async function main(rect) {
  // const now = performance.now()
  try {
    const capture = await captureScreen(rect)
    let result
    try {
      result = readQR(capture)
    } catch (error) {}

    if (result) {
      handleMessage(result)
    } else {
      stateService.send({ type: 'SUSPEND' })
    }
    if (running) {
      setImmediate(async () => await main(rect))
    }
  } catch {
    stateService.send({ type: 'SUSPEND' })
  }
  // const elapsed = performance.now() - now
  // console.log('Elapsed:', elapsed)
}

function handleMessage(msg) {
  if (msg && msg !== 'noop') {
    const now = performance.now()
    if (msg === lastMsg && now - lastMsgAt < 1000) return
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
        stateService.send({ type: 'STOP' })
        app.isQuiting = true
        app.quit()
      },
    },
  ])
  tray.setToolTip('AttaQR')
  tray.setContextMenu(contextMenu)

  powerMonitor.on('suspend', () => {
    stateService.send({ type: 'STOP' })
  })

  powerMonitor.on('resume', () => {
    stateService.send({ type: 'START' })
  })

  stateService.send({ type: 'START' })

  if (isMacOS) {
    checkForScreenAccess()
  }
})

if (require('electron-squirrel-startup')) {
  stateService.send({ type: 'STOP' })
  app.quit()
}

// TODO refactor pending loop to just look at this instead of activeWindows
async function captureScreen(rect = null) {
  const windows = Window.all()
  const window = windows.find((w) => w.title === 'World of Warcraft')
  let image = await window.captureImage()

  if (rect) {
    const scaleFactor = window.currentMonitor.scaleFactor
    const cropped = await image.crop(
      rect.x * scaleFactor,
      rect.y * scaleFactor,
      rect.w * scaleFactor,
      rect.h * scaleFactor
    )
    return {
      width: rect.w * scaleFactor,
      height: rect.h * scaleFactor,
      data: await cropped.toRaw(true),
    }
  } else {
    return {
      width: image.width,
      height: image.height,
      data: await image.toRaw(true),
    }
  }
}
