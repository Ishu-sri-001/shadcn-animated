"use client"

import * as React from "react"
import { cn } from "cn"
import {
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PlusIcon,
  RotateCwIcon,
  XIcon,
} from "lucide-react"
import { AnimatePresence } from "motion/react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentDropzone,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentStatusIcon,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment"

type State = "uploading" | "processing" | "error" | "done"

type Item = {
  id: string
  name: string
  size: number
  type: string
  kind: "file" | "image"
  state: State
  progress: number
  /** Object URL for uploaded images. */
  preview?: string
  gradient?: string
  error?: string
  retryable?: boolean
  failAt?: number
  from?: { x: number; y: number }
  delay: number
}

const MAX_SIZE = 10 * 1024 * 1024
const TICK = 200
const PROCESSING_TICKS = 5
const FAIL_CHANCE = 0.3
const DELETE_STAGGER_MS = 60

const seed: Item[] = [
  { id: "seed-1", name: "Q3-report.pdf", size: 2.4e6, type: "application/pdf", kind: "file", state: "done", progress: 100, delay: 0 },
  { id: "seed-2", name: "roast-schedule.xlsx", size: 1.1e6, type: "", kind: "file", state: "error", progress: 0, error: "Upload failed", retryable: true, delay: 0 },
  { id: "seed-3", name: "hero.jpg", size: 1.2e6, type: "image/jpeg", kind: "image", state: "done", progress: 100, gradient: "from-amber-300 to-rose-400", delay: 0 },
  { id: "seed-4", name: "beans.jpg", size: 8.6e5, type: "image/jpeg", kind: "image", state: "done", progress: 100, gradient: "from-emerald-300 to-sky-400", delay: 0 },
  { id: "seed-5", name: "cup.jpg", size: 2.1e6, type: "image/jpeg", kind: "image", state: "done", progress: 100, gradient: "from-violet-300 to-fuchsia-400", delay: 0 },
]

const controls = {
  enter: { group: "Adding", type: "checkbox", label: "Spring in", value: true },
  stagger: { group: "Adding", type: "slider", label: "Stagger", value: 0.08, min: 0, max: 0.3, step: 0.01, unit: "s" },
  flyIn: { group: "Adding", type: "checkbox", label: "Fly in from drop", value: true },
  marching: { group: "Adding", type: "checkbox", label: "Drop zone border", value: true },

  leave: { group: "Layout", type: "checkbox", label: "Shrink out on remove", value: true },

  rolling: { group: "Progress", type: "checkbox", label: "Rolling percentage", value: true },
  shimmer: { group: "Progress", type: "checkbox", label: "Title shimmer", value: true },
  borderTrace: { group: "Progress", type: "checkbox", label: "Border trace", value: true },
  fill: { group: "Progress", type: "checkbox", label: "Card fill (images)", value: true },
  fillDirection: {
    group: "Progress",
    type: "select",
    label: "Fill direction",
    value: "bottom-to-top",
    options: [
      { label: "Left to right", value: "left-to-right" },
      { label: "Bottom to top", value: "bottom-to-top" },
    ],
  },

  shake: { group: "States", type: "checkbox", label: "Error shake", value: true },

  reveal: { group: "Hover", type: "checkbox", label: "Reveal remove button", value: true },
  zoom: { group: "Hover", type: "checkbox", label: "Image zoom", value: true },
  develop: { group: "Hover", type: "checkbox", label: "Blur until uploaded", value: true },

  reorder: { group: "Group", type: "checkbox", label: "Drag to reorder", value: true },
  tilt: { group: "Group", type: "checkbox", label: "Tilt on scroll", value: false },
  wrap: { group: "Group", type: "checkbox", label: "Wrap", value: false },
  expand: { group: "Group", type: "checkbox", label: "Open image preview", value: true },

  failures: { group: "Demo", type: "checkbox", label: "Simulate failures", value: true },
} satisfies ControlSchema

function truncateName(name: string, limit = 20) {
  return name.length > limit ? `${name.slice(0, limit)}…` : name
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(item: Item) {
  if (/sheet|excel|csv/.test(item.type) || /\.(xlsx?|csv)$/.test(item.name)) return FileSpreadsheetIcon
  if (/zip|compressed|tar/.test(item.type) || /\.(zip|rar|7z|tar|gz)$/.test(item.name)) return FileArchiveIcon
  return FileTextIcon
}

export function UploadDemo() {
  const panel = useControls(controls)
  const { values } = panel

  const [items, setItems] = React.useState<Item[]>(seed)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const processing = React.useRef(new Map<string, number>())
  const deleteTimers = React.useRef<number[]>([])
  React.useEffect(() => () => deleteTimers.current.forEach((t) => window.clearTimeout(t)), [])

  const busy = items.some((item) => item.state === "uploading" || item.state === "processing")

  React.useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => {
      setItems((current) =>
        current.map((item) => {
          if (item.state === "uploading") {
            if (item.size > MAX_SIZE && item.progress > 15) {
              return { ...item, state: "error", error: `Over 10 MB · ${formatSize(item.size)}`, retryable: false }
            }
            const progress = Math.min(100, item.progress + 4 + Math.random() * 9)
            if (item.failAt !== undefined && progress >= item.failAt) {
              return { ...item, progress, state: "error", error: "Upload failed", retryable: true }
            }
            return progress >= 100
              ? { ...item, progress: 100, state: "processing" }
              : { ...item, progress }
          }
          if (item.state === "processing") {
            const ticks = (processing.current.get(item.id) ?? 0) + 1
            processing.current.set(item.id, ticks)
            if (ticks < PROCESSING_TICKS) return item
            processing.current.delete(item.id)
            return { ...item, state: "done" }
          }
          return item
        })
      )
    }, TICK)
    return () => window.clearInterval(timer)
  }, [busy])

  const itemsRef = React.useRef(items)
  React.useEffect(() => {
    itemsRef.current = items
  })
  React.useEffect(
    () => () => itemsRef.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview)),
    []
  )

  function addFiles(files: File[], from?: { x: number; y: number }) {
    if (!files.length) return
    const added = files.map<Item>((file, i) => {
      const image = file.type.startsWith("image/")
      return {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        kind: image ? "image" : "file",
        state: "uploading",
        progress: 0,
        preview: image ? URL.createObjectURL(file) : undefined,
        failAt: values.failures && Math.random() < FAIL_CHANCE ? 30 + Math.random() * 50 : undefined,
        from,
        delay: i * values.stagger,
      }
    })
    setItems((current) => [...current, ...added])
  }

  function remove(id: string) {
    setItems((current) => {
      const item = current.find((i) => i.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return current.filter((i) => i.id !== id)
    })
    processing.current.delete(id)
  }

  function removeAll() {
    deleteTimers.current.forEach((t) => window.clearTimeout(t))
    const order = [
      ...items.filter((item) => item.kind === "file"),
      ...items.filter((item) => item.kind === "image"),
    ].reverse()
    deleteTimers.current = order.map((item, i) =>
      window.setTimeout(() => remove(item.id), i * DELETE_STAGGER_MS)
    )
  }

  function retry(id: string) {
    setItems((current) =>
      current.map((item) =>
        // Retries always succeed.
        item.id === id
          ? { ...item, state: "uploading", progress: 0, error: undefined, failAt: undefined, delay: 0 }
          : item
      )
    )
  }

  function reorder(kind: Item["kind"], ids: (string | number)[]) {
    setItems((current) => {
      const byId = new Map(current.map((item) => [item.id, item]))
      const moved = ids.flatMap((id) => byId.get(String(id)) ?? [])
      return [...moved, ...current.filter((item) => item.kind !== kind)]
    })
  }

  function describe(item: Item) {
    switch (item.state) {
      case "uploading":
        return (
          <>
            Uploading · <AttachmentProgress value={item.progress} rolling={values.rolling} />
          </>
        )
      case "processing":
        return "Processing…"
      case "error":
        return item.error ?? "Upload failed"
      case "done":
        return `${item.name.split(".").pop()?.toUpperCase()} · ${formatSize(item.size)}`
    }
  }

  function renderItem(item: Item) {
    const image = item.kind === "image"
    return (
      <Attachment
        key={item.id}
        value={item.id}
        state={item.state}
        orientation={image ? "vertical" : "horizontal"}
        enter={values.enter}
        enterDelay={item.delay}
        enterFrom={values.flyIn ? item.from : undefined}
        leave={values.leave}
        borderTrace={values.borderTrace}
        shake={values.shake}
        fill={image && values.fill}
        fillDirection={values.fillDirection as "left-to-right" | "bottom-to-top"}
        progress={item.progress}
      >
        {image ? (
          <AttachmentMedia
            variant="image"
            zoom={values.zoom}
            develop={values.develop}
            expandable={values.expand}
          >
            {item.preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL
              <img src={item.preview} alt={item.name} draggable={false} />
            ) : (
              <div className={`size-full bg-linear-to-br ${item.gradient}`} />
            )}
          </AttachmentMedia>
        ) : (
          <AttachmentMedia>
            <AttachmentStatusIcon state={item.state} icon={fileIcon(item)} />
          </AttachmentMedia>
        )}
        <AttachmentContent>
          <AttachmentTitle shimmer={values.shimmer} title={item.name}>
            {truncateName(item.name)}
          </AttachmentTitle>
          <AttachmentDescription>{describe(item)}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          {item.state === "error" && item.retryable && (
            <AttachmentAction
              variant={image ? "secondary" : undefined}
              aria-label={`Retry ${item.name}`}
              onClick={() => retry(item.id)}
            >
              <RotateCwIcon />
            </AttachmentAction>
          )}
          <AttachmentAction
            variant={image ? "secondary" : undefined}
            reveal={values.reveal}
            aria-label={`Remove ${item.name}`}
            onClick={() => remove(item.id)}
          >
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    )
  }

  const files = items.filter((item) => item.kind === "file")
  const images = items.filter((item) => item.kind === "image")

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[2vw] font-semibold">Demo 1 · File upload</h2>
        <p className="text-sm text-muted-foreground">
          Click &ldquo;Add files&rdquo; or drop files here. Drag to reorder, click an image to open it.
        </p>
      </div>
      <div className="flex items-center justify-between gap-6">
        <Attachment state="idle" enter={false}>
          <AttachmentMedia>
            <PlusIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Add files</AttachmentTitle>
            <AttachmentDescription>Up to 10 MB each</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger aria-label="Add files" onClick={() => inputRef.current?.click()} />
        </Attachment>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={removeAll}
          className={cn(
            "relative shrink-0 text-sm font-medium text-muted-foreground transition-[color,opacity] outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40",
            "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
            "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
          )}
        >
          Delete all
        </button>
      </div>

      <AttachmentDropzone
        marching={values.marching}
        onFiles={addFiles}
        className="flex min-h-76 flex-col gap-4 p-6 max-md:p-4"
      >
        <AttachmentGroup
          reorder={values.reorder}
          tilt={values.tilt}
          wrap={values.wrap}
          values={files.map((item) => item.id)}
          onReorder={(ids) => reorder("file", ids)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {files.map(renderItem)}
          </AnimatePresence>
        </AttachmentGroup>

        <AttachmentGroup
          reorder={values.reorder}
          tilt={values.tilt}
          wrap={values.wrap}
          values={images.map((item) => item.id)}
          onReorder={(ids) => reorder("image", ids)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {images.map(renderItem)}
          </AnimatePresence>
        </AttachmentGroup>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />
      </AttachmentDropzone>

      <ControlsPanel title="Attachment" {...panel} />
    </section>
  )
}
