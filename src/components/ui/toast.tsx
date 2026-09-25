"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "cn"
import {
  ChevronDownIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "@/components/ui/button"

const toast = ToastPrimitive.createToastManager()

type ToastRounded = "none" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"

const ROUNDED: Record<ToastRounded, string> = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
}

type ToastPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left"
  | "top-center"

type ToastEffects = {
  springy: boolean
  fromTrigger: boolean
  swipeTilt: boolean
  morphIcon: boolean
  timerBar: boolean
  collapsibleDescription: boolean
  contentFade: boolean
  /** See-through, blurred background. */
  glass: boolean
  accentEdge: boolean
  rounded: ToastRounded
  pill: boolean
  exitAnimation: "fade" | "slide"
  position: ToastPosition
  timeout: number
}

const DEFAULT_EFFECTS: ToastEffects = {
  springy: true,
  fromTrigger: false,
  swipeTilt: true,
  morphIcon: true,
  timerBar: true,
  contentFade: true,
  collapsibleDescription: true,
  accentEdge: true,
  glass: true,
  rounded: "md",
  pill: false,
  exitAnimation: "fade",
  position: "bottom-center",
  timeout: 5000,
}

const ToastEffectsContext = React.createContext<ToastEffects>(DEFAULT_EFFECTS)

const StackShiftContext = React.createContext<(id: string, shift: number) => void>(
  () => {}
)

type ToastData = {
  origin?: { x: number; y: number }
}

function toastOrigin(element: Element): ToastData["origin"] {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

const VIEWPORT_POSITION: Record<ToastPosition, string> = {
  "bottom-right": "bottom-[10vh] sm:right-4 sm:left-auto sm:mx-0",
  "bottom-left": "bottom-[10vh] sm:right-auto sm:left-4 sm:mx-0",
  "bottom-center": "bottom-[10vh]",
  "top-right": "top-20 sm:right-4 sm:left-auto sm:mx-0",
  "top-left": "top-20 sm:right-auto sm:left-4 sm:mx-0",
  "top-center": "top-20",
}

const SWIPE_DIRECTIONS: Record<
  ToastPosition,
  ("up" | "down" | "left" | "right")[]
> = {
  "bottom-right": ["down", "right"],
  "bottom-left": ["down", "left"],
  "bottom-center": ["down"],
  "top-right": ["up", "right"],
  "top-left": ["up", "left"],
  "top-center": ["up"],
}

const STACK = {
  bottom: [
    "bottom-0 origin-bottom after:top-full",
    "[--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]",
    "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]",
  ],
  top: [
    "top-0 origin-top after:bottom-full",
    "[--offset-y:calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))]",
    "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]",
  ],
}

const EXIT = {
  slide: {
    bottom:
      "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(calc(100%+12vh))]",
    top: "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(calc(-100%-6rem))]",
  },
  fade: {
    bottom:
      "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:opacity-0 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[scale:0.95]",
    top: "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:opacity-0 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[scale:0.95]",
  },
}

const ENTER_FROM_EDGE = {
  bottom: "data-starting-style:[transform:translateY(150%)]",
  top: "data-starting-style:[transform:translateY(-150%)]",
}

const SWIPE_EXIT_TILT = [
  "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))_rotate(4deg)]",
  "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))_rotate(-12deg)]",
  "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))_rotate(12deg)]",
  "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))_rotate(-4deg)]",
  "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))_rotate(4deg)]",
  "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))_rotate(-12deg)]",
  "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))_rotate(12deg)]",
  "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))_rotate(-4deg)]",
  "data-ending-style:data-swipe-direction:opacity-0",
]
const SWIPE_EXIT_PLAIN = [
  "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
  "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
]

const TRANSITION = {
  springMorph:
    "[transition:transform_600ms_cubic-bezier(0.34,1.56,0.64,1),opacity_400ms,height_300ms_cubic-bezier(0.22,1,0.36,1),translate_300ms_cubic-bezier(0.22,1,0.36,1),scale_400ms]",
  spring:
    "[transition:transform_600ms_cubic-bezier(0.34,1.56,0.64,1),opacity_400ms,height_300ms_cubic-bezier(0.22,1,0.36,1),translate_300ms_cubic-bezier(0.22,1,0.36,1),scale_400ms]",
  smoothMorph:
    "[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_300ms_cubic-bezier(0.22,1,0.36,1),translate_300ms_cubic-bezier(0.22,1,0.36,1),scale_400ms]",
  smooth:
    "[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_300ms_cubic-bezier(0.22,1,0.36,1),translate_300ms_cubic-bezier(0.22,1,0.36,1),scale_400ms]",
}

// Coloured left line per type.
const ACCENT: Record<string, string> = {
  success: "before:bg-emerald-500",
  info: "before:bg-sky-500",
  warning: "before:bg-amber-500",
  error: "before:bg-destructive",
}

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({
  className,
  style,
  ...props
}: ToastPrimitive.Viewport.Props) {
  const { position } = React.useContext(ToastEffectsContext)
  const { toasts } = ToastPrimitive.useToastManager()
  const [shifts, setShifts] = React.useState<Record<string, number>>({})
  const reportShift = React.useCallback((id: string, shift: number) => {
    setShifts((prev) => (prev[id] === shift ? prev : { ...prev, [id]: shift }))
  }, [])
  const front = toasts.find((t) => t.transitionStatus !== "ending") ?? toasts[0]
  const stackShift = front ? (shifts[front.id] ?? 0) : 0

  return (
    <StackShiftContext.Provider value={reportShift}>
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        style={{ translate: `0 ${stackShift}px`, ...style }}
        className={cn(
          "pointer-events-none fixed inset-x-4 z-50 mx-auto w-auto max-w-md outline-none transition-[translate] duration-300 ease-out motion-reduce:transition-none sm:w-full",
          VIEWPORT_POSITION[position],
          className
        )}
        {...props}
      />
    </StackShiftContext.Provider>
  )
}

function Toast({
  className,
  origin,
  ref,
  ...props
}: ToastPrimitive.Root.Props & { origin?: ToastData["origin"] }) {
  const effects = React.useContext(ToastEffectsContext)
  const root = React.useRef<HTMLDivElement>(null)
  const edge = effects.position.startsWith("top") ? "top" : "bottom"
  const growFromOrigin = effects.fromTrigger && origin !== undefined

  React.useLayoutEffect(() => {
    const el = root.current
    const viewport = el?.parentElement
    if (!growFromOrigin || !el || !viewport || !origin) return
    const box = viewport.getBoundingClientRect()
    const height = el.offsetHeight || 64
    const settleY =
      edge === "top" ? box.top + height / 2 : box.bottom - height / 2
    el.style.transition = "none"
    el.style.setProperty(
      "--from-x",
      `${origin.x - (box.left + box.width / 2)}px`
    )
    el.style.setProperty("--from-y", `${origin.y - settleY}px`)
    void el.offsetWidth
    el.style.transition = ""
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ToastPrimitive.Root
      ref={(node) => {
        root.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
      data-slot="toast"
      swipeDirection={SWIPE_DIRECTIONS[effects.position]}
      className={cn(
        "group/toast pointer-events-auto absolute right-0 z-[calc(1000-var(--toast-index))] w-full border text-popover-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        ROUNDED[effects.rounded],
        effects.glass
          ? "bg-popover/70 backdrop-blur-md backdrop-saturate-150"
          : "bg-popover",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height)",
        STACK[edge],
        effects.springy
          ? effects.morphIcon
            ? TRANSITION.springMorph
            : TRANSITION.spring
          : effects.morphIcon
            ? TRANSITION.smoothMorph
            : TRANSITION.smooth,
        "motion-reduce:[transition:opacity_200ms]",
        "after:absolute after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0",
        growFromOrigin
          ? "data-starting-style:opacity-0 data-starting-style:[transform:translate(var(--from-x),var(--from-y))_scale(0.3)]"
          : ENTER_FROM_EDGE[edge],
        EXIT[effects.exitAnimation][edge],
        "data-ending-style:ease-in",
        effects.swipeTilt ? SWIPE_EXIT_TILT : SWIPE_EXIT_PLAIN,
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  const { pill, contentFade } = React.useContext(ToastEffectsContext)
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-start gap-3 overflow-hidden py-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        pill ? "px-6" : "px-4",
        contentFade &&
          "animate-in fade-in-0 animation-duration-300 [animation-delay:150ms] fill-mode-backwards motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  const { pill } = React.useContext(ToastEffectsContext)
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn(
        "-my-1 shrink-0",
        "transition-colors duration-200 hover:border-foreground hover:bg-foreground hover:text-background dark:hover:bg-foreground",
        pill && "rounded-full",
        className
      )}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  const { pill } = React.useContext(ToastEffectsContext)
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative -my-1 shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        "hover:bg-transparent dark:hover:bg-transparent",
        "[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out hover:[&_svg]:rotate-90 motion-reduce:[&_svg]:transition-none",
        pill && "rounded-full",
        className
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  )
}

function DrawnCheckIcon() {
  const draw = (delay: number) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.35, delay, ease: "easeOut" as const },
  })
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.circle cx="12" cy="12" r="10" {...draw(0)} />
      <motion.path d="m9 12 2 2 4-4" {...draw(0.25)} />
    </svg>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  const { morphIcon } = React.useContext(ToastEffectsContext)
  const [firstType] = React.useState(type)
  const changed = type !== firstType

  let icon: React.ReactNode = null

  if (type === "success") {
    icon =
      morphIcon && changed ? (
        <DrawnCheckIcon />
      ) : (
        <CircleCheckIcon aria-hidden="true" />
      )
  }

  if (type === "info") {
    icon = <InfoIcon aria-hidden="true" />
  }

  if (type === "warning") {
    icon = <TriangleAlertIcon aria-hidden="true" />
  }

  if (type === "error") {
    icon = <OctagonXIcon className="text-destructive" aria-hidden="true" />
  }

  if (type === "loading") {
    icon = <Loader2Icon className="animate-spin" aria-hidden="true" />
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="relative mt-0.5 grid shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {morphIcon ? (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={type}
            className="col-start-1 row-start-1 flex"
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {icon}
          </motion.span>
        </AnimatePresence>
      ) : (
        icon
      )}
    </span>
  )
}

function ToastTimerBar({ duration }: { duration: number }) {
  const { pill } = React.useContext(ToastEffectsContext)
  return (
    <span
      aria-hidden
      style={{ "--toast-timeout": `${duration}ms` } as React.CSSProperties}
      className={cn(
        "pointer-events-none absolute bottom-0 h-0.5 origin-left rounded-full bg-foreground/25 animate-[toast-timer_var(--toast-timeout)_linear_forwards] group-data-expanded/toast:paused motion-reduce:animate-none",
        pill ? "inset-x-8" : "inset-x-4"
      )}
    />
  )
}

const EXPAND_MS = 250
const EXPAND_EASE = "linear"
const OPEN_MS = 400
const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"
const SCREEN_MARGIN = 16
const FADE_OUT_MS = 150

function ToastItem({ toastItem }: { toastItem: ToastPrimitive.Root.ToastObject<ToastData> }) {
  const effects = React.useContext(ToastEffectsContext)
  const reportShift = React.useContext(StackShiftContext)
  const [phase, setPhase] = React.useState<"closed" | "open" | "closing">(
    "closed"
  )
  const root = React.useRef<HTMLDivElement>(null)
  const shiftY = React.useRef(0)
  const closeTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const resize = (next: "open" | "closed", reduceMotion: boolean) => {
    const el = root.current
    const from = el?.offsetHeight
    flushSync(() => setPhase(next))
    if (!el || from === undefined) return
    queueMicrotask(() => {
      const to = el.offsetHeight
      if (to === from) return
      const viewport = el.parentElement
      const fromShift = shiftY.current
      let toShift = 0
      if (next === "open" && viewport && effects.position.startsWith("bottom")) {
        const restingBottom = viewport.getBoundingClientRect().bottom - fromShift
        const room = window.innerHeight - SCREEN_MARGIN - restingBottom
        toShift = Math.max(0, Math.min(to - from, room))
      }
      shiftY.current = toShift
      reportShift(toastItem.id, toShift)
      if (reduceMotion) return

      const timing =
        next === "open"
          ? { duration: OPEN_MS, easing: OPEN_EASE }
          : { duration: EXPAND_MS, easing: EXPAND_EASE }
      el.animate([{ height: `${from}px` }, { height: `${to}px` }], timing)
      const isFront =
        getComputedStyle(el).getPropertyValue("--toast-index").trim() === "0"
      if (viewport && isFront && toShift !== fromShift) {
        viewport.animate(
          [{ translate: `0 ${fromShift}px` }, { translate: `0 ${toShift}px` }],
          timing
        )
      }
    })
  }

  const toggleDescription = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (phase === "closed") {
      resize("open", reduceMotion)
      return
    }
    if (phase === "closing") return
    if (reduceMotion) {
      resize("closed", true)
      return
    }
    setPhase("closing")
    closeTimer.current = window.setTimeout(
      () => resize("closed", false),
      FADE_OUT_MS
    )
  }

  const duration = toastItem.timeout ?? effects.timeout
  const showTimer =
    effects.timerBar && toastItem.type !== "loading" && duration > 0
  const accent =
    effects.accentEdge && toastItem.type && ACCENT[toastItem.type]
  const collapsible =
    effects.collapsibleDescription && Boolean(toastItem.description)

  return (
    <Toast
      ref={root}
      toast={toastItem}
      origin={toastItem.data?.origin}
      className={cn(
        accent &&
          cn(
            "before:absolute before:top-4 before:h-5 before:w-0.5 before:rounded-full before:content-['']",
            effects.pill ? "before:left-3" : "before:left-2",
            accent
          )
      )}
    >
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          {(!collapsible || phase !== "closed") && (
            <ToastDescription
              className={cn(
                collapsible &&
                  (phase === "closing"
                    ? "animate-out fade-out-0 animation-duration-150 ease-in fill-mode-forwards"
                    : "animate-in fade-in-0 animation-duration-200 [animation-delay:100ms] ease-out fill-mode-backwards"),
                "motion-reduce:animate-none"
              )}
            />
          )}
        </div>
        <ToastAction />
        {collapsible && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={phase === "open"}
            aria-label={phase === "open" ? "Hide details" : "Show details"}
            onClick={toggleDescription}
            className={cn(
              "-my-1 shrink-0 text-muted-foreground hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground dark:hover:bg-transparent dark:aria-expanded:bg-transparent",
              "[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out aria-expanded:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none",
              effects.pill && "rounded-full"
            )}
          >
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        )}
        <ToastClose />
        {showTimer && (
          <ToastTimerBar key={toastItem.type ?? "toast"} duration={duration} />
        )}
      </ToastContent>
    </Toast>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>()
  return toasts.map((toastItem) => (
    <ToastItem key={toastItem.id} toastItem={toastItem} />
  ))
}

function Toaster({
  children,
  toastManager = toast,
  timeout = DEFAULT_EFFECTS.timeout,
  springy = DEFAULT_EFFECTS.springy,
  fromTrigger = DEFAULT_EFFECTS.fromTrigger,
  swipeTilt = DEFAULT_EFFECTS.swipeTilt,
  morphIcon = DEFAULT_EFFECTS.morphIcon,
  timerBar = DEFAULT_EFFECTS.timerBar,
  contentFade = DEFAULT_EFFECTS.contentFade,
  collapsibleDescription = DEFAULT_EFFECTS.collapsibleDescription,
  glass = DEFAULT_EFFECTS.glass,
  accentEdge = DEFAULT_EFFECTS.accentEdge,
  rounded = DEFAULT_EFFECTS.rounded,
  exitAnimation = DEFAULT_EFFECTS.exitAnimation,
  position = DEFAULT_EFFECTS.position,
  ...props
}: ToastPrimitive.Provider.Props & Partial<Omit<ToastEffects, "pill">>) {
  const effects = React.useMemo(
    () => ({
      springy,
      fromTrigger,
      swipeTilt,
      morphIcon,
      timerBar,
      contentFade,
      collapsibleDescription,
      accentEdge,
      glass,
      rounded,
      pill: rounded === "full",
      exitAnimation,
      position,
      timeout,
    }),
    [
      springy,
      fromTrigger,
      swipeTilt,
      morphIcon,
      timerBar,
      contentFade,
      collapsibleDescription,
      accentEdge,
      glass,
      rounded,
      exitAnimation,
      position,
      timeout,
    ]
  )

  return (
    <ToastEffectsContext.Provider value={effects}>
      <ToastProvider toastManager={toastManager} timeout={timeout} {...props}>
        {children}
        <ToastPortal>
          <ToastViewport>
            <ToastList />
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>
    </ToastEffectsContext.Provider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  toastOrigin,
  useToastManager,
  type ToastPosition,
  type ToastRounded,
}
