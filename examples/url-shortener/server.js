import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

import { createLink, getLink, listLinks, recordClick } from './store.js'

const app = new Hono()

function isValidHttpUrl(value) {
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

// Create a short link.
app.post('/api/shorten', async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  if (!url) {
    return c.json({ error: 'The "url" field is required' }, 400)
  }
  if (!isValidHttpUrl(url)) {
    return c.json({ error: 'Only http:// and https:// URLs are supported' }, 400)
  }

  const entry = createLink(url)
  const shortUrl = new URL(`/${entry.code}`, c.req.url).toString()
  return c.json({ ...entry, shortUrl }, 201)
})

// List all short links with their click counts.
app.get('/api/links', (c) => {
  const shortLinks = listLinks().map((entry) => ({
    ...entry,
    shortUrl: new URL(`/${entry.code}`, c.req.url).toString(),
  }))
  return c.json({ links: shortLinks })
})

// Stats for a single short link.
app.get('/api/links/:code', (c) => {
  const entry = getLink(c.req.param('code'))
  if (!entry) {
    return c.json({ error: 'Not found' }, 404)
  }
  const shortUrl = new URL(`/${entry.code}`, c.req.url).toString()
  return c.json({ ...entry, shortUrl })
})

// Serve the frontend.
app.use('/', serveStatic({ path: './public/index.html' }))

// Redirect a short link to its target and track the click.
app.get('/:code', (c) => {
  const entry = recordClick(c.req.param('code'))
  if (!entry) {
    return c.text('Short link not found', 404)
  }
  return c.redirect(entry.url, 302)
})

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`URL shortener running at http://localhost:${info.port}`)
})
