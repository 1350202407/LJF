// A tiny in-memory store for shortened links.
// Each entry: { code, url, clicks, createdAt }
const links = new Map()

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function createLink(url) {
  let code = generateCode()
  while (links.has(code)) {
    code = generateCode()
  }
  const entry = { code, url, clicks: 0, createdAt: new Date().toISOString() }
  links.set(code, entry)
  return entry
}

export function getLink(code) {
  return links.get(code)
}

export function recordClick(code) {
  const entry = links.get(code)
  if (!entry) return undefined
  entry.clicks += 1
  return entry
}

export function listLinks() {
  return [...links.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
