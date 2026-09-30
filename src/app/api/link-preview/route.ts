import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const MAX_BYTES = 600_000
const TIMEOUT_MS = 6000
const MAX_REDIRECTS = 3

function isPrivateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isPrivateIp(ip: string) {
  if (isIP(ip) === 4) return isPrivateV4(ip)
  const lower = ip.toLowerCase()
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateV4(mapped[1])
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  )
}

// Blocks private and internal addresses
async function assertPublic(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https links")
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That address is not public")
  }
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address)
  if (addresses.length === 0 || addresses.some(isPrivateIp)) throw new Error("That address is not public")
}

async function fetchHtml(start: URL) {
  let current = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(current)
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
    })
    const location = response.headers.get("location")
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current)
      continue
    }
    if (!response.ok) throw new Error(`The site answered with ${response.status}`)
    if (!(response.headers.get("content-type") ?? "").includes("html")) throw new Error("Not a web page")

    // Only the head matters, so stop reading early
    const reader = response.body?.getReader()
    if (!reader) throw new Error("Empty response")
    const decoder = new TextDecoder()
    let html = ""
    let bytes = 0
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break
    }
    reader.cancel().catch(() => {})
    return { html, finalUrl: current }
  }
  throw new Error("Too many redirects")
}

function decode(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function attributes(tag: string) {
  const found: Record<string, string> = {}
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    found[match[1].toLowerCase()] = match[2] ?? match[3] ?? ""
  }
  return found
}

function absolute(value: string | undefined, base: URL) {
  if (!value) return null
  try {
    const resolved = new URL(value, base)
    return resolved.protocol === "http:" || resolved.protocol === "https:" ? resolved.href : null
  } catch {
    return null
  }
}

function parse(html: string, base: URL) {
  const head = html.split(/<\/head>/i)[0]
  const meta: Record<string, string> = {}
  for (const tag of head.match(/<meta\s[^>]*>/gi) ?? []) {
    const attrs = attributes(tag)
    const key = (attrs.property ?? attrs.name)?.toLowerCase()
    if (key && attrs.content && !(key in meta)) meta[key] = attrs.content
  }

  let icon: string | undefined
  for (const tag of head.match(/<link\s[^>]*>/gi) ?? []) {
    const attrs = attributes(tag)
    if (attrs.rel && /\bicon\b/i.test(attrs.rel) && attrs.href) {
      icon = attrs.href
      break
    }
  }

  const title = meta["og:title"] ?? meta["twitter:title"] ?? head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const description = meta["og:description"] ?? meta["twitter:description"] ?? meta.description
  const site = meta["og:site_name"]

  return {
    url: base.href,
    hostname: base.hostname.replace(/^www\./, ""),
    title: title ? decode(title) : null,
    description: description ? decode(description) : null,
    siteName: site ? decode(site) : null,
    image: absolute(meta["og:image"] ?? meta["twitter:image"], base),
    favicon: absolute(icon, base) ?? absolute("/favicon.ico", base),
  }
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")
  if (!target) return Response.json({ error: "Missing url" }, { status: 400 })

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`)
  } catch {
    return Response.json({ error: "That is not a valid link" }, { status: 400 })
  }

  try {
    const { html, finalUrl } = await fetchHtml(url)
    return Response.json(parse(html, finalUrl), {
      headers: { "cache-control": "public, max-age=3600" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load that link"
    return Response.json({ error: message }, { status: 502 })
  }
}
