const path = require('path')
const fs = require('fs')
const {
  app,
  desktopCapturer,
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
const jsQR = require('jsqr')
const { getKeyCodeFor } = require('./keys')

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
    startMainLoop: (context) => {
      running = true
      main()
    },
    stopMainLoop: () => {
      running = false
    },
    clearTimer: assign({
      timer: (context) => clearInterval(context.timer),
    })
  },
  on: {
    STOP: {
      target: 'idle',
    },
  },
}).createMachine({
  id: 'attaq',
  initial: 'idle',
  context: { timer: null },
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
      entry: ['startMainLoop'],
      exit: ['stopMainLoop'],
    },
  },
})

const stateService = createActor(machine)
stateService.start()

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
    captureScreen((capture) => {
      const result = jsQR(capture.data, capture.width, capture.height)
      if (result) {
        stateService.send({ type: 'ACTIVATE' })
      }
    })
  } catch {
    stateService.send({ type: 'SUSPEND' })
  }
}

function main() {
  try {
    captureScreen((capture) => {
      const result = jsQR(capture.data, capture.width, capture.height)
      if (result) {
        handleMessage(result.data)
      } else {
        stateService.send({ type: 'SUSPEND' })
      }
      if (running) {
        setImmediate(() => main())
      }
    })
  } catch {
    stateService.send({ type: 'SUSPEND' })
  }
}

function captureScreen(callback) {
  const display = screen.getPrimaryDisplay() // TODO: Get the display where the game is running.
  desktopCapturer
    .getSources({ types: ['window', 'screen'], thumbnailSize: display.size })
    .then(async (sources) => {
      for (const source of sources) {
        if (source.name === 'World of Warcraft') {
          const size = source.thumbnail.getSize()
          callback({ data: source.thumbnail.getBitmap(), ...size })
        }
      }
    })
}

function handleMessage(msg) {
  console.log(msg)
  if (msg !== 'noop') {
    const now = Date.now()
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
