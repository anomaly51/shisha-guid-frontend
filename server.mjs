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

const app = express()
const server = http.createServer(app)

app.disable('x-powered-by')
app.use(compression())

app.use('/.well-known/appspecific', (_req, res) => {
  res.status(204).end()
})

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

function getPathname(url) {
  return new URL(url, 'http://localhost').pathname
}

function stripBase(url) {
  if (base === '/') return url
  const pathname = getPathname(url)

  if (!pathname.startsWith(base)) return url
  return `/${url.slice(base.length)}`
}
