import path from 'path'
import { fileURLToPath } from 'url'
import {
  app,
  Menu,
  nativeImage,
  Notification,
  powerMonitor,
  systemPreferences,
  Tray,
} from 'electron'
import { activeWindow } from 'get-windows'
import bindings from 'bindings'
import { getKeyCodeFor } from './keys.js'
import squirrelStartup from 'electron-squirrel-startup'
const { pressKey, getPixel } = bindings('attaqr')

let DEBUG = false
DEBUG = true

let isPaused = false

const IDLE_INTERVAL = 2500
const MAIN_INTERVAL = 0
const REPEAT_DELAY = 500

const isMacOS = process.platform === 'darwin'

if (isMacOS) app.dock.hide()

let lastKey = null
let lastKeyAt = Date.now()

let tray

let coord = null
let pixel = null
let perf = null

async function scan() {
  let now = performance.now()
  try {
    if (coord) {
      pixel = getPixel(coord.x, coord.y)

      if (pixel.r == 255) {
        const [key, code] = getKeyCodeFor(Math.round(pixel.b / 4) * 4)
        if (code) {
          if (key === lastKey && now - lastKeyAt < REPEAT_DELAY) {
            // wait
          } else {
            lastKeyAt = now
            lastKey = key
            pressKey(code)
          }
        }
      }
    }
  } catch (error) {
    if (DEBUG) console.error(error.message)
  }
  perf = performance.now() - now
  if (!isPaused) setTimeout(scan, coord ? MAIN_INTERVAL : IDLE_INTERVAL)
}

async function findPixel() {
  const result = await activeWindow({ screenRecordingPermission: true })
  if (result?.title == 'World of Warcraft') {
    const { x, y } = result.bounds
    let yOffset = 0
    let xOffset = 0
    if (y > 0) {
      yOffset = isMacOS ? 30 : 49 // menu bar (needs to be dynamic?)
      xOffset = isMacOS ? 2 : 14 // window shadow
    }
    coord = { x: x + xOffset, y: y + yOffset }
  } else {
    coord = null
  }
  if (!isPaused) setTimeout(findPixel, IDLE_INTERVAL)
}

function updateConsole() {
  console.clear()
  if (coord) {
    console.log(`World of Warcraft! (${coord.x}, ${coord.y})`)
    if (pixel) {
      console.log(
        `${lastKey} (${pixel.r},${pixel.g},${pixel.b}) ${perf.toFixed(2)}ms`
      )
    }
  }
  if (!isPaused) setTimeout(updateConsole, REPEAT_DELAY)
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
      path.dirname(fileURLToPath(import.meta.url)),
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

  findPixel()
  scan()
  if (DEBUG) updateConsole()
})

if (squirrelStartup) {
  app.quit()
}
