const { app, Menu, Tray, nativeImage } = require('electron')
const path = require('path')

const { pressKey } = require('bindings')('addon');

app.dock.hide()

let tray

app.whenReady().then(() => {
  const image = nativeImage.createFromPath(path.resolve(__dirname, '../res/trayTemplate.png'))
  tray = new Tray(image)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit', click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('AttaQR')
  tray.setContextMenu(contextMenu)
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}
