import fs from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)
const base = process.env.BASE || '/'
const clientRoot = path.resolve(__dirname, 'dist/client')

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

let vite
let template
let render

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      send(res, 400, 'Bad Request')
      return
    }

    const pathname = new URL(req.url, 'http://localhost').pathname
    if (pathname.startsWith('/.well-known/appspecific/')) {
      send(res, 204, '')
      return
    }

    if (await serveStatic(req, res)) return

    if (!isProduction) {
      const handled = await new Promise((resolve, reject) => {
        vite.middlewares(req, res, (error) => (error ? reject(error) : resolve(false)))
      })
      if (handled || res.headersSent) return
    }

    const url = req.url.replace(base, '/')
    const html = await createHtml(url)
    send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' })
  } catch (error) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error)
    }

    console.error(error)
    send(res, 500, isProduction ? 'Internal Server Error' : String(error?.stack || error))
  }
})

if (isProduction) {
  template = await fs.readFile(path.join(clientRoot, 'index.html'), 'utf-8')
  const serverEntry = pathToFileURL(path.resolve(__dirname, 'dist/server/entry-server.js')).href
  render = (await import(serverEntry)).render
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
}

const send = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, headers)
  res.end(body)
}

const serveStatic = async (req, res) => {
  if (!isProduction || !req.url) return false

  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const filePath = path.join(clientRoot, pathname)

  if (!filePath.startsWith(clientRoot) || !existsSync(filePath)) return false

  const stat = await fs.stat(filePath)
  if (!stat.isFile()) return false

  const ext = path.extname(filePath)
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(filePath).pipe(res)
  return true
}

const createHtml = async (url) => {
  if (isProduction) {
    const rendered = await render(url)
    return template
      .replace('<!--ssr-styles-->', rendered.styles)
      .replace('<!--ssr-outlet-->', rendered.html)
      .replace('<!--ssr-state-->', rendered.stateScript)
  }

  const rawTemplate = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8')
  const transformedTemplate = await vite.transformIndexHtml(url, rawTemplate)
  const devRender = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
  const rendered = await devRender(url)

  return transformedTemplate
    .replace('<!--ssr-styles-->', rendered.styles)
    .replace('<!--ssr-outlet-->', rendered.html)
    .replace('<!--ssr-state-->', rendered.stateScript)
}

server.listen(port, () => {
  console.log(`SSR server running at http://localhost:${port}`)
})
