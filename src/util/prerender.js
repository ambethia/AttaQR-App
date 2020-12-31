const fs = require('fs')
const { createCanvas } = require('canvas')
var QRCode = require('qrcode')
const KEYS = Object.keys(require('../keys').KEYS)

const NUM_KEYS = KEYS.length
const QR_SIZE = 21
const MARGIN = 1
const TILE_SIZE = QR_SIZE + MARGIN * 2
const PAGE_SIZE = Math.pow(
  2,
  Math.ceil(Math.log2(Math.sqrt(NUM_KEYS * TILE_SIZE * TILE_SIZE)))
)
const NUM_COLS = Math.floor(PAGE_SIZE / TILE_SIZE)

const canvas = createCanvas(PAGE_SIZE, PAGE_SIZE)
const ctx = canvas.getContext('2d')

KEYS.forEach((key, i) => {
  const code = createCanvas(TILE_SIZE, TILE_SIZE)
  QRCode.toCanvas(code, key, { scale: 1, margin: MARGIN }, () => {
    const col = i % NUM_COLS
    const row = Math.floor(i / NUM_COLS)
    ctx.drawImage(code, col * TILE_SIZE, row * TILE_SIZE)
  })
})

fs.writeFileSync('keys.png', canvas.toBuffer())
