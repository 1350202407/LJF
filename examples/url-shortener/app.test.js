import { beforeEach, describe, expect, it } from 'vitest'

import { app, isValidHttpUrl } from './app.js'
import { resetStore } from './store.js'

const BASE = 'http://localhost'

async function shorten(url) {
  return app.request('/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

beforeEach(() => {
  resetStore()
})

describe('isValidHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true)
    expect(isValidHttpUrl('https://example.com/a/b?c=1')).toBe(true)
  })

  it('rejects other schemes and garbage', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false)
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isValidHttpUrl('not a url')).toBe(false)
    expect(isValidHttpUrl('')).toBe(false)
  })
})

describe('POST /api/shorten', () => {
  it('creates a short link for a valid URL', async () => {
    const res = await shorten('https://hono.dev')
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.url).toBe('https://hono.dev')
    expect(body.clicks).toBe(0)
    expect(body.code).toMatch(/^[a-zA-Z0-9]{6}$/)
    expect(body.shortUrl).toBe(`${BASE}/${body.code}`)
  })

  it('trims surrounding whitespace from the URL', async () => {
    const res = await shorten('  https://hono.dev  ')
    const body = await res.json()
    expect(body.url).toBe('https://hono.dev')
  })

  it('rejects a missing url field with 400', async () => {
    const res = await app.request('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('The "url" field is required')
  })

  it('rejects a non-http URL with 400', async () => {
    const res = await shorten('ftp://files.example.com')
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Only http:// and https:// URLs are supported')
  })

  it('rejects an invalid JSON body with 400', async () => {
    const res = await app.request('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid JSON body')
  })

  it('generates unique codes for repeated URLs', async () => {
    const a = await (await shorten('https://hono.dev')).json()
    const b = await (await shorten('https://hono.dev')).json()
    expect(a.code).not.toBe(b.code)
  })
})

describe('GET /:code', () => {
  it('redirects to the target and increments the click count', async () => {
    const { code } = await (await shorten('https://hono.dev')).json()

    const res = await app.request(`/${code}`)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://hono.dev')

    await app.request(`/${code}`)
    const stats = await (await app.request(`/api/links/${code}`)).json()
    expect(stats.clicks).toBe(2)
  })

  it('returns 404 for an unknown code', async () => {
    const res = await app.request('/does-not-exist')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/links', () => {
  it('lists links newest first', async () => {
    const first = await (await shorten('https://one.example')).json()
    await new Promise((r) => setTimeout(r, 5))
    const second = await (await shorten('https://two.example')).json()

    const { links } = await (await app.request('/api/links')).json()
    expect(links.map((l) => l.code)).toEqual([second.code, first.code])
    expect(links[0].shortUrl).toBe(`${BASE}/${second.code}`)
  })

  it('returns an empty list when there are no links', async () => {
    const { links } = await (await app.request('/api/links')).json()
    expect(links).toEqual([])
  })
})

describe('GET /api/links/:code', () => {
  it('returns stats for an existing link', async () => {
    const { code } = await (await shorten('https://hono.dev')).json()
    const res = await app.request(`/api/links/${code}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(code)
    expect(body.url).toBe('https://hono.dev')
  })

  it('returns 404 for an unknown code', async () => {
    const res = await app.request('/api/links/nope')
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Not found')
  })
})
