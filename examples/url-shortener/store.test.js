import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createLink, recordClick, resetStore } from './store.js'

const DATA_FILE = process.env.URLSHORTENER_DATA_FILE

beforeEach(() => {
  resetStore()
})

describe('store persistence', () => {
  it('writes created links to the data file', () => {
    const { code } = createLink('https://hono.dev')
    const saved = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    expect(saved).toHaveLength(1)
    expect(saved[0].code).toBe(code)
    expect(saved[0].url).toBe('https://hono.dev')
  })

  it('persists click counts across writes', () => {
    const { code } = createLink('https://hono.dev')
    recordClick(code)
    recordClick(code)
    const saved = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    expect(saved[0].clicks).toBe(2)
  })

  it('reloads links from disk on a fresh import', async () => {
    createLink('https://one.example')
    createLink('https://two.example')

    vi.resetModules()
    const fresh = await import('./store.js')

    const urls = fresh
      .listLinks()
      .map((l) => l.url)
      .sort()
    expect(urls).toEqual(['https://one.example', 'https://two.example'])
  })
})
