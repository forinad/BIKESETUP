const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isSmoke = process.argv.includes('--smoke-test')

app.setAppUserModelId('com.bikesetup.app')
app.setName('BIKESETUP')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 380,
    minHeight: 540,
    backgroundColor: '#0b0d0a',
    title: 'BIKESETUP',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  if (isSmoke) {
    win.webContents.once('did-finish-load', async () => {
      let result
      try {
        result = await win.webContents.executeJavaScript(`(async () => {
          await new Promise((r) => setTimeout(r, 1500))
          try {
            localStorage.setItem('__smoke', '1')
            const storageOk = localStorage.getItem('__smoke') === '1'
            localStorage.removeItem('__smoke')
            return {
              ok: true,
              storageOk,
              seeded: !!localStorage.getItem('bikesetup-v1'),
              heading: document.querySelector('h1')?.innerText ?? null,
              emptyGarage: document.body.innerText.toUpperCase().includes('ГАРАЖ ПОКА ПУСТ'),
              bikes: JSON.parse(localStorage.getItem('bikesetup-v1') || '{}')?.state?.bikes
                ?.length ?? null,
              errors: window.__smokeErrors ?? [],
            }
          } catch (e) {
            return { ok: false, error: String(e) }
          }
        })()`)
      } catch (e) {
        result = { ok: false, error: String(e) }
      }

      const payload = JSON.stringify(
        { result, url: win.webContents.getURL(), userData: app.getPath('userData') },
        null,
        2,
      )
      const outFile =
        process.env.BIKESETUP_SMOKE_OUT || path.join(app.getPath('userData'), 'smoke-result.json')
      try {
        fs.writeFileSync(outFile, payload)
      } catch (e) {
        console.error('SMOKE write failed:', e)
      }
      console.log('SMOKE ' + payload)
      app.quit()
    })
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
