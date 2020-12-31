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
const { pressKey, captureScreen } = require('bindings')('addon')
const activeWin = require('active-win')
const { Machine, assign, interpret } = require('xstate')
const jsQR = require('jsqr')

const isMacOS = process.platform === 'darwin'

if (isMacOS) app.dock.hide()

const WAIT_INTERVAL = 2800
const GAME_WINDOW_NAME = 'wow'

// pressKey(1);
// pressKey(1, ["shift"]);

const machine = Machine(
  {
    id: 'attaq',
    initial: 'idle',
    context: {
      timer: null,
      scanRect: null,
    },
    states: {
      idle: {
        // Doing nothing
        on: { START: 'waiting' },
      },
      waiting: {
        // Periodically checking for game to be active.
        on: { ACTIVATE: 'pending' },
        entry: ['activateIfGameIsRunning'],
        exit: ['clearTimer'],
      },
      pending: {
        // Game is running, waiting for QR
        on: { ACTIVATE: 'active', SUSPEND: 'waiting' },
        entry: ['searchForQRCode'],
        exit: ['clearTimer'],
      },
      active: {
        // Actively scanning QR Code and sending key presses
        on: { SUSPEND: 'waiting' },
        entry: ['establishScanningRect', 'startMainLoop'],
        exit: ['clearTimer', 'resetScanningRect'],
      },
    },
    on: {
      STOP: {
        target: 'idle',
      },
    },
  },
  {
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
          return setInterval(() => searchForQRCode(), WAIT_INTERVAL / 2)
        },
      }),
      startMainLoop: assign({
        timer: (context) => {
          return setInterval(() => main(context.scanRect), WAIT_INTERVAL / 7)
        },
      }),
      clearTimer: assign({
        timer: (context) => clearInterval(context.timer),
      }),
      establishScanningRect: assign({
        scanRect: (_, event) => {
          return event.payload
        },
      }),
      resetScanningRect: assign({
        scanRect: () => null,
      }),
    },
  }
)

const stateService = interpret(machine)
  // .onTransition((state) => console.log('Transitioning to', state.value))
  .start()

let tray

async function isGameInForeground() {
  const activeApplicationName = (await activeWin())?.owner?.name
  return activeApplicationName?.toLocaleLowerCase() === GAME_WINDOW_NAME
}

async function activateOnGame() {
  const isActive = await isGameInForeground()
  if (isActive) stateService.send('ACTIVATE')
}

async function searchForQRCode() {
  const isActive = await isGameInForeground()
  if (!isActive) {
    stateService.send('SUSPEND')
    return
  }

  captureScreen((capture) => {
    const result = jsQR(
      capture.data,
      capture.bytesPerRow / capture.bytesPerPixel,
      capture.height
    )
    if (result) {
      new Notification({
        title: 'AttaQR is ready.',
        body: "QR code located; we're ready to rock and roll.",
        silent: true,
      }).show()

      const display = screen.getDisplayNearestPoint(
        screen.getCursorScreenPoint()
      )
      const factor = display.scaleFactor
      const margin = 4
      const loc = result.location
      const x = loc.topLeftCorner.x / factor - margin
      const y = loc.topLeftCorner.y / factor - margin
      const h = loc.bottomLeftCorner.y / factor - y + margin * 2
      const w = loc.topRightCorner.x / factor - x + margin * 2

      stateService.send({
        type: 'ACTIVATE',
        payload: { x, y, h, w },
      })
    }
  })
}

function main({ x, y, w, h }) {
  captureScreen(x, y, w, h, (capture) => {
    const result = jsQR(
      capture.data,
      capture.bytesPerRow / capture.bytesPerPixel,
      capture.height
    )
    if (result) {
      handleKeyCode(result.data)
    } else {
      stateService.send('SUSPEND')
    }
  })
}

function handleKeyCode(code) {
  console.log(code)
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
    path.resolve(__dirname, '../res/trayTemplate.png')
  )
  tray = new Tray(image)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click: () => {
        stateService.send('STOP')
        app.isQuiting = true
        app.quit()
      },
    },
  ])
  tray.setToolTip('AttaQR')
  tray.setContextMenu(contextMenu)

  powerMonitor.on('suspend', () => {
    stateService.send('STOP')
  })

  powerMonitor.on('resume', () => {
    stateService.send('START')
  })

  stateService.send('START')

  if (isMacOS) {
    checkForScreenAccess()
  }
})

if (require('electron-squirrel-startup')) {
  stateService.send('STOP')
  app.quit()
}