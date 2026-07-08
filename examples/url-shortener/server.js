import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

import { app } from './app.js'

// Serve the frontend.
app.get('/', serveStatic({ path: './public/index.html' }))

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`URL shortener running at http://localhost:${info.port}`)
})
