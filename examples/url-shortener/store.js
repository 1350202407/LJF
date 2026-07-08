import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

// Each entry: { code, url, clicks, createdAt }
// Links are persisted to a JSON file so they survive restarts.
const DATA_FILE = process.env.URLSHORTENER_DATA_FILE || 'data/links.json'

const links = new Map()

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

function load() {
  if (!existsSync(DATA_FILE)) return
  try {
    const entries = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry && typeof entry.code === 'string') {
          links.set(entry.code, entry)
        }
      }
    }
  } catch {
    // Ignore a missing or corrupt file and start with an empty store.
  }
}

function save() {
  const dir = dirname(DATA_FILE)
  if (dir && dir !== '.' && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(DATA_FILE, JSON.stringify([...links.values()], null, 2))
}

load()

export function createLink(url) {
  let code = generateCode()
  while (links.has(code)) {
    code = generateCode()
  }
  const entry = { code, url, clicks: 0, createdAt: new Date().toISOString() }
  links.set(code, entry)
  save()
  return entry
}

export function getLink(code) {
  return links.get(code)
}

export function recordClick(code) {
  const entry = links.get(code)
  if (!entry) return undefined
  entry.clicks += 1
  save()
  return entry
}

export function listLinks() {
  return [...links.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Clear all links and remove the persisted file. Intended for tests.
export function resetStore() {
  links.clear()
  rmSync(DATA_FILE, { force: true })
}
