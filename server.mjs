import compression from 'compression'
import express from 'express'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'
import { createDevMiddleware, renderPage } from 'vike/server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)
const base = normalizeBase(process.env.BASE || '/')
const clientRoot = path.resolve(__dirname, 'dist/client')
const publicRoot = path.resolve(__dirname, 'public')
const buildVersion = process.env.APP_VERSION || process.env.VCS_REF || 'unknown'
const buildCommit = process.env.VCS_REF || ''
const buildDate = process.env.BUILD_DATE || ''
const publicSiteUrl = normalizePublicUrl(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || `http://localhost:${port}`)
const apiBaseUrl = (process.env.SSR_API_URL || process.env.VITE_SSR_API_URL || process.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')
const ssrRateWindowMs = Number(process.env.SSR_RATE_WINDOW_MS || 60000)
const ssrRateLimit = Number(process.env.SSR_RATE_LIMIT || 180)
const ssrRateBuckets = new Map()

const app = express()
const server = http.createServer(app)

app.disable('x-powered-by')
app.use(compression())

app.get('/health', (_req, res) => {
  res.status(200).set('Cache-Control', 'no-store, max-age=0').json({
    status: 'ok',
    version: buildVersion,
    commit: buildCommit,
    buildDate,
  })
})

app.use('/.well-known/appspecific', (_req, res) => {
  res.status(204).end()
})

app.get('/robots.txt', (_req, res) => {
  res
    .type('text/plain')
    .set('Cache-Control', 'public, max-age=3600')
    .send([
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${publicSiteUrl}/sitemap.xml`,
      '',
    ].join('\n'))
})

app.get('/sitemap.xml', async (_req, res) => {
  const staticPaths = [
    '/',
    '/bowls',
    '/tobaccos',
    '/coals',
    '/kalouds',
  ]
  const setupPaths = await fetchSetupSitemapPaths()
  const urls = [...staticPaths, ...setupPaths]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((urlPath) => `  <url><loc>${escapeXml(`${publicSiteUrl}${urlPath}`)}</loc></url>`).join('\n') +
    `\n</urlset>\n`

  res.type('application/xml').set('Cache-Control', 'public, max-age=1800').send(xml)
})

if (!isProduction) {
  app.use(base, sirv(publicRoot, { dev: true, extensions: [] }))
}

if (isProduction) {
  app.use(
    base,
    sirv(clientRoot, {
      dev: false,
      etag: true,
      extensions: [],
      immutable: true,
      maxAge: 31536000,
      setHeaders(res, pathname) {
        if (!pathname.startsWith('/assets/')) {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    }),
  )
} else {
  const { devMiddleware } = await createDevMiddleware({
    root: __dirname,
    viteConfig: {
      base,
      server: {
        hmr: { server },
      },
    },
  })

  app.use(devMiddleware)
}

app.use(limitSsrRequests)

app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next()
    return
  }

  try {
    const pageContext = await renderPage({
      urlOriginal: stripBase(req.originalUrl),
      headersOriginal: req.headers,
    })

    if (!pageContext.httpResponse) {
      res.status(404).type('text/plain').set('Cache-Control', 'no-store').send('Not Found')
      return
    }

    const { body, statusCode, headers } = pageContext.httpResponse
    headers.forEach(([name, value]) => res.setHeader(name, value))
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(statusCode).send(body)
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  const body = isProduction ? 'Internal Server Error' : String(error?.stack || error)
  res.status(500).type('text/plain').send(body)
})

server.listen(port, () => {
  console.log(`SSR server running at http://localhost:${port}`)
})

function normalizeBase(value) {
  if (!value || value === '/') return '/'
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function normalizePublicUrl(value) {
  return value.replace(/\/+$/, '')
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchSetupSitemapPaths() {
  try {
    const response = await fetch(`${apiBaseUrl}/shisha/bowl-setups?limit=50&sort=newest`)
    if (!response.ok) return []
    const data = await response.json()
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
    return items
      .map((item) => item?.id)
      .filter(Boolean)
      .map((id) => `/setups/${encodeURIComponent(id)}`)
  } catch (error) {
    console.error('sitemap setup fetch failed:', error)
    return []
  }
}

function getPathname(url) {
  return new URL(url, 'http://localhost').pathname
}

function stripBase(url) {
  if (base === '/') return url
  const pathname = getPathname(url)

  if (!pathname.startsWith(base)) return url
  return `/${url.slice(base.length)}`
}

function limitSsrRequests(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next()
    return
  }

  const now = Date.now()
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
  const bucket = ssrRateBuckets.get(ip) || { count: 0, resetAt: now + ssrRateWindowMs }

  if (bucket.resetAt <= now) {
    bucket.count = 0
    bucket.resetAt = now + ssrRateWindowMs
  }

  bucket.count += 1
  ssrRateBuckets.set(ip, bucket)

  if (ssrRateBuckets.size > 5000) {
    for (const [key, value] of ssrRateBuckets.entries()) {
      if (value.resetAt <= now) ssrRateBuckets.delete(key)
    }
  }

  if (bucket.count > ssrRateLimit) {
    res.status(429).set('Retry-After', Math.ceil((bucket.resetAt - now) / 1000)).send('Too Many Requests')
    return
  }

  next()
}
