// Plain-JS port of feedErrors from MixForge src/shared/feed.ts. Keep the messages identical.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isVideoId = (s) => /^[A-Za-z0-9_-]{11}$/.test(s)
const isObj = (x) => typeof x === 'object' && x !== null && !Array.isArray(x)
const isStr = (x) => typeof x === 'string'
const isStrs = (x) => Array.isArray(x) && x.every(isStr)
const isDate = (x) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x)

function videoErrors(v, at) {
  const e = []
  if (!isStr(v.id) || !isVideoId(v.id)) e.push(`${at}.id is not a video id`)
  if (!isStr(v.title)) e.push(`${at}.title is not a string`)
  if (!isStr(v.channel)) e.push(`${at}.channel is not a string`)
  if (!isDate(v.published)) e.push(`${at}.published is not a date`)
  if (!isStrs(v.tags)) e.push(`${at}.tags is not a list of strings`)
  if (v.note !== undefined && !isStr(v.note)) e.push(`${at}.note is not a string`)
  return e
}

function listErrors(x, name, each) {
  if (!Array.isArray(x)) return [`${name} is not an array`]
  return x.flatMap((item, i) => (isObj(item) ? each(item, `${name}[${i}]`) : [`${name}[${i}] is not an object`]))
}

export function feedErrors(x) {
  if (!isObj(x)) return ['feed is not an object']
  if (x.version !== 1) return ['unsupported feed version']
  const e = []
  if (!isDate(x.updated)) e.push('updated is not a date')
  e.push(...listErrors(x.hot, 'hot', videoErrors))
  e.push(...listErrors(x.viral, 'viral', videoErrors))
  if (!Array.isArray(x.methods)) e.push('methods is not an array')
  else {
    x.methods.forEach((m, i) => {
      const at = `methods[${i}]`
      if (!isObj(m)) e.push(`${at} is not an object`)
      else if ('id' in m) e.push(...videoErrors(m, at))
      else if (isStr(m.title) && isStr(m.tip)) return
      else e.push(`${at} is neither a video nor a tip`)
    })
  }
  e.push(
    ...listErrors(x.news, 'news', (n, at) => {
      const r = []
      if (!isStr(n.title)) r.push(`${at}.title is not a string`)
      if (!isStr(n.body)) r.push(`${at}.body is not a string`)
      if (!isDate(n.date)) r.push(`${at}.date is not a date`)
      if (n.url !== undefined && !isStr(n.url)) r.push(`${at}.url is not a string`)
      return r
    })
  )
  e.push(
    ...listErrors(x.releases, 'releases', (r, at) => {
      const out = []
      if (!isStr(r.version) || !/^\d+\.\d+\.\d+$/.test(r.version)) out.push(`${at}.version is not a version`)
      if (!isStr(r.title)) out.push(`${at}.title is not a string`)
      if (!isStrs(r.notes)) out.push(`${at}.notes is not a list of strings`)
      return out
    })
  )
  if (!isObj(x.suggestions)) e.push('suggestions is not an object')
  else {
    if (!isStrs(x.suggestions.artists)) e.push('suggestions.artists is not a list of strings')
    if (!isStrs(x.suggestions.genres)) e.push('suggestions.genres is not a list of strings')
  }
  return e
}

const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

function checkFile(file) {
  let data
  try {
    data = load(file)
  } catch (err) {
    console.error(`${file}: ${err.message}`)
    return false
  }
  const errors = feedErrors(data)
  if (errors.length) {
    console.error(`${file}:\n` + errors.map((m) => `  ${m}`).join('\n'))
    return false
  }
  const videos = data.hot.length + data.viral.length + data.methods.filter((m) => 'id' in m).length
  const tips = data.methods.filter((m) => !('id' in m)).length
  console.log(`ok: ${videos} videos, ${tips} tips, ${data.news.length} news, ${data.releases.length} release`)
  return true
}

function selfTest() {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'samples')
  let bad = 0
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const expectValid = name.includes('.valid.')
    const errors = feedErrors(load(path.join(dir, name)))
    const ok = expectValid ? errors.length === 0 : errors.length > 0
    console.log(`${ok ? 'ok' : 'MISMATCH'}: ${name} ${expectValid ? 'is valid' : 'is rejected'}`)
    if (!ok) bad++
  }
  return bad === 0
}

const arg = process.argv[2] ?? 'feed.json'
const pass = arg === '--self-test' ? selfTest() : checkFile(arg)
process.exit(pass ? 0 : 1)
