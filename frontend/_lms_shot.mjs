import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const [email, password, routesCsv, role] = process.argv.slice(2)
const OUT = `C:/Users/ASUS/AppData/Local/Temp/claude/d--My-Projects-gurukela-lk/ea1e2b4d-4d1f-4634-be76-64d203300ae9/scratchpad/lms/${role}`
mkdirSync(OUT, { recursive: true })
const routes = routesCsv.split(',')
const VW = 414, VH = 896
const BASE = 'http://localhost:5173'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')

// --- log in through the real form ---
await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
await page.waitForSelector('#l-id')
await page.type('#l-id', email)
await page.type('#l-pw', password)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
  page.click('button[type="submit"]'),
])
await new Promise((r) => setTimeout(r, 1500))
console.log(`[${role}] after login url=`, page.url())

const measure = (vw) => {
  const de = document.documentElement
  const scrollW = Math.max(de.scrollWidth, document.body.scrollWidth)
  const overflow = scrollW - de.clientWidth
  const offenders = []
  if (overflow > 1) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > de.clientWidth + 1) {
        offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className?.toString?.() || '').slice(0, 50), right: Math.round(r.right), w: Math.round(r.width) })
      }
    }
  }
  return { overflow, offenders: offenders.slice(0, 8) }
}

for (const path of routes) {
  const name = path.replace(/\//g, '_').replace(/^_/, '') || 'root'
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 900))
    const info = await page.evaluate(measure, VW)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    console.log(`[${role}] ${path} -> overflow=${info.overflow}px ${info.overflow > 1 ? '⚠️' : 'ok'}`)
    for (const o of info.offenders) console.log(`      <${o.tag} class="${o.cls}"> right=${o.right} w=${o.w}`)
  } catch (e) {
    console.log(`[${role}] ${path} ERROR ${e.message}`)
  }
}
await browser.close()
