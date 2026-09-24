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

/** Animations and styling the Toaster applies to its toasts. */
type ToastEffects = {
  /** Springy entrance/stacking with a slight overshoot. */
  springy: boolean
  /** Toasts grow out of the element they were triggered from (see `toastOrigin`). */
  fromTrigger: boolean
  /** Swiped-away toasts tilt in the swipe direction and fade. */
  swipeTilt: boolean
  /** Loading → success: the spinner turns into a tick that draws itself; height eases. */
  morphIcon: boolean
  /** Thin bar along the bottom showing time left; pauses while hovered. */
  timerBar: boolean
  /** Description starts hidden behind a chevron that opens it. */
  collapsibleDescription: boolean
  /** Icon and text fade in just after the toast starts moving in. */
  contentFade: boolean
  /** See-through, blurred background. */
  glass: boolean
  /** Thin, short coloured line on the left per type (success, info, warning, error). */
  accentEdge: boolean
  /** Corner roundness; "full" makes a pill. */
  rounded: ToastRounded
  /** Derived: rounded === "full" (extra side padding, rounded buttons). */
  pill: boolean
  /** How a toast leaves on timeout / close: fade out in place, or slide off the screen edge. */
  exitAnimation: "fade" | "slide"
  /** Corner or edge of the screen the toasts stack in. */
  position: ToastPosition
  /** Default time a toast stays, in ms (for the timer bar). */
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

// Each toast reports how far its open description shifts it down; the list
// applies the front toast's shift to the whole collapsed stack.
const StackShiftContext = React.createContext<(id: string, shift: number) => void>(
  () => {}
)

/** Toast data understood by the Toaster. */
type ToastData = {
  /** Viewport point (e.g. a button's centre) the toast grows out of. */
  origin?: { x: number; y: number }
}

/** Centre of an element, for `toast.add({ data: { origin: toastOrigin(el) } })`. */
function toastOrigin(element: Element): ToastData["origin"] {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

// Where the viewport sits. Top positions clear the sticky navbar.
const VIEWPORT_POSITION: Record<ToastPosition, string> = {
  "bottom-right": "bottom-[10vh] sm:right-4 sm:left-auto sm:mx-0",
  "bottom-left": "bottom-[10vh] sm:right-auto sm:left-4 sm:mx-0",
  "bottom-center": "bottom-[10vh]",
  "top-right": "top-20 sm:right-4 sm:left-auto sm:mx-0",
  "top-left": "top-20 sm:right-auto sm:left-4 sm:mx-0",
  "top-center": "top-20",
}

// Swipe-to-dismiss directions per position: away from the screen edge, and
// sideways towards the nearer side.
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

// Stacking for toasts anchored to the bottom (grow upwards) or top (grow
// downwards). Literal strings so Tailwind can see them.
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

// Leaving on timeout / close (swipes have their own exits below).
// Slide: all the way off the screen edge, past the viewport's offset.
// Fade: fades out in place, shrinking slightly.
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

// Plain entrance: slides in from the screen edge.
const ENTER_FROM_EDGE = {
  bottom: "data-starting-style:[transform:translateY(150%)]",
  top: "data-starting-style:[transform:translateY(-150%)]",
}

// Swipe exits. With tilt, left/right rotate the way they're thrown, up/down
// lean slightly, and the toast fades as it goes.
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

// Transitions: springy (overshooting) or smooth moves; height eases longer
// with morphIcon so a loading → success change of text size animates too.
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
  // The whole stack moves down by the front toast's open-description shift,
  // so that toast grows at its lower edge while the toasts above keep their
  // spacing (collapsed or fanned out on hover). Front = newest not leaving.
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

  // Start offset = trigger centre − where the toast settles, set before the
  // first paint while data-starting-style applies.
  React.useLayoutEffect(() => {
    const el = root.current
    const viewport = el?.parentElement
    if (!growFromOrigin || !el || !viewport || !origin) return
    const box = viewport.getBoundingClientRect()
    const height = el.offsetHeight || 64
    const settleY =
      edge === "top" ? box.top + height / 2 : box.bottom - height / 2
    // Measuring above already made the browser compute the starting style
    // without these vars (i.e. no offset). Re-apply it with them, transitions
    // off, so the entrance transition starts from the trigger.
    el.style.transition = "none"
    el.style.setProperty(
      "--from-x",
      `${origin.x - (box.left + box.width / 2)}px`
    )
    el.style.setProperty("--from-y", `${origin.y - settleY}px`)
    void el.offsetWidth
    el.style.transition = ""
    // Only on mount: where it grew from doesn't change afterwards.
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
        // Entrance: from the trigger (small, invisible) or in from the edge.
        growFromOrigin
          ? "data-starting-style:opacity-0 data-starting-style:[transform:translate(var(--from-x),var(--from-y))_scale(0.3)]"
          : ENTER_FROM_EDGE[edge],
        EXIT[effects.exitAnimation][edge],
        // No overshoot on the way out (the springy curve would bounce back).
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
        // Fades in once the toast is on its way. animation-delay (not delay-*),
        // which would also delay the opacity transition above.
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
      // -my-1: a 28px button centred on the 20px title line (row is top-aligned).
      className={cn(
        "-my-1 shrink-0",
        // Hover flips it: foreground fill with background-coloured text
        // (black / white in light mode, white / black in dark mode).
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
        // No hover background (ghost button tints it); the ✕ rotates instead.
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

/** Circle-check whose circle and tick draw themselves (loading → success). */
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
  // Only morph when the type changes after mount (loading → success), not
  // when a toast first appears.
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
        // Old icon spins and shrinks away as the new one spins in.
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

/** Shrinks from full width to nothing over the toast's time; pauses on hover. */
function ToastTimerBar({ duration }: { duration: number }) {
  const { pill } = React.useContext(ToastEffectsContext)
  return (
    <span
      aria-hidden
      style={{ "--toast-timeout": `${duration}ms` } as React.CSSProperties}
      className={cn(
        "pointer-events-none absolute bottom-0 h-0.5 origin-left rounded-full bg-foreground/25 animate-[toast-timer_var(--toast-timeout)_linear_forwards] group-data-expanded/toast:paused motion-reduce:animate-none",
        // Keep clear of the pill's rounded ends.
        pill ? "inset-x-8" : "inset-x-4"
      )}
    />
  )
}

// Description expand / collapse: linear (constant speed).
const EXPAND_MS = 250
const EXPAND_EASE = "linear"
// Opening is bouncy: overshoots its full height slightly, then settles.
const OPEN_MS = 400
const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"
// Keep an opened toast at least this far above the screen's bottom edge.
const SCREEN_MARGIN = 16
// Description fades out for this long before the height collapses.
const FADE_OUT_MS = 150

/** One toast's contents; holds whether its description is open. */
function ToastItem({ toastItem }: { toastItem: ToastPrimitive.Root.ToastObject<ToastData> }) {
  const effects = React.useContext(ToastEffectsContext)
  const reportShift = React.useContext(StackShiftContext)
  // closed → open → closing (description fading out) → closed
  const [phase, setPhase] = React.useState<"closed" | "open" | "closing">(
    "closed"
  )
  const root = React.useRef<HTMLDivElement>(null)
  // Bottom-anchored toasts grow upwards; shifting down by what's added keeps
  // the top edge fixed, so the description opens at the lower end.
  const shiftY = React.useRef(0)
  const closeTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // Accordion-style expand / collapse. Base UI re-measures the toast when the
  // description mounts or unmounts, but jumps to the new height (it measures
  // via height: auto, which CSS can't transition from). So animate it here:
  // old height → new height, once Base UI has applied it but before paint:
  // commit synchronously, so Base UI's re-measure (a MutationObserver
  // microtask) is queued first and ours runs right after it.
  const resize = (next: "open" | "closed", reduceMotion: boolean) => {
    const el = root.current
    const from = el?.offsetHeight
    flushSync(() => setPhase(next))
    if (!el || from === undefined) return
    queueMicrotask(() => {
      const to = el.offsetHeight
      if (to === from) return
      // Bottom stacks grow upwards, so the viewport (whole stack) moves
      // down by what was added, keeping this toast's top edge in place —
      // but never so far that it runs off the screen (it grows up instead).
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
      // Only the front toast's shift moves the stack; animate it in step
      // with the height so the top edge doesn't wobble.
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
    // Fade the text out first, then collapse the height.
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
            // Thin (2px) and short (1.25rem), level with the title line (top-4 =
            // the row's py-4), so it stays put when the description opens.
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
          {/* Collapsible: the description is only rendered while open. Adding
              / removing it makes Base UI re-measure the toast, whose height
              transition then expands / collapses it like an accordion; the
              text fades in just after the expand starts. */}
          {(!collapsible || phase !== "closed") && (
            <ToastDescription
              className={cn(
                // In: fades in once the height is about halfway, finishing
                // with it. Out: fades out before the height collapses. The
                // row is top-aligned, so the title never moves.
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
        {/* Keyed by type so it restarts when loading turns into success. */}
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
