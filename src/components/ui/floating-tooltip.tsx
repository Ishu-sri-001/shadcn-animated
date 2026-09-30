"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type Transition,
  type Variants,
} from "motion/react"

type FloatingTooltipVariant = "default" | "outline"
type FloatingTooltipRounded = "none" | "sm" | "md" | "lg" | "xl" | "full"
/** cursor: trails the pointer, on the side you choose. anchor: sits on one side of the element it describes. */
type FloatingTooltipFollow = "cursor" | "anchor"
type FloatingTooltipSide = "top" | "bottom" | "left" | "right"
type FloatingTooltipAppear = "scale" | "fade" | "none"
/**
 * What happens when you move to another trigger while a tooltip is open.
 * instant: the text swaps.
 * fade: the box reshapes and the text cross-fades.
 * roll: the box reshapes and the text rolls up or down, the way you moved.
 * slide: the box reshapes and the text slides fully out and in sideways, the way you moved.
 */
type FloatingTooltipChange = "instant" | "fade" | "roll" | "slide"
/** A Tailwind spacing step: "4" is 1rem. */
type FloatingTooltipOffset = "1" | "2" | "3" | "4" | "6" | "8"

type FloatingTooltipOptions = {
  variant: FloatingTooltipVariant
  rounded: FloatingTooltipRounded
  follow: FloatingTooltipFollow
  /** Which side of the cursor or element the tooltip sits on. It is centred on that point. */
  side: FloatingTooltipSide
  offset: FloatingTooltipOffset
  appear: FloatingTooltipAppear
  change: FloatingTooltipChange
  /** The box stretches along the way it is moving, with speed. Needs elastic. */
  stretch: boolean
  /** The box leans into the way it is moving, with speed. Needs elastic. */
  tilt: boolean
  /**
   * The rubbery feel: it overshoots a little, and can stretch and lean with speed.
   * Off, it just glides smoothly to where it is going and stops there.
   */
  elastic: boolean
  /** How tightly it follows. Lower is softer. */
  stiffness: number
  /** Seconds before it closes, so it can stay open while you cross a gap to the next trigger. */
  closeDelay: number
  /** Seconds the box takes to reshape when the text changes. */
  duration: number
  /** How much it overshoots: following (needs elastic) and reshaping for morph. 0 is none. */
  bounce: number
}

const TEXT_SIZE = "px-3.5 py-2.5 text-sm"

const ROUNDED: Record<FloatingTooltipRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const VARIANT: Record<FloatingTooltipVariant, string> = {
  default: "bg-primary text-primary-foreground",
  outline: "border border-border bg-background text-foreground",
}

// Space kept clear at the screen edges, px
const EDGE = 8

// A tap keeps the tooltip open this long: a finger has no hover to end, so it goes by itself
const TOUCH_HOLD = 2500

// A touch fade is slower and softer than a hover's, and the next tooltip waits for the old one to finish
const TOUCH_IN = { duration: 0.45, ease: [0.45, 0, 0.25, 1] } as const
const TOUCH_OUT = { duration: 0.25, ease: [0.45, 0, 0.55, 1] } as const
const TOUCH_SWITCH = 280

type Payload = {
  key: string
  content: React.ReactNode
  description?: React.ReactNode
  contentClassName?: string
  descriptionClassName?: string
}

type Show = (
  payload: Payload,
  anchor: HTMLElement,
  source: "pointer" | "focus" | "touch",
  point?: { x: number; y: number }
) => void

type Controller = {
  show: Show
  move: (point: { x: number; y: number }) => void
  /** Pass the trigger's key so it can only close its own tooltip. */
  hide: (key?: string) => void
  activeKey: string | null
  tooltipId: string
}

const OptionsContext = React.createContext<FloatingTooltipOptions | null>(null)
const ControllerContext = React.createContext<Controller | null>(null)

function useOptions() {
  const value = React.useContext(OptionsContext)
  if (!value) throw new Error("FloatingTooltip must be used inside <FloatingTooltipProvider>.")
  return value
}

function useController() {
  const value = React.useContext(ControllerContext)
  if (!value) throw new Error("FloatingTooltip must be used inside <FloatingTooltipProvider>.")
  return value
}

// With reduced motion on, every move lands instantly. Otherwise the transition is unchanged.
function useMotionOk(transition: Transition): Transition {
  return useReducedMotion() ? { duration: 0 } : transition
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function FloatingTooltipProvider({
  children,
  variant = "default",
  rounded = "md",
  follow = "cursor",
  side = "top",
  offset = "4",
  appear = "scale",
  change = "instant",
  stretch = true,
  tilt = true,
  elastic = true,
  stiffness = 750,
  closeDelay = 0.1,
  duration = 0.35,
  bounce = 0.2,
}: { children: React.ReactNode } & Partial<FloatingTooltipOptions>) {
  const options = React.useMemo(
    () => ({
      variant, rounded, follow, side, offset, appear, change, stretch, tilt,
      elastic, stiffness, closeDelay, duration, bounce,
    }),
    [variant, rounded, follow, side, offset, appear, change, stretch, tilt, elastic, stiffness, closeDelay, duration, bounce]
  )

  const reduceMotion = useReducedMotion()
  const tooltipId = React.useId()
  // The tooltip is portalled to <body>, which only exists on the client
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [open, setOpen] = React.useState(false)
  const [payload, setPayload] = React.useState<Payload | null>(null)
  // 1 when the new trigger is further right (or lower), -1 when further left (or higher)
  const [direction, setDirection] = React.useState(1)
  // A tap, not a hover: no gliding, no sliding, just a fade
  const [touch, setTouch] = React.useState(false)

  const anchorEl = React.useRef<HTMLElement | null>(null)
  const source = React.useRef<"pointer" | "focus" | "touch">("pointer")
  const cursor = React.useRef({ x: 0, y: 0 })
  const size$ = React.useRef({ w: 0, h: 0 })
  const shell = React.useRef<HTMLDivElement>(null)
  const opening = React.useRef(false)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const touchTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const switchTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const optionsRef = React.useRef(options)
  const openRef = React.useRef(open)
  const keyRef = React.useRef<string | null>(null)
  const reduceRef = React.useRef(reduceMotion)

  React.useEffect(() => {
    optionsRef.current = options
    openRef.current = open
    reduceRef.current = reduceMotion
  })

  // Where the tooltip should be (target), and where it is now (spring towards it)
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  // Bounce sets the damping ratio; without elastic it is critical, so no overshoot
  const springDamping = 2 * Math.sqrt(stiffness) * (elastic ? 1 - bounce : 1)
  const sx = useSpring(tx, { stiffness, damping: springDamping })
  const sy = useSpring(ty, { stiffness, damping: springDamping })

  const place = React.useCallback(
    (jump = false) => {
      const o = optionsRef.current
      const { w, h } = size$.current
      const gap = Number(o.offset) * 4
      const vw = window.innerWidth
      const vh = window.innerHeight
      let x = 0
      let y = 0

      // What the tooltip sits beside: the cursor (a single point) or the whole element
      let target: { left: number; right: number; top: number; bottom: number } | null = null
      if (o.follow === "cursor" && source.current === "pointer") {
        const { x: cx, y: cy } = cursor.current
        target = { left: cx, right: cx, top: cy, bottom: cy }
      } else if (anchorEl.current) {
        target = anchorEl.current.getBoundingClientRect()
      }

      if (target) {
        const r = target
        const cx = (r.left + r.right) / 2
        const cy = (r.top + r.bottom) / 2
        // Flip to the opposite side rather than run off the screen
        let side = o.side
        if (side === "top" && r.top - gap - h < EDGE) side = "bottom"
        else if (side === "bottom" && r.bottom + gap + h > vh - EDGE) side = "top"
        else if (side === "left" && r.left - gap - w < EDGE) side = "right"
        else if (side === "right" && r.right + gap + w > vw - EDGE) side = "left"
        // Centred on the hover point along the edge it sits against
        if (side === "top") [x, y] = [cx - w / 2, r.top - gap - h]
        if (side === "bottom") [x, y] = [cx - w / 2, r.bottom + gap]
        if (side === "left") [x, y] = [r.left - gap - w, cy - h / 2]
        if (side === "right") [x, y] = [r.right + gap, cy - h / 2]
      }

      x = clamp(x, EDGE, Math.max(EDGE, vw - w - EDGE))
      y = clamp(y, EDGE, Math.max(EDGE, vh - h - EDGE))
      tx.set(x)
      ty.set(y)
      if (jump || reduceRef.current || source.current === "touch") {
        sx.jump(x)
        sy.jump(y)
      }
    },
    [tx, ty, sx, sy]
  )

  const show = React.useCallback<Show>(
    (next, anchor, from, point) => {
      clearTimeout(closeTimer.current)
      clearTimeout(touchTimer.current)
      clearTimeout(switchTimer.current)
      if (point) cursor.current = point

      const reveal = () => {
        // Which way the tooltip travelled, from where the two triggers sit
        if (openRef.current && anchorEl.current && anchorEl.current !== anchor) {
          const a = anchorEl.current.getBoundingClientRect()
          const b = anchor.getBoundingClientRect()
          const dx = b.left + b.width / 2 - (a.left + a.width / 2)
          const dy = b.top + b.height / 2 - (a.top + a.height / 2)
          setDirection((Math.abs(dx) >= Math.abs(dy) ? dx : dy) >= 0 ? 1 : -1)
        }
        anchorEl.current = anchor
        keyRef.current = next.key
        source.current = from
        setTouch(from === "touch")
        opening.current = !openRef.current
        setPayload(next)
        setOpen(true)
        place(!openRef.current)
        // A finger has no hover to end, so a tap keeps it open for a while, then it goes
        if (from === "touch") {
          touchTimer.current = setTimeout(() => setOpen(false), TOUCH_HOLD)
        }
      }

      if (from === "touch" && openRef.current && anchorEl.current !== anchor) {
        // Tapping another element: fade out where it is, then fade in on the new one. No sliding.
        setOpen(false)
        switchTimer.current = setTimeout(reveal, TOUCH_SWITCH)
      } else reveal()
    },
    [place]
  )

  const move = React.useCallback(
    (point: { x: number; y: number }) => {
      cursor.current = point
      if (openRef.current) place()
    },
    [place]
  )

  const hide = React.useCallback((key?: string) => {
    // The tooltip has moved on to another trigger (a tap can blur the old one after the new one opens)
    if (key && keyRef.current && key !== keyRef.current) return
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), optionsRef.current.closeDelay * 1000)
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      clearTimeout(switchTimer.current)
      setOpen(false)
    }
    // Touching anywhere else, or scrolling, puts away a tooltip a tap opened
    const away = (e: Event) => {
      if (source.current !== "touch" || !openRef.current) return
      // Tapping any trigger is handled by that trigger, so it isn't a tap "elsewhere"
      if (e.type === "pointerdown" && (e.target as Element | null)?.closest?.("[data-floating-tooltip-trigger]")) return
      setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", away, true)
    window.addEventListener("scroll", away, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", away, true)
      window.removeEventListener("scroll", away, true)
      clearTimeout(closeTimer.current)
      clearTimeout(touchTimer.current)
      clearTimeout(switchTimer.current)
    }
  }, [])

  // Keep it placed as the box reshapes, and land it in the right spot the first time it opens
  React.useEffect(() => {
    const el = shell.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      size$.current = { w: el.offsetWidth, h: el.offsetHeight }
      place(opening.current)
      opening.current = false
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, place])

  const controller = React.useMemo(
    () => ({ show, move, hide, activeKey: open ? (payload?.key ?? null) : null, tooltipId }),
    [show, move, hide, open, payload, tooltipId]
  )

  // Speed makes the box stretch and lean, like it has weight
  const vx = useVelocity(sx)
  const stretchOn = useMotionValue(0)
  const tiltOn = useMotionValue(0)
  React.useEffect(() => {
    stretchOn.set(elastic && stretch && !reduceMotion ? 1 : 0)
    tiltOn.set(elastic && tilt && !reduceMotion ? 1 : 0)
  }, [elastic, stretch, tilt, reduceMotion, stretchOn, tiltOn])
  const scaleX = useTransform(() => 1 + clamp(vx.get() / 1000, -1.5, 1.5) * 0.15 * stretchOn.get())
  const scaleY = useTransform(() => 1 - clamp(Math.abs(vx.get()) / 1000, 0, 1.5) * 0.06 * stretchOn.get())
  const skewX = useTransform(() => clamp(vx.get() / 1000, -1.5, 1.5) * 3 * tiltOn.get())

  // On a touch screen it only fades in and out
  const how = touch && appear === "scale" ? "fade" : appear
  const appearIn = how === "scale" ? { opacity: 0, scale: 0.9 } : { opacity: 0 }
  const appearOut = how === "scale" ? { opacity: 0, scale: 0.8 } : { opacity: 0 }
  const enter: Transition =
    how === "none" ? { duration: 0 } : touch ? TOUCH_IN : { duration: 0.12, ease: "easeOut" }
  const exit: Transition =
    how === "none" ? { duration: 0 } : touch ? TOUCH_OUT : { duration: 0.12, ease: "easeIn" }

  return (
    <OptionsContext.Provider value={options}>
      <ControllerContext.Provider value={controller}>
        {children}
        {mounted &&
          createPortal(
            <MotionConfig reducedMotion="user">
              <AnimatePresence>
                {open && payload && (
                  <motion.div
                    key="floating-tooltip"
                    ref={shell}
                    id={tooltipId}
                    role="tooltip"
                    data-hpx-slot="floating-tooltip"
                    className="pointer-events-none fixed top-0 left-0 z-50 w-max"
                    style={{ x: sx, y: sy }}
                    initial={appearIn}
                    animate={{ opacity: 1, scale: 1, transition: enter }}
                    exit={{ ...appearOut, transition: exit }}
                  >
                    <motion.div
                      className={cn(
                        "w-max font-medium",
                        VARIANT[variant],
                        ROUNDED[rounded],
                        change !== "instant" && !touch && "overflow-hidden"
                      )}
                      style={{
                        scaleX,
                        scaleY,
                        skewX,
                        // Grow from the corner nearest the cursor
                        transformOrigin: follow === "cursor" ? "0% 0%" : "50% 50%",
                      }}
                    >
                      <Body payload={payload} direction={direction} touch={touch} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </MotionConfig>,
            document.body
          )}
      </ControllerContext.Provider>
    </OptionsContext.Provider>
  )
}

function Text({ payload }: { payload: Payload }) {
  return (
    // Long text wraps at a comfortable width instead of stretching the tooltip across the screen
    <div className={cn("max-w-xs", TEXT_SIZE)}>
      <div className={payload.contentClassName}>{payload.content}</div>
      {payload.description && (
        <div className={cn("mt-1 font-normal opacity-70", payload.descriptionClassName)}>
          {payload.description}
        </div>
      )}
    </div>
  )
}

function Body({ payload, direction, touch }: { payload: Payload; direction: number; touch: boolean }) {
  const { change } = useOptions()
  // A tap only fades the text out and in: no reshaping, no sliding, whatever the setting
  if (touch) return <FadeOnly payload={payload} />
  if (change === "instant") return <Text payload={payload} />
  return <Morph payload={payload} direction={direction} mode={change} />
}

// The old text fades out, then the new text fades in. The box just becomes the new size.
function FadeOnly({ payload }: { payload: Payload }) {
  const fade = useMotionOk(TOUCH_IN)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={payload.key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
      >
        <Text payload={payload} />
      </motion.div>
    </AnimatePresence>
  )
}

// The box stays put and reshapes to fit the new text, which slides (or fades) in
function Morph({
  payload,
  direction,
  mode,
}: {
  payload: Payload
  direction: number
  mode: FloatingTooltipChange
}) {
  const { duration, bounce } = useOptions()
  const reduceMotion = useReducedMotion()
  const reshape = useMotionOk({ type: "spring", duration, bounce })
  const width = useMotionValue(0)
  const height = useMotionValue(0)
  const placed = React.useRef(false)

  const onSize = React.useCallback(
    (w: number, h: number) => {
      if (!placed.current || reduceMotion) {
        placed.current = true
        width.jump(w)
        height.jump(h)
        return
      }
      animate(width, w, reshape)
      animate(height, h, reshape)
    },
    [width, height, reshape, reduceMotion]
  )

  const slide = mode === "slide" && !reduceMotion
  const roll = mode === "roll" && !reduceMotion
  const shift = (d: number) => (slide ? `${d * 100}%` : 0)
  const variants: Variants = {
    enter: (d: number) => ({ opacity: 0, x: shift(d), y: roll ? `${d * 100}%` : "0%" }),
    center: { opacity: 1, x: 0, y: "0%" },
    exit: (d: number) => ({ opacity: 0, x: shift(-d), y: roll ? `${-d * 100}%` : "0%" }),
  }

  return (
    <motion.div className="relative" style={{ width, height }}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <Measured key={payload.key} onSize={onSize} variants={variants} direction={direction} transition={reshape}>
          <Text payload={payload} />
        </Measured>
      </AnimatePresence>
    </motion.div>
  )
}

function Measured({
  onSize,
  variants,
  direction,
  transition,
  children,
}: {
  onSize: (w: number, h: number) => void
  variants: Variants
  direction: number
  transition: Transition
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isPresent = useIsPresent()

  // Only the block that is showing sizes the box, and it re-measures when it comes back
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !isPresent) return
    onSize(el.offsetWidth, el.offsetHeight)
    const observer = new ResizeObserver(() => onSize(el.offsetWidth, el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [onSize, isPresent])

  return (
    <motion.div
      ref={ref}
      className="absolute top-0 left-0 w-max"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

/** Wrap one element. Hovering or focusing it shows the shared tooltip with this content. */
function FloatingTooltip({
  content,
  description,
  contentClassName,
  descriptionClassName,
  disabled,
  children,
}: {
  content: React.ReactNode
  description?: React.ReactNode
  contentClassName?: string
  descriptionClassName?: string
  disabled?: boolean
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>
}) {
  const controller = useController()
  const key = React.useId()
  const child = children.props

  const payload = (): Payload => ({ key, content, description, contentClassName, descriptionClassName })
  const active = controller.activeKey === key

  return React.cloneElement(children, {
    "data-floating-tooltip-trigger": "",
    "aria-describedby": active ? controller.tooltipId : child["aria-describedby"],
    // A tap is the touch version of hovering: show it on the element, since there is no cursor to follow
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      child.onPointerDown?.(e)
      if (disabled || e.pointerType !== "touch") return
      controller.show(payload(), e.currentTarget, "touch")
    },
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      child.onPointerEnter?.(e)
      if (disabled || e.pointerType === "touch") return
      controller.show(payload(), e.currentTarget, "pointer", { x: e.clientX, y: e.clientY })
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      child.onPointerMove?.(e)
      if (disabled || e.pointerType === "touch") return
      controller.move({ x: e.clientX, y: e.clientY })
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      child.onPointerLeave?.(e)
      // Lifting a finger ends the touch, but the tooltip should outlast it
      if (e.pointerType === "touch") return
      controller.hide(key)
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      child.onFocus?.(e)
      // Only keyboard focus, so clicking a button doesn't leave a tooltip behind
      if (disabled || !e.currentTarget.matches(":focus-visible")) return
      controller.show(payload(), e.currentTarget, "focus")
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      child.onBlur?.(e)
      controller.hide(key)
    },
  } as React.HTMLAttributes<HTMLElement>)
}

export { FloatingTooltip as HpxFloatingTooltip, FloatingTooltipProvider as HpxFloatingTooltipProvider }
export type {
  FloatingTooltipAppear as HpxFloatingTooltipAppear,
  FloatingTooltipChange as HpxFloatingTooltipChange,
  FloatingTooltipFollow as HpxFloatingTooltipFollow,
  FloatingTooltipOffset as HpxFloatingTooltipOffset,
  FloatingTooltipRounded as HpxFloatingTooltipRounded,
  FloatingTooltipSide as HpxFloatingTooltipSide,
  FloatingTooltipVariant as HpxFloatingTooltipVariant,
}
