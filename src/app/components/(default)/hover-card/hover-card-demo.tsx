"use client"

import * as React from "react"
import { ShuffleIcon } from "lucide-react"

import { HpxButton } from "@/components/ui/button"
import { HpxInput } from "@/components/ui/input"
import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxHoverCard,
  HpxHoverCardContent,
  HpxHoverCardTrigger,
  type HpxHoverCardAnimation,
  type HpxHoverCardRounded,
} from "@/components/ui/hover-card"

const controls = {
  site: {
    disabled: (v) => v.source !== "link",
    group: "Content",
    type: "text",
    label: "Website",
    value: "vault.hyperiux.com",
    placeholder: "Site name or link",
  },
  source: {
    group: "Content",
    type: "select",
    label: "Card shows",
    value: "link",
    options: [
      { label: "Website preview", value: "link" },
      { label: "Manual details", value: "text" },
    ],
  },
  contentAnimation: {
    group: "Opening",
    type: "select",
    label: "Content in",
    value: "scale",
    options: [
      { label: "Scale + fade", value: "scale" },
      { label: "Fade", value: "fade" },
    ],
  },
  startScale: {
    disabled: (v) => v.contentAnimation === "fade",
    group: "Opening",
    type: "slider",
    label: "Start scale",
    value: 0.9,
    min: 0.5,
    max: 1,
    step: 0.05,
  },
  contentFade: { group: "Opening", type: "checkbox", label: "Content fade-in", value: true },

  openDelay: {
    group: "Timing",
    type: "slider",
    label: "Open after",
    value: 400,
    min: 0,
    max: 1000,
    step: 50,
    unit: "ms",
  },
  closeDelay: {
    group: "Timing",
    type: "slider",
    label: "Close after",
    value: 200,
    min: 0,
    max: 1000,
    step: 50,
    unit: "ms",
  },

  followCursor: { group: "Link", type: "checkbox", label: "Follow the pointer", value: false },
  underline: { group: "Link", type: "checkbox", label: "Underline draws in", value: true },

  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
    ],
  },
} satisfies HpxControlSchema

type LinkPreview = {
  url: string
  hostname: string
  title: string | null
  description: string | null
  siteName: string | null
  image: string | null
  favicon: string | null
}

const SITES = [
  "https://vault.hyperiux.com",
  "https://nextjs.org",
  "https://react.dev",
  "https://tailwindcss.com",
  "https://github.com",
  "https://www.wikipedia.org",
  "https://motion.dev",
]

const DEFAULT_SITE = SITES[0]

// A bare name like "github" becomes github.com
function toUrl(value: string) {
  const text = value.trim()
  if (!text) return null
  const withScheme = /^https?:\/\//i.test(text)
    ? text
    : `https://${/[./:]/.test(text) ? text : `${text}.com`}`
  try {
    return new URL(withScheme).hostname.includes(".") ? withScheme : null
  } catch {
    return null
  }
}

const previewCache = new Map<string, LinkPreview>()

type PreviewState = { url: string; data: LinkPreview | null; error: string | null }

function useLinkPreview(url: string) {
  const [state, setState] = React.useState<PreviewState | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const cached = previewCache.get(url)
    const load = cached
      ? Promise.resolve(cached)
      : fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { signal: controller.signal }).then(
          async (response) => {
            const body = await response.json()
            if (!response.ok) throw new Error(body.error ?? "Could not load that link")
            previewCache.set(url, body)
            return body as LinkPreview
          }
        )
    load
      .then((data) => setState({ url, data, error: null }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ url, data: null, error: error.message })
      })
    return () => controller.abort()
  }, [url])

  const ready = state?.url === url ? state : null
  return { data: ready?.data ?? null, error: ready?.error ?? null, loading: !ready }
}

function LinkPreviewCard({ url, preview }: { url: string; preview: ReturnType<typeof useLinkPreview> }) {
  const [brokenImage, setBrokenImage] = React.useState<string | null>(null)
  const { data, error, loading } = preview
  const host = data?.hostname ?? new URL(url).hostname.replace(/^www\./, "")

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-2">
        <div className="h-[12vh] rounded-md bg-muted" />
        <div className="h-3 w-1/3 rounded-sm bg-muted" />
        <div className="h-4 w-4/5 rounded-sm bg-muted" />
        <div className="h-3 w-full rounded-sm bg-muted" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{host}</span>
        <span className="text-xs text-muted-foreground">{error ?? "No preview available"}</span>
      </div>
    )
  }

  const showImage = data.image && brokenImage !== data.image

  return (
    <div className="flex flex-col gap-2">
      {showImage && (
        // Remote images from any site, so a plain img
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image ?? undefined}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBrokenImage(data.image)}
          className="h-[12vh] w-full rounded-md bg-muted object-cover"
        />
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {data.favicon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.favicon} alt="" referrerPolicy="no-referrer" className="size-4 rounded-xs" />
        )}
        <span className="truncate">{data.siteName ?? host}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="line-clamp-2 leading-snug font-medium">{data.title ?? host}</span>
        {data.description && (
          <span className="line-clamp-3 text-xs text-muted-foreground">{data.description}</span>
        )}
      </div>
      <span className="truncate text-xs text-muted-foreground">{host}</span>
    </div>
  )
}

const roasts = [
  {
    name: "Ethiopia Guji",
    process: "Washed · Light roast",
    notes: "Jasmine, peach and black tea. Bright and clean, best on filter.",
    color: "bg-warning/40",
  },
  {
    name: "Colombia Huila",
    process: "Honey · Medium roast",
    notes: "Red apple, caramel and cocoa. Sweet enough for espresso.",
    color: "bg-destructive/40",
  },
]

export function HpxHoverCardDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const { source } = values
  const options = {
    contentAnimation: values.contentAnimation as HpxHoverCardAnimation,
    startScale: values.startScale,
    contentFade: values.contentFade,
    openDelay: values.openDelay,
    closeDelay: values.closeDelay,
    followCursor: values.followCursor,
    underline: values.underline,
    rounded: values.rounded as HpxHoverCardRounded,
  }

  const draft = values.site
  const [site, setSite] = React.useState(() => toUrl(controls.site.value) ?? DEFAULT_SITE)
  const preview = useLinkPreview(site)
  const linkMode = source === "link"

  // Load the site a moment after typing stops
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const next = toUrl(draft)
      if (next) setSite(next)
    }, 600)
    return () => clearTimeout(timer)
  }, [draft])

  const shuffle = () => {
    const others = SITES.filter((candidate) => candidate !== site)
    const next = others[Math.floor(Math.random() * others.length)]
    panel.set("site", new URL(next).hostname)
    setSite(next)
  }

  const linkClass = values.underline ? "font-medium" : "font-medium underline underline-offset-4"

  const roastLink = (roast: (typeof roasts)[number]) => (
    <HpxHoverCard {...options}>
      <HpxHoverCardTrigger href="#" onClick={(event) => event.preventDefault()} className={linkClass}>
        {roast.name}
      </HpxHoverCardTrigger>
      <HpxHoverCardContent className="flex flex-col gap-2">
        <div className={`h-[8vh] rounded-md ${roast.color}`} />
        <span className="font-medium">{roast.name}</span>
        <span className="text-xs text-muted-foreground">{roast.process}</span>
        <span className="text-muted-foreground">{roast.notes}</span>
      </HpxHoverCardContent>
    </HpxHoverCard>
  )

  const siteLink = (
    <HpxHoverCard {...options}>
      <HpxHoverCardTrigger href={site} target="_blank" rel="noreferrer" className={linkClass}>
        {preview.data?.hostname ?? new URL(site).hostname.replace(/^www\./, "")}
      </HpxHoverCardTrigger>
      <HpxHoverCardContent>
        <LinkPreviewCard url={site} preview={preview} />
      </HpxHoverCardContent>
    </HpxHoverCard>
  )

  return (
    <div className="flex flex-col gap-3">
      {linkMode && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const next = toUrl(draft)
            if (next) setSite(next)
          }}
        >
          <HpxInput
            value={draft}
            onChange={(event) => panel.set("site", event.target.value)}
            placeholder="Site name or link"
            aria-label="Website"
            className="h-9"
          />
          <HpxButton type="button" variant="outline" size="lg" onClick={shuffle}>
            <ShuffleIcon />
            Random
          </HpxButton>
        </form>
      )}
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border px-6 text-sm">
        {linkMode ? (
          <p className="max-w-[60%] text-lg text-center leading-relaxed">
            Worth a read this week: {siteLink}. Hover the link to peek at it.
          </p>
        ) : (
          <p className="max-w-[70%] text-lg text-center leading-relaxed">
            This week&apos;s filter is {roastLink(roasts[0])}, and on espresso we&apos;re pulling{" "}
            {roastLink(roasts[1])} until Saturday.
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {linkMode
          ? "Tip: type a site name or paste a link, then hover it. Some sites block previews."
          : "Tip: hover a coffee name and hold still, or tap it on a touch screen."}
      </p>

      <HpxControlsPanel title="Hover Card" {...panel} />
    </div>
  )
}
