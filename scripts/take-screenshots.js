const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

function loadPlaywright() {
  try {
    return require("playwright")
  } catch (error) {
    const candidateRoots = [
      process.env.NODE_PATH,
      process.env.APPDATA ? path.join(process.env.APPDATA, "npm", "node_modules") : null,
      process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "nodejs", "node_modules") : null
    ].filter(Boolean)

    for (const root of candidateRoots) {
      try {
        return require(path.join(root, "playwright"))
      } catch (candidateError) {
        // Keep trying known global install locations before asking npm.
      }
    }

    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim()
    return require(path.join(globalRoot, "playwright"))
  }
}

const { chromium } = loadPlaywright()

const BASE_URL = process.env.NEXERP_URL || "http://localhost:3000"
const API_URL = process.env.NEXERP_API_URL || "http://localhost:8000/api/v1"
const SCREENSHOT_DIR = path.resolve(__dirname, "..", "docs", "screenshots")
const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }
const LOAD_TIMEOUT = 10_000

const appAdmin = {
  email: "admin@concreart.com",
  password: "Admin@1234"
}

const superAdmin = {
  email: "admin@nexerp.com",
  password: "NexAdmin@2026"
}

const results = []

function shortError(error) {
  return error instanceof Error ? error.message.split("\n")[0] : String(error)
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {})
  await page.waitForTimeout(700)
}

async function gotoWithTimeout(page, route) {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: LOAD_TIMEOUT
  })
}

async function waitForPrincipal(page, selector) {
  await page.waitForSelector(selector, {
    state: "visible",
    timeout: LOAD_TIMEOUT
  })
}

async function screenshot(page, file, options = {}) {
  const target = path.join(SCREENSHOT_DIR, file)
  await page.screenshot({
    path: target,
    fullPage: Boolean(options.fullPage)
  })
}

async function captureRoute(page, config) {
  const warnings = []

  try {
    await gotoWithTimeout(page, config.route)
  } catch (error) {
    warnings.push(`rota ${config.route} nao carregou em 10s: ${shortError(error)}`)
  }

  try {
    await waitForPrincipal(page, config.selector || "main")
  } catch (error) {
    warnings.push(`seletor principal "${config.selector || "main"}" nao apareceu em 10s`)
  }

  if (config.prepare) {
    try {
      await config.prepare(page)
    } catch (error) {
      warnings.push(shortError(error))
    }
  }

  await settle(page)

  try {
    await screenshot(page, config.file, { fullPage: config.fullPage })
    results.push({
      file: config.file,
      ok: warnings.length === 0,
      reason: warnings.join("; ")
    })
  } catch (error) {
    results.push({
      file: config.file,
      ok: false,
      reason: `falha ao salvar screenshot: ${shortError(error)}`
    })
  }
}

async function authenticate(context, credentials) {
  const page = await context.newPage()
  const warnings = []
  let session = null

  try {
    const response = await context.request.post(`${API_URL}/auth/login`, {
      data: credentials,
      timeout: LOAD_TIMEOUT
    })

    if (!response.ok()) {
      const body = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status()} ${body.slice(0, 140)}`)
    }

    session = await response.json()
  } catch (error) {
    warnings.push(`login ${credentials.email} falhou: ${shortError(error)}`)
  }

  if (!session) {
    await gotoWithTimeout(page, "/login").catch(() => {})
    await settle(page)
    return { page, warnings }
  }

  try {
    await gotoWithTimeout(page, "/")
    await page.evaluate((authSession) => {
      window.localStorage.setItem("nexerp-auth", JSON.stringify({
        state: {
          accessToken: authSession.access_token,
          permissions: authSession.permissions,
          user: authSession.user,
          company: authSession.company
        },
        version: 0
      }))
    }, session)
    await gotoWithTimeout(page, "/dashboard")
    await waitForPrincipal(page, "main")
    await settle(page)
  } catch (error) {
    warnings.push(`sessao ${credentials.email} nao abriu o dashboard: ${shortError(error)}`)
  }

  return { page, warnings }
}

async function preparePosCart(page) {
  await page.waitForFunction(() => {
    const firstSelect = document.querySelector("select")
    return firstSelect && Array.from(firstSelect.options).some((option) => option.value)
  }, null, { timeout: LOAD_TIMEOUT })

  await page.locator("select").first().selectOption({ index: 1 })
  await page.getByRole("button", { name: /^Add$/i }).click()
  await page.getByText("Nenhum item adicionado.").waitFor({ state: "detached", timeout: 3_000 }).catch(() => {})
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  try {
    const publicContext = await browser.newContext({ viewport: DESKTOP })
    const publicPage = await publicContext.newPage()
    await captureRoute(publicPage, {
      file: "landing.png",
      route: "/",
      selector: "main",
      fullPage: true
    })
    await captureRoute(publicPage, {
      file: "login.png",
      route: "/login",
      selector: "form"
    })
    await publicContext.close()

    const appContext = await browser.newContext({ viewport: DESKTOP })
    const { page: appPage, warnings: appLoginWarnings } = await authenticate(appContext, appAdmin)

    await settle(appPage)
    await screenshot(appPage, "dashboard.png")
    results.push({
      file: "dashboard.png",
      ok: appLoginWarnings.length === 0,
      reason: appLoginWarnings.join("; ")
    })

    const appScreens = [
      { file: "products.png", route: "/products" },
      { file: "sales-new.png", route: "/pos", prepare: preparePosCart },
      { file: "stock.png", route: "/stock" },
      { file: "customers.png", route: "/customers" },
      { file: "finance.png", route: "/finance" }
    ]

    for (const config of appScreens) {
      await captureRoute(appPage, {
        selector: "main",
        ...config
      })
    }
    await appContext.close()

    const superContext = await browser.newContext({ viewport: DESKTOP })
    const { page: superPage, warnings: superLoginWarnings } = await authenticate(superContext, superAdmin)
    await captureRoute(superPage, {
      file: "admin-companies.png",
      route: "/admin/companies",
      selector: "main"
    })
    const adminResult = results.find((item) => item.file === "admin-companies.png")
    if (adminResult && superLoginWarnings.length > 0) {
      adminResult.ok = false
      adminResult.reason = [superLoginWarnings.join("; "), adminResult.reason].filter(Boolean).join("; ")
    }
    await superContext.close()

    const mobileLandingContext = await browser.newContext({ viewport: MOBILE, isMobile: true })
    const mobileLandingPage = await mobileLandingContext.newPage()
    await captureRoute(mobileLandingPage, {
      file: "landing-mobile.png",
      route: "/",
      selector: "main",
      fullPage: true
    })
    await mobileLandingContext.close()

    const mobileAppContext = await browser.newContext({ viewport: MOBILE, isMobile: true })
    const { page: mobileAppPage, warnings: mobileLoginWarnings } = await authenticate(mobileAppContext, appAdmin)
    await settle(mobileAppPage)
    await screenshot(mobileAppPage, "dashboard-mobile.png")
    results.push({
      file: "dashboard-mobile.png",
      ok: mobileLoginWarnings.length === 0,
      reason: mobileLoginWarnings.join("; ")
    })
    await mobileAppContext.close()
  } finally {
    await browser.close()
  }

  console.log("")
  console.log("Screenshot summary")
  for (const result of results) {
    const status = result.ok ? "OK" : "FAIL"
    console.log(`${status} ${result.file}${result.reason ? ` - ${result.reason}` : ""}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
