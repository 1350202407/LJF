import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Isolate the persisted data file so tests never touch a real data/links.json.
const dir = mkdtempSync(join(tmpdir(), 'url-shortener-'))
process.env.URLSHORTENER_DATA_FILE = join(dir, 'links.json')
