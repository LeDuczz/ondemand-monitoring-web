// Usage: node scripts/screenshot-manager.mjs <route-hash> <name> [--viewport]
//   e.g. node scripts/screenshot-manager.mjs "#portal/manager/missions" missions
// By default the whole page is captured: the portal shell scrolls inside
// .odm-shell-content, so Playwright's fullPage only sees the viewport. The
// script grows the viewport to the inner scroll container's scrollHeight
// before the shot. Pass --viewport (or FULL=0) to capture the viewport only.
// Logs in as the demo MANAGER account from src/mocks/data/auth-users.json,
// then screenshots the route in vi/en x light/dark x 1280/390 into
// evd/manager-redesign/.
//
// The real backend's seed accounts (seed.manager@odms.local) authenticate via
// Cognito and their password is not in the repo, so scripted login only works
// against the in-app mock API. Run with MOCK=1 to spawn a mock-mode Vite
// server (same env as playwright.config.ts) on port 5174 for the run. Without
// MOCK=1 the script uses BASE_URL (default http://localhost:5173) as-is, which
// only logs in if that server runs in mock mode.
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MOCK = process.env.MOCK === '1'
const MOCK_PORT = 5174
const BASE = MOCK
  ? `http://localhost:${MOCK_PORT}`
  : (process.env.BASE_URL ?? 'http://localhost:5173')
const args = process.argv.slice(2)
const viewportOnly = args.includes('--viewport') || process.env.FULL === '0'
const [hashArg, name] = args.filter((a) => !a.startsWith('--'))
if (!hashArg || !name) {
  console.error('Usage: node scripts/screenshot-manager.mjs <route-hash> <name>')
  process.exit(1)
}
const hash = hashArg.startsWith('#') ? hashArg : `#${hashArg}`

const { users } = JSON.parse(
  readFileSync(resolve(root, 'src/mocks/data/auth-users.json'), 'utf8'),
)
const manager = users.find(
  (u) => u.role === 'MANAGER' && u.isActive && !u.email.startsWith('locked'),
)
if (!manager) throw new Error('No active MANAGER in auth-users.json')

const outDir = resolve(root, 'evd/manager-redesign')
mkdirSync(outDir, { recursive: true })

// Falls back to the newest browser already in the Playwright cache when the
// revision matching this @playwright/test version has not been downloaded.
async function launch() {
  try {
    return await chromium.launch()
  } catch (error) {
    const cache = resolve(homedir(), 'Library/Caches/ms-playwright')
    const dirs = existsSync(cache)
      ? readdirSync(cache)
          .filter((d) => d.startsWith('chromium_headless_shell-'))
          .sort()
          .reverse()
      : []
    for (const dir of dirs) {
      for (const arch of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64']) {
        const exe = resolve(cache, dir, arch, 'chrome-headless-shell')
        if (existsSync(exe)) return chromium.launch({ executablePath: exe })
      }
    }
    throw error
  }
}

// Grows the viewport so the shell's inner scroll container (and the document)
// show their full content. Two passes because layout can reflow after resize.
async function expandToContent(page, width) {
  for (let pass = 0; pass < 2; pass++) {
    const needed = await page.evaluate(() => {
      const el = document.querySelector('.odm-shell-content')
      const innerExtra = el ? el.scrollHeight - el.clientHeight : 0
      const docExtra =
        document.documentElement.scrollHeight - window.innerHeight
      return window.innerHeight + Math.max(innerExtra, docExtra, 0)
    })
    const current = page.viewportSize()?.height ?? 0
    if (needed <= current) break
    await page.setViewportSize({ width, height: Math.min(needed, 16000) })
    await page.waitForTimeout(400)
  }
}

let server
if (MOCK) {
  server = spawn(
    'npx',
    ['vite', '--port', String(MOCK_PORT), '--strictPort'],
    {
      cwd: root,
      stdio: 'ignore',
      env: {
        ...process.env,
        VITE_USE_MOCK_API: 'true',
        VITE_API_BASE_URL: BASE,
        VITE_REAL_API_ROUTES: '',
      },
    },
  )
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) break
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
}
const browser = await launch()
const errors = []
const saved = []

async function login(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript((l) => {
    try {
      localStorage.setItem('odm-lang', l)
    } catch {}
  }, lang)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#auth/login`)
  await page.locator('input#email').fill(manager.email)
  await page.locator('input[type="password"]').fill(manager.password)
  // "Remember me" stores the session in localStorage, which storageState keeps.
  await page.locator('input[type="checkbox"]').check()
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/#portal\//, { timeout: 15000 })
  const state = await ctx.storageState()
  await ctx.close()
  return state
}

for (const lang of ['vi', 'en']) {
  const state = await login(lang)
  for (const theme of ['light', 'dark']) {
    for (const width of [1280, 390]) {
      const ctx = await browser.newContext({
        viewport: { width, height: width === 1280 ? 900 : 844 },
        storageState: state,
      })
      await ctx.addInitScript(
        ([l, t]) => {
          try {
            localStorage.setItem('odm-lang', l)
          } catch {}
          try {
            document.documentElement.dataset.theme = t
          } catch {}
        },
        [lang, theme],
      )
      const page = await ctx.newPage()
      const tag = `${lang}-${theme}-${width}`
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`[${tag}] ${m.text()}`)
      })
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`[${tag}] HTTP ${r.status()} ${r.url()}`)
      })
      page.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`))
      await page.goto(`${BASE}/${hash}`)
      await page.waitForLoadState('networkidle').catch(() => {})
      // The layout seeds its theme state once at mount, so set the theme after
      // load; nothing rewrites data-theme afterwards (same attribute the
      // layout's toggle sets).
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t
      }, theme)
      await page.waitForTimeout(800)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
      if (overflow) errors.push(`[${tag}] page has horizontal overflow`)
      if (!viewportOnly) await expandToContent(page, width)
      const file = resolve(outDir, `${name}-${tag}.png`)
      await page.screenshot({ path: file, fullPage: true })
      saved.push(file)
      await ctx.close()
    }
  }
}
await browser.close()
server?.kill()
console.log(saved.join('\n'))
console.log(errors.length ? `Issues:\n${errors.join('\n')}` : 'No console errors.')
