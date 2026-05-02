const fs = require("fs")
const path = require("path")
const Module = require("module")

const globalNodeModules = process.env.APPDATA
  ? path.join(process.env.APPDATA, "npm", "node_modules")
  : ""

if (globalNodeModules) {
  process.env.NODE_PATH = [process.env.NODE_PATH, globalNodeModules].filter(Boolean).join(path.delimiter)
  Module._initPaths()
}

const { chromium } = require("playwright")

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000"
const runId = new Date().toISOString().replace(/[:.]/g, "-")
const outDir = process.env.QA_OUT_DIR || path.join("C:\\tmp", `nexerp-qa-cycle-${runId}`)

const credentials = {
  email: process.env.QA_EMAIL || "admin@concreart.com",
  password: process.env.QA_PASSWORD || "Admin@1234"
}

const desktop = { width: 1440, height: 900 }
const mobile = { width: 390, height: 844 }

function url(route) {
  return `${baseUrl}${route}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function safeWait(page, selector, timeout = 10_000) {
  try {
    await page.waitForSelector(selector, { timeout })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

async function capture(page, name, route, selector = "body", options = {}) {
  const result = { name, route, ok: true, warnings: [] }
  try {
    await page.setViewportSize(options.viewport || desktop)
    await page.goto(url(route), { waitUntil: "domcontentloaded", timeout: 10_000 })
  } catch (error) {
    result.ok = false
    result.warnings.push(`goto: ${error.message}`)
  }

  const wait = await safeWait(page, selector)
  if (!wait.ok) {
    result.ok = false
    result.warnings.push(`selector ${selector}: ${wait.error}`)
  }

  await sleep(options.delay ?? 700)
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  result.file = file
  return result
}

async function login(page) {
  await page.setViewportSize(desktop)
  await page.goto(url("/login"), { waitUntil: "networkidle", timeout: 15_000 })
  await page.waitForFunction(() => {
    const button = document.querySelector("button[type='submit']")
    return button && !button.hasAttribute("disabled")
  }, { timeout: 10_000 })
  await page.getByLabel("E-mail").fill(credentials.email)
  await page.getByLabel("Senha").fill(credentials.password)
  await sleep(300)
  await page.getByRole("button", { name: /^Entrar/ }).click()
  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 10_000 }),
    page.waitForSelector("text=Operação de vendas e compras", { timeout: 10_000 })
  ])
}

async function setTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    window.localStorage.setItem("nexerp-theme", nextTheme)
    document.documentElement.dataset.theme = nextTheme
    document.documentElement.style.colorScheme = nextTheme
  }, theme)
}

async function whiteBlocksInDark(page) {
  return page.evaluate(() => {
    function parseRgb(value) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/)
      if (!match) return null
      return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])]
    }

    return Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width < 120 || rect.height < 36) return null
        const style = getComputedStyle(element)
        const rgb = parseRgb(style.backgroundColor)
        if (!rgb) return null
        const [r, g, b, alpha] = rgb
        if (alpha < 0.8) return null
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        if (brightness < 235) return null
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          background: style.backgroundColor
        }
      })
      .filter(Boolean)
      .slice(0, 20)
  })
}

async function forgotPasswordContrast(page) {
  await page.goto(url("/forgot-password"), { waitUntil: "domcontentloaded", timeout: 10_000 })
  await safeWait(page, "h1")
  return page.locator("h1").evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      text: element.textContent,
      color: style.color,
      background: getComputedStyle(document.body).backgroundColor
    }
  })
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: desktop })
  const technical = {
    console: [],
    pageErrors: [],
    responses: []
  }

  page.on("console", (message) => {
    if (message.type() === "error") {
      technical.console.push({ text: message.text(), location: message.location() })
    }
  })
  page.on("pageerror", (error) => technical.pageErrors.push(error.message))
  page.on("response", (response) => {
    if (response.status() >= 400) {
      technical.responses.push({ status: response.status(), url: response.url() })
    }
  })

  const captures = []
  const visualFindings = []

  captures.push(await capture(page, "landing", "/", "body"))
  captures.push(await capture(page, "login", "/login", "form"))
  captures.push(await capture(page, "register", "/register", "form"))
  captures.push(await capture(page, "forgot-password", "/forgot-password", "form"))
  captures.push(await capture(page, "terms", "/terms", "main"))
  captures.push(await capture(page, "privacy", "/privacy", "main"))

  const contrast = await forgotPasswordContrast(page)
  if (contrast.color.includes("0, 0, 0") || contrast.color.includes("0, 35")) {
    visualFindings.push({
      severity: "high",
      screen: "forgot-password",
      issue: `H1 still appears dark on dark background: ${contrast.color}`
    })
  }

  await login(page)
  await setTheme(page, "dark")

  for (const [name, route] of [
    ["dashboard-dark", "/dashboard"],
    ["products-dark", "/products"],
    ["categories-dark", "/categories"],
    ["pos-dark", "/pos"],
    ["stock-dark", "/stock"],
    ["customers-dark", "/customers"],
    ["suppliers-dark", "/suppliers"],
    ["finance-dark", "/finance"],
    ["purchases-dark", "/purchases"],
    ["reports-dark", "/reports"],
    ["settings-dark", "/settings"]
  ]) {
    captures.push(await capture(page, name, route, "main"))
    const blocks = await whiteBlocksInDark(page)
    if (blocks.length > 0) {
      visualFindings.push({ severity: "medium", screen: name, issue: "large light blocks in dark theme", blocks })
    }
  }

  await setTheme(page, "light")
  captures.push(await capture(page, "dashboard-light", "/dashboard", "main"))
  captures.push(await capture(page, "products-light", "/products", "main"))
  captures.push(await capture(page, "categories-light", "/categories", "main"))

  await setTheme(page, "dark")
  captures.push(await capture(page, "dashboard-mobile", "/dashboard", "main", { viewport: mobile }))
  captures.push(await capture(page, "products-mobile", "/products", "main", { viewport: mobile }))

  await browser.close()

  const report = {
    runId,
    outDir,
    captures,
    visualFindings,
    technical
  }

  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
