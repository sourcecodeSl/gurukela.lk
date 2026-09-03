/**
 * `npm run dev` — start the Vite dev server and put the site on screen.
 *
 * Vite already opens a browser itself (`server.open` in vite.config.js), but
 * only when it manages to start. With `strictPort` on, a dev server left over
 * from an earlier terminal holds 5173 and the new one exits with "Port 5173 is
 * already in use" before it ever reaches the open step — which reads, from the
 * terminal, as "npm run dev stopped opening the site".
 *
 * So: if something is already serving on the dev port, this just points the
 * browser at it and leaves the running server alone. Otherwise it hands off to
 * Vite, which starts and opens as usual.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 5173)
const DEV_URL = `http://localhost:${PORT}/`

/** True if anything accepts a TCP connection on the port at `host`. */
function hostInUse(port, host) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host })
    const done = (answer) => {
      socket.destroy()
      resolve(answer)
    }
    socket.setTimeout(1000)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

/**
 * Vite binds `localhost`, which on Windows resolves to ::1 only — checking
 * 127.0.0.1 alone reports the port free and we would start a second server
 * that immediately dies on EADDRINUSE. Ask both stacks.
 */
async function portInUse(port) {
  const answers = await Promise.all(['127.0.0.1', '::1'].map((h) => hostInUse(port, h)))
  return answers.some(Boolean)
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url.replace(/&/g, '^&')]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
  spawn(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true }).unref()
}

const busy = await portInUse(PORT)

if (busy) {
  console.log(
    `\n  A dev server is already running on ${PORT} — opening it instead of starting a second one.` +
      `\n  ➜  ${DEV_URL}\n` +
      `\n  Stop the other terminal first if you wanted a fresh start.\n`,
  )
  openBrowser(DEV_URL)
  process.exit(0)
}

/* Nothing on the port: normal path. Vite opens the browser from its own
   config once the server is actually listening. */
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const vite = existsSync(viteBin)
  ? spawn(process.execPath, [viteBin, ...process.argv.slice(2)], { stdio: 'inherit' })
  : spawn('npx', ['vite', ...process.argv.slice(2)], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
vite.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
