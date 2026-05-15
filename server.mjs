import compression from 'compression'
import express from 'express'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)
const base = normalizeBase(process.env.BASE || '/')
const clientRoot = path.resolve(__dirname, 'dist/client')
const serverEntryPath = path.resolve(__dirname, 'dist/server/entry-server.js')
const htmlHeaders = {
  'Cache-Control': 'no-store, max-age=0',
}

const app = express()
const server = http.createServer(app)

let vite
let template
let render

app.disable('x-powered-by')
app.use(compression())

app.use('/.well-known/appspecific', (_req, res) => {
  res.status(204).end()
})

if (isProduction) {
  template = await fs.readFile(path.join(clientRoot, 'index.html'), 'utf-8')
  render = (await import(pathToFileURL(serverEntryPath).href)).render

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
  const { createServer } = await import('vite')
  vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
}

app.use(async (req, res, next) => {
  try {
    const pathname = getPathname(req.originalUrl)

    if (isProduction && !isNavigationRequest(req, pathname)) {
      res.status(404).type('text/plain').set('Cache-Control', 'no-store').send('Not Found')
      return
    }

    const html = await createHtml(stripBase(req.originalUrl))
    res.status(200).set(htmlHeaders).type('html').send(html)
  } catch (error) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error)
    }

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

function isNavigationRequest(req, pathname) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') return false
  if (pathname.startsWith('/assets/') || path.extname(pathname)) return false

  const accept = req.headers.accept || ''
  return accept.includes('text/html') || accept.includes('*/*') || accept === ''
}

async function createHtml(url) {
  if (isProduction) {
    return injectRenderedHtml(template, await render(url))
  }

  const rawTemplate = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8')
  const transformedTemplate = await vite.transformIndexHtml(url, rawTemplate)
  const devRender = (await vite.ssrLoadModule('/src/entry-server.tsx')).render

  return injectRenderedHtml(transformedTemplate, await devRender(url))
}

function injectRenderedHtml(html, rendered) {
  return html
    .replace('<!--ssr-styles-->', rendered.styles)
    .replace('<!--ssr-outlet-->', rendered.html)
    .replace('<!--ssr-state-->', rendered.stateScript)
}
