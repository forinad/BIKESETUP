const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

app.setName('BIKESETUP')

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    backgroundColor: '#0b0d0a',
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await new Promise((r) => setTimeout(r, 1600))

  const info = await win.webContents.executeJavaScript(`(async () => {
    const keys = Object.keys(localStorage)
    const raw = localStorage.getItem('bikesetup-v1')
    const state = raw ? JSON.parse(raw)?.state : null
    const bike = state?.bikes?.[0] ?? null
    if (!bike) return { ok: false, reason: 'no bike', keys, raw: raw?.slice(0, 200) ?? null }
    location.hash = '#/bike/' + bike.id
    await new Promise((r) => setTimeout(r, 900))
    const heading = [...document.querySelectorAll('*')].find(
      (el) => el.textContent?.trim() === 'Настройки вилки',
    )
    heading?.scrollIntoView({ block: 'center' })
    await new Promise((r) => setTimeout(r, 350))
    return {
      ok: true,
      bike: bike.name,
      adjusters: bike.fork?.adjusters ?? null,
      unknownButtons: [...document.querySelectorAll('button[aria-label^="Не знаю максимум"]')].length,
    }
  })()`)

  const image = await win.webContents.capturePage()
  const out = path.join(__dirname, '..', 'screenshots', 'fork-unknown.png')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, image.toPNG())
  console.log(JSON.stringify({ info, out, userData: app.getPath('userData') }))
  app.quit()
})
