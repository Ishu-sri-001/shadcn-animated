"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { useGSAP } from "@gsap/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  Reorder,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type HTMLMotionProps,
  type MotionValue,
} from "motion/react"

import { Button } from "@/components/ui/button"

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP, Flip, MorphSVGPlugin)

type MotionDivProps = Omit<HTMLMotionProps<"div">, "layout" | "values">

type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"

const spring = { type: "spring", visualDuration: 0.4, bounce: 0.25 } as const
const settle = { type: "spring", visualDuration: 0.3, bounce: 0 } as const
const springyEase = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

function matchParentRadius(rect: SVGRectElement | null) {
  const parent = rect?.ownerSVGElement?.parentElement
  if (!rect || !parent) return
  const radius = getComputedStyle(parent).borderTopLeftRadius
  rect.setAttribute("rx", radius)
  rect.setAttribute("ry", radius)
}

const subscribeNoop = () => () => {}
function useIsClient() {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
}

const AttachmentReorderContext = React.createContext<{ draggable: boolean } | null>(null)

const AttachmentTiltContext = React.createContext<MotionValue<number> | null>(null)

const attachmentVariants = cva(
  "group/attachment relative isolate flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
  }
)

function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  enter = true,
  enterDelay = 0,
  enterFrom,
  leave = true,
  borderTrace = true,
  shake = true,
  fill = false,
  fillDirection = "left-to-right",
  progress = 0,
  value,
  ref,
  style,
  onPointerDown,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState
    enter?: boolean
    enterDelay?: number
    enterFrom?: { x: number; y: number }
    leave?: boolean
    borderTrace?: boolean
    shake?: boolean
    fill?: boolean
    fillDirection?: "left-to-right" | "bottom-to-top"
    /** 0–100. Drives the upload fill. */
    progress?: number
    value?: string | number
  }) {
  const reduceMotion = useReducedMotion()
  const reorderContext = React.useContext(AttachmentReorderContext)
  const inReorder = reorderContext !== null && value !== undefined
  const draggable = inReorder && reorderContext.draggable
  const dragControls = useDragControls()
  const node = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const skewX = React.useContext(AttachmentTiltContext)

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el
      assignRef(ref, el)
    },
    [ref]
  )

  const flyFrom = React.useRef(enterFrom)
  React.useLayoutEffect(() => {
    const el = node.current
    const from = flyFrom.current
    if (!el || !from || reduceMotion) return
    el.scrollIntoView({ block: "nearest", inline: "nearest" })
    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true) as HTMLElement
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "50",
      pointerEvents: "none",
      transform: "none",
      opacity: "0",
    })
    document.body.append(ghost)
    el.style.visibility = "hidden"
    const flight = animate(
      ghost,
      {
        x: [from.x - (rect.left + rect.width / 2), 0],
        y: [from.y - (rect.top + rect.height / 2), 0],
        scale: [0.3, 1],
        opacity: [0, 1],
      },
      { ...spring, visualDuration: 0.6, delay: enterDelay }
    )
    const land = () => {
      ghost.remove()
      el.style.visibility = ""
    }
    flight.then(land)
    return () => {
      flight.stop()
      land()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Shake when an upload fails.
  const lastState = React.useRef(state)
  React.useEffect(() => {
    const was = lastState.current
    lastState.current = state
    if (!shake || reduceMotion || state !== "error" || was === "error") return
    animate(x, [0, -6, 6, -4, 4, -2, 0], { duration: 0.45, ease: "easeOut" })
  }, [state, shake, reduceMotion, x])

  const flying = enterFrom !== undefined
  const filling = fill && (state === "uploading" || state === "processing")
  const motionProps = {
    ref: setRef,
    "data-slot": "attachment",
    "data-state": state,
    "data-filling": filling || undefined,
    "data-size": size,
    "data-orientation": orientation,
    className: cn(
      attachmentVariants({ size, orientation }),
      draggable && "cursor-grab select-none",
      className
    ),
    style: { ...style, x, ...(skewX && { skewX, originY: 1 }) },
    initial: enter && !flying ? { opacity: 0, scale: 0.8 } : false,
    animate: { opacity: 1, scale: 1, transition: { ...spring, delay: enterDelay } },
    exit: leave ? { opacity: 0, scale: 0.8, transition: settle } : undefined,
    transition: { layout: spring },
    ...(props as MotionDivProps),
  }

  const horizontalFill = fillDirection === "left-to-right"
  const content = (
    <>
      <AnimatePresence>
        {filling && (
          <motion.span
            key="fill"
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            exit={{ opacity: 0, transition: settle }}
          >
            <motion.span
              className={cn(
                "absolute inset-0 rounded-none bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)]",
                horizontalFill ? "origin-left" : "origin-bottom"
              )}
              initial={horizontalFill ? { scaleX: 0 } : { scaleY: 0 }}
              animate={horizontalFill ? { scaleX: progress / 100 } : { scaleY: progress / 100 }}
              transition={settle}
            />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {borderTrace && (state === "uploading" || state === "processing") && (
          <AttachmentBorderTrace key="trace" />
        )}
      </AnimatePresence>
      {children}
    </>
  )

  return (
    <MotionConfig reducedMotion="user">
      {inReorder ? (
        <Reorder.Item
          as="div"
          value={value}
          dragListener={false}
          dragControls={dragControls}
          whileDrag={{ scale: 1.04, zIndex: 10, cursor: "grabbing" }}
          onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
            onPointerDown?.(event)
            const onControl = (event.target as HTMLElement).closest("button, a, input")
            if (draggable && event.pointerType === "mouse" && !onControl) dragControls.start(event)
          }}
          {...motionProps}
        >
          {content}
        </Reorder.Item>
      ) : (
        <motion.div
          layout
          onPointerDown={onPointerDown}
          {...motionProps}
        >
          {content}
        </motion.div>
      )}
    </MotionConfig>
  )
}

function AttachmentBorderTrace() {
  const rect = React.useRef<SVGRectElement>(null)

  useGSAP(() => {
    matchParentRadius(rect.current)
    gsap.fromTo(
      rect.current,
      { strokeDashoffset: 0 },
      { strokeDashoffset: -100, duration: 1.4, ease: "none", repeat: -1 }
    )
  })

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute -inset-px z-10 size-[calc(100%+2px)] overflow-visible text-primary motion-reduce:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <rect
        ref={rect}
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="22 78"
      />
    </motion.svg>
  )
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:transition-[opacity,scale,filter] *:duration-500 group-data-filling/attachment:bg-card group-data-filling/attachment:opacity-100 [&_img]:transition-opacity [&_img]:duration-500 group-data-filling/attachment:[&_img]:opacity-60 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

function AttachmentMedia({
  className,
  variant = "icon",
  zoom = true,
  develop = true,
  expandable = true,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentMediaVariants> & {
    zoom?: boolean
    develop?: boolean
    expandable?: boolean
  }) {
  const isImage = variant === "image"
  const canExpand = isImage && expandable
  const [open, setOpen] = React.useState(false)
  const layoutId = React.useId()
  const isClient = useIsClient()

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(
        attachmentMediaVariants({ variant }),
        isImage &&
          zoom &&
          cn("*:transition-[opacity,scale,filter] *:duration-500 group-hover/attachment:*:scale-110", springyEase),
        isImage &&
          develop &&
          "transition-opacity duration-700 group-data-[state=processing]/attachment:*:blur-xs group-data-[state=uploading]/attachment:*:blur-sm",
        className
      )}
      {...props}
    >
      {canExpand ? (
        <>
          {!open && (
            <motion.div
              layoutId={layoutId}
              role="button"
              tabIndex={0}
              aria-label="Open preview"
              onTap={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setOpen(true)
                }
              }}
              transition={spring}
              className="size-full cursor-zoom-in overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {children}
            </motion.div>
          )}
          {isClient &&
            createPortal(
              <MotionConfig reducedMotion="user">
                <AnimatePresence>
                  {open && (
                    <motion.div
                      key="preview"
                      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-background/80 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setOpen(false)}
                    >
                      <motion.div
                        layoutId={layoutId}
                        role="dialog"
                        aria-label="Preview"
                        transition={spring}
                        className="aspect-square w-[min(80vw,80vh)] overflow-hidden rounded-2xl shadow-2xl [&_img]:size-full [&_img]:object-cover"
                      >
                        {children}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </MotionConfig>,
              document.body
            )}
        </>
      ) : (
        children
      )}
    </div>
  )
}

const SPINNER_PATH = "M21 12a9 9 0 1 1-6.219-8.56"
const CHECK_PATH = "M20 6 9 17l-5-5"
const CROSS_PATH = "M18 6 6 18M6 6l12 12"

function AttachmentStatusIcon({
  state,
  icon: Icon,
}: {
  state: AttachmentState
  icon: React.ElementType
}) {
  const reduceMotion = useReducedMotion()
  const loading = state === "uploading" || state === "processing"
  const svg = React.useRef<SVGSVGElement>(null)
  const path = React.useRef<SVGPathElement>(null)
  const [showIcon, setShowIcon] = React.useState(state === "done" || state === "idle")
  const [iconEnters] = React.useState(!showIcon)
  const [initialPath] = React.useState(state === "error" ? CROSS_PATH : SPINNER_PATH)

  useGSAP(
    () => {
      if (showIcon || !path.current || !svg.current) return
      const target = loading ? SPINNER_PATH : state === "error" ? CROSS_PATH : CHECK_PATH
      gsap.to(path.current, {
        morphSVG: target,
        duration: reduceMotion ? 0 : 0.5,
        ease: "power2.inOut",
      })
      gsap.killTweensOf(svg.current, "rotation")
      if (loading && !reduceMotion) {
        gsap.to(svg.current, {
          rotation: "+=360",
          duration: 0.8,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        })
      } else {
        const turned = Number(gsap.getProperty(svg.current, "rotation"))
        gsap.to(svg.current, {
          rotation: Math.ceil(turned / 360) * 360,
          duration: reduceMotion ? 0 : 0.4,
          ease: "power2.out",
          transformOrigin: "50% 50%",
        })
      }
      if (state === "done") gsap.delayedCall(reduceMotion ? 0 : 1.1, () => setShowIcon(true))
    },
    { dependencies: [state, showIcon, loading, reduceMotion] }
  )

  if (showIcon) {
    return (
      <motion.span
        className="flex"
        initial={iconEnters ? { opacity: 0, scale: 0.4 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
      >
        <Icon />
      </motion.span>
    )
  }

  return (
    <svg
      ref={svg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path ref={path} d={initialPath} />
    </svg>
  )
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentTitle({
  className,
  shimmer = true,
  ...props
}: React.ComponentProps<"span"> & {
  shimmer?: boolean
}) {
  return (
    <span
      data-slot="attachment-title"
      className={cn(
        "block max-w-full min-w-0 truncate font-medium",
        shimmer &&
          "group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        className
      )}
      {...props}
    />
  )
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive/80",
        "max-w-full",
        className
      )}
      {...props}
    />
  )
}

function AttachmentProgress({
  className,
  value,
  rolling = true,
  ...props
}: React.ComponentProps<"span"> & {
  /** 0–100. */
  value: number
  rolling?: boolean
}) {
  const text = String(Math.round(value))

  if (!rolling) {
    return (
      <span data-slot="attachment-progress" className={cn("tabular-nums", className)} {...props}>
        {text}%
      </span>
    )
  }

  const digits = text.split("")
  return (
    <span data-slot="attachment-progress" className={cn("tabular-nums", className)} {...props}>
      <span className="sr-only">{text}%</span>
      {digits.map((digit, i) => (
        <RollingDigit key={digits.length - i} digit={Number(digit)} />
      ))}
      <span aria-hidden>%</span>
    </span>
  )
}

const digitRoll = { type: "spring", visualDuration: 0.15, bounce: 0 } as const

function RollingDigit({ digit }: { digit: number }) {
  return (
    <span aria-hidden className="relative inline-block [clip-path:inset(0)]">
      <span className="invisible">{digit}</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={digitRoll}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  )
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentAction({
  className,
  variant,
  size = "icon-xs",
  reveal = false,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  reveal?: boolean
}) {
  const [turns, setTurns] = React.useState(0)

  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      onClick={(event) => {
        onClick?.(event)
        setTurns((t) => t + 1)
      }}
      className={cn(
        reveal &&
          cn(
            "transition-[scale,rotate,opacity,background-color] duration-300 [&_svg]:transition-[rotate,scale] [&_svg]:duration-300 hover:[&_svg]:scale-110 hover:[&_svg]:rotate-90",
            "pointer-fine:scale-50 pointer-fine:-rotate-90 pointer-fine:opacity-0",
            "pointer-fine:group-hover/attachment:scale-100 pointer-fine:group-hover/attachment:rotate-0 pointer-fine:group-hover/attachment:opacity-100",
            "pointer-fine:group-focus-within/attachment:scale-100 pointer-fine:group-focus-within/attachment:rotate-0 pointer-fine:group-focus-within/attachment:opacity-100",
            springyEase,
            "[&_svg]:ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          ),
        className
      )}
      {...props}
    >
      <motion.span
        className="flex"
        initial={false}
        animate={{ rotate: turns * 360 }}
        transition={{ type: "spring", visualDuration: 0.6, bounce: 0.2 }}
      >
        {children}
      </motion.span>
    </Button>
  )
}

function AttachmentTrigger({
  className,
  render,
  type,
  ...props
}: useRender.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: render ? type : (type ?? "button"),
        className: cn("absolute inset-0 z-10 outline-none", className),
      },
      props
    ),
    render,
    state: {
      slot: "attachment-trigger",
    },
  })
}

function AttachmentGroup({
  className,
  reorder = true,
  values,
  onReorder,
  tilt = false,
  wrap = false,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  reorder?: boolean
  values?: (string | number)[]
  onReorder?: (values: (string | number)[]) => void
  tilt?: boolean
  wrap?: boolean
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [initialWrap] = React.useState(wrap)

  React.useEffect(() => {
    const group = scroller.current
    if (!group || group.dataset.wrap === String(wrap)) return
    const apply = () => {
      group.dataset.wrap = String(wrap)
    }
    if (reduceMotion) return apply()
    const flip: { tween?: gsap.core.Timeline } = {}
    const frame = requestAnimationFrame(() => {
      const items = Array.from(
        group.querySelectorAll<HTMLElement>(":scope > [data-slot=attachment]")
      )
      const state = Flip.getState([group, ...items])
      apply()
      group.style.overflow = "clip"
      flip.tween = Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
        nested: true,
        stagger: 0.015,
        onComplete: () => {
          gsap.set(items, { clearProps: "transform,width,height" })
          gsap.set(group, { clearProps: "width,height,overflow" })
        },
      })
    })
    return () => {
      cancelAnimationFrame(frame)
      flip.tween?.progress(1)
    }
  }, [wrap, reduceMotion])
  React.useEffect(() => {
    const group = scroller.current
    if (!group) return
    const measure = () => {
      group.dataset.overflow = String(group.scrollWidth > group.clientWidth + 1)
    }
    const resize = new ResizeObserver(measure)
    const observeChildren = () => {
      resize.disconnect()
      resize.observe(group)
      for (const child of group.children) resize.observe(child)
      measure()
    }
    const mutations = new MutationObserver(observeChildren)
    mutations.observe(group, { childList: true })
    observeChildren()
    return () => {
      resize.disconnect()
      mutations.disconnect()
    }
  }, [])

  const { scrollX } = useScroll({ container: scroller })
  const speed = useSpring(useVelocity(scrollX), { stiffness: 300, damping: 40 })
  const lean = useTransform(speed, [-1500, 1500], [12, -12], { clamp: true })

  const reorderable = values !== undefined && onReorder !== undefined
  const reorderContext = React.useMemo(() => ({ draggable: reorder }), [reorder])
  const groupProps = {
    ref: scroller,
    "data-slot": "attachment-group",
    "data-wrap": String(initialWrap),
    className: cn(
      "relative flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 no-scrollbar gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
      "data-[overflow=false]:scroll-fade-none data-[wrap=true]:snap-none data-[wrap=true]:scroll-fade-none data-[wrap=true]:flex-wrap data-[wrap=true]:overflow-visible",
      className
    ),
    style,
    ...(props as MotionDivProps),
  }

  return (
    <MotionConfig reducedMotion="user">
      <AttachmentReorderContext.Provider value={reorderable ? reorderContext : null}>
        <AttachmentTiltContext.Provider value={tilt ? lean : null}>
          {reorderable ? (
            <Reorder.Group
              as="div"
              axis={wrap ? "xy" : "x"}
              values={values}
              onReorder={onReorder}
              {...groupProps}
            >
              {children}
            </Reorder.Group>
          ) : (
            <motion.div {...groupProps}>{children}</motion.div>
          )}
        </AttachmentTiltContext.Provider>
      </AttachmentReorderContext.Provider>
    </MotionConfig>
  )
}

function AttachmentDropzone({
  className,
  onFiles,
  marching = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  onFiles?: (files: File[], point: { x: number; y: number }) => void
  marching?: boolean
}) {
  const [dragging, setDragging] = React.useState(false)
  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files")

  return (
    <div
      data-slot="attachment-dropzone"
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setDragging(false)
        onFiles?.(Array.from(event.dataTransfer.files), { x: event.clientX, y: event.clientY })
      }}
      className={cn(
        "relative rounded-lg border transition-colors data-dragging:bg-muted/50",
        marching ? "data-dragging:border-transparent" : "data-dragging:border-dashed data-dragging:border-primary",
        className
      )}
      {...props}
    >
      {children}
      <AnimatePresence>{marching && dragging && <MarchingBorder key="border" />}</AnimatePresence>
    </div>
  )
}

function MarchingBorder() {
  const rect = React.useRef<SVGRectElement>(null)
  React.useLayoutEffect(() => matchParentRadius(rect.current), [])

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.rect
        ref={rect}
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
      />
    </motion.svg>
  )
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentDropzone,
  AttachmentMedia,
  AttachmentStatusIcon,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentProgress,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
}
