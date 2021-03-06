const KEYS = {
  Q: [12, 81],
  W: [13, 87],
  E: [14, 69],
  R: [15, 82],
  T: [17, 84],
  Y: [16, 89],
  U: [32, 85],
  I: [34, 73],
  O: [31, 79],
  P: [35, 80],
  A: [0, 65],
  S: [1, 83],
  D: [2, 68],
  F: [3, 70],
  G: [5, 71],
  H: [4, 72],
  J: [38, 74],
  K: [40, 75],
  L: [37, 76],
  Z: [6, 90],
  X: [7, 88],
  C: [8, 67],
  V: [9, 86],
  B: [11, 66],
  N: [45, 78],
  M: [46, 77],
  1: [18, 49],
  2: [19, 50],
  3: [20, 51],
  4: [21, 52],
  5: [23, 53],
  6: [22, 54],
  7: [26, 55],
  8: [28, 56],
  9: [25, 57],
  0: [29, 48],
  F1: [122, 112],
  F2: [120, 113],
  F3: [99, 114],
  F4: [118, 115],
  F5: [96, 116],
  F6: [97, 117],
  F7: [98, 118],
  F8: [100, 119],
  F9: [101, 120],
  F10: [109, 121],
  F11: [103, 122],
  F12: [111, 123],
  F13: [105, 124],
  F14: [107, 125],
  F15: [113, 126],
  F16: [106, 127],
  F17: [64, 128],
  F18: [79, 129],
  F19: [80, 130],
  F20: [90, 131],
  F21: [-1, 132],
  F22: [-1, 133],
  F23: [-1, 134],
  F24: [-1, 135],
  '`': [50, 192],
  '-': [27, 189],
  '=': [24, 187],
  '[': [33, 219],
  ']': [30, 221],
  '\\': [42, 226],
  ';': [41, 186],
  "'": [39, 222],
  ',': [43, 188],
  '.': [47, 190],
  '/': [44, 191],
}

const KEY_INDEX = process.platform === 'darwin' ? 0 : 1

function getKeyCodeFor(key) {
  return KEYS[key]?.[KEY_INDEX]
}

module.exports = { KEYS, getKeyCodeFor }
