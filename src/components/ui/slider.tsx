"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  animate,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
  type Transition,
} from "motion/react"

const smoothEase = [0.22, 1, 0.36, 1] as const

// While dragging, glide over step jumps without trailing the pointer
const DRAG_FOLLOW: Transition = { type: "spring", visualDuration: 0.08, bounce: 0 }

type SliderEdgePress = "none" | "grow" | "shrink"
type SliderMarks = "none" | "dots" | "lines"
type SliderEdgeVariant = "bar" | "filled" | "outline"
type SliderBubble = "none" | "dragging" | "always" | "hover"
type SliderEdgeSize = "sm" | "md" | "lg"
type SliderThickness = "0.5" | "1" | "1.5" | "2.5" | "4" | "13"
type SliderThicken = "none" | "drag" | "hover"
type SliderLabels = "none" | "rail"
type SliderRadius = "none" | "sm" | "md" | "lg" | "xl" | "full"

type SliderMotion = {
  duration: number
  bounce: number
  edgePress: SliderEdgePress
  thicken: SliderThicken
  elastic: boolean
  /** How far the rail can stretch past an end, as a percent of its width. */
  stretch: number
  labels: SliderLabels
  marks: SliderMarks
  bubble: SliderBubble
  edgeVariant: SliderEdgeVariant
  roll: boolean
  showEdge: boolean
  thickenTo: SliderThickness
  radius: SliderRadius
  edgeSize: SliderEdgeSize
  format?: (value: number) => React.ReactNode
}

// Full class names so Tailwind can see them; px sizes the bar thumb to fit inside
const THICKNESS: Record<SliderThickness, { rest: string; drag: string; px: number }> = {
  "0.5": {
    rest: "hpx-horizontal:h-0.5 hpx-vertical:w-0.5",
    drag: "data-dragging:hpx-horizontal:h-0.5 data-dragging:hpx-vertical:w-0.5",
    px: 2,
  },
  "1": {
    rest: "hpx-horizontal:h-1 hpx-vertical:w-1",
    drag: "data-dragging:hpx-horizontal:h-1 data-dragging:hpx-vertical:w-1",
    px: 4,
  },
  "1.5": {
    rest: "hpx-horizontal:h-1.5 hpx-vertical:w-1.5",
    drag: "data-dragging:hpx-horizontal:h-1.5 data-dragging:hpx-vertical:w-1.5",
    px: 6,
  },
  "2.5": {
    rest: "hpx-horizontal:h-2.5 hpx-vertical:w-2.5",
    drag: "data-dragging:hpx-horizontal:h-2.5 data-dragging:hpx-vertical:w-2.5",
    px: 10,
  },
  "4": {
    rest: "hpx-horizontal:h-4 hpx-vertical:w-4",
    drag: "data-dragging:hpx-horizontal:h-4 data-dragging:hpx-vertical:w-4",
    px: 16,
  },
  "13": {
    rest: "hpx-horizontal:h-13 hpx-vertical:w-13",
    drag: "data-dragging:hpx-horizontal:h-13 data-dragging:hpx-vertical:w-13",
    px: 52,
  },
}

const RADIUS: Record<SliderRadius, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const THUMB_SIZE: Record<SliderEdgeSize, string> = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

// Thumb box sizes in px, matching THUMB_SIZE
const THUMB_PX: Record<SliderEdgeSize, number> = { sm: 12, md: 16, lg: 20 }

// Gap kept between the bar and the track end, px
const BAR_GAP = 3

const THUMB_SCALE: Record<SliderEdgePress, number> = { none: 1, grow: 1.25, shrink: 0.8 }

// The bar thumb's resting dot, in px
const DOT_SIZE: Record<SliderEdgeSize, number> = { sm: 10, md: 14, lg: 18 }

// Nudge per unit of stretch, px; 10% stretch nudges about 3px
const NUDGE = 33

// How far the fill runs past the bar edge while the rail is grown, px
const EDGE_EXTEND = 16

// Springy overshoot for the rail growing and shrinking
const GROW =
  "transition-[height,width,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
const RAIL_SPRING: Transition = { type: "spring", visualDuration: 0.3, bounce: 0.2 }

// With reduced motion on, every move lands instantly. Otherwise the transition is unchanged.
function useMotionOk(transition: Transition): Transition {
  return useReducedMotion() ? { duration: 0 } : transition
}

const SliderContext = React.createContext<
  (SliderMotion & { step: number; followCursor: boolean; expanded: boolean; fillEnd: MotionValue<number>; raw: [number, number]; pull: MotionValue<number> }) | null
>(null)

function useSliderMotion() {
  const context = React.useContext(SliderContext)
  if (!context) throw new Error("Slider parts must be used inside <Slider>.")
  return context
}

// Springs a percentage towards the position Base UI computes
function useSmoothPercent(target: number | undefined, dragging: boolean) {
  const { duration, bounce } = useSliderMotion()
  const reduceMotion = useReducedMotion()
  const percent = useMotionValue(target ?? 0)
  const placed = React.useRef(false)

  React.useEffect(() => {
    if (target === undefined || Number.isNaN(target)) return
    // Land on the first measured position instead of sliding in from 0
    if (!placed.current || reduceMotion) {
      placed.current = true
      percent.jump(target)
      return
    }
    const controls = animate(
      percent,
      target,
      dragging ? DRAG_FOLLOW : { type: "spring", visualDuration: duration, bounce }
    )
    return () => controls.stop()
  }, [target, dragging, duration, bounce, reduceMotion, percent])

  return percent
}

function toPercent(value: number) {
  return `${value}%`
}

function readPercent(style: React.CSSProperties | undefined, name: string) {
  const raw = (style as Record<string, unknown> | undefined)?.[name]
  if (raw === undefined || style?.visibility === "hidden") return undefined
  return parseFloat(String(raw))
}

function decimalsOf(step: number) {
  return (String(step).split(".")[1] ?? "").length
}

function Ticks({
  min,
  max,
  step,
  kind,
}: {
  min: number
  max: number
  step: number
  kind: SliderMarks
}) {
  const count = Math.floor((max - min) / step)
  // Too few or dense marks aren't useful
  if (kind === "none" || count < 2 || count > 40) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-between hpx-vertical:flex-col"
    >
      {Array.from({ length: count + 1 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "bg-foreground/25",
            kind === "dots" ? "size-0.5 rounded-full" : "h-2 w-px"
          )}
        />
      ))}
    </div>
  )
}

function Slider({
  duration = 0.4,
  bounce = 0,
  edgePress = "none",
  thicken = "hover",
  elastic = true,
  stretch = 10,
  labels = "rail",
  marks = "none",
  bubble = "hover",
  edgeVariant = "bar",
  roll = true,
  showEdge = true,
  thickenTo = "13",
  radius = "xl",
  edgeSize = "md",
  format,
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  smooth = false,
  onValueChange,
  ...props
}: SliderPrimitive.Root.Props &
  Partial<SliderMotion> & {
    /** Slide freely instead of snapping to each step. */
    smooth?: boolean
  }) {
  const vertical = props.orientation === "vertical"
  // Smooth still lands on tenths, never more precise than that
  const nativeStep = smooth ? Math.min(step, 0.1) : step
  const followCursor = bubble === "hover" && !vertical
  const reduceMotion = useReducedMotion()
  const railSpring = useMotionOk(RAIL_SPRING)

  const options = React.useMemo(
    () => ({
      duration,
      bounce,
      edgePress,
      thicken,
      elastic,
      stretch,
      labels,
      marks,
      bubble,
      edgeVariant,
      roll,
      showEdge,
      thickenTo,
      radius,
      edgeSize,
      format,
      step: nativeStep,
      followCursor,
    }),
    [
      duration,
      bounce,
      edgePress,
      thicken,
      elastic,
      stretch,
      labels,
      marks,
      bubble,
      edgeVariant,
      roll,
      showEdge,
      thickenTo,
      radius,
      edgeSize,
      format,
      nativeStep,
      followCursor,
    ]
  )

  const thumbCount = Array.isArray(value)
    ? value.length
    : Array.isArray(defaultValue)
      ? defaultValue.length
      : 1

  const controlRef = React.useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  // A keyboard user is on a handle: show the same cues a pointer gets
  const [kbFocus, setKbFocus] = React.useState(false)
  // Uncontrolled sliders still need their value for the rail labels
  const [ownValue, setOwnValue] = React.useState(defaultValue ?? min)
  const current = value ?? ownValue
  const [hoverValue, setHoverValue] = React.useState(min)
  // Signed stretch past an end while dragging (fraction of the width), and where the cursor is (%)
  const pull = useMotionValue(0)
  const pullSpring = useSpring(pull, { stiffness: 520, damping: 22, mass: 0.6 })
  const cursor = useMotionValue(0)
  const stretching = elastic && !vertical && !reduceMotion
  const disabled = props.disabled

  React.useEffect(() => {
    const el = controlRef.current
    if (!el || disabled || vertical) return

    const project = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      const stepped = Math.round((fraction * (max - min)) / nativeStep) * nativeStep + min
      cursor.jump(fraction * 100)
      setHoverValue(Math.min(max, Number(stepped.toFixed(decimalsOf(nativeStep)))))
      return rect
    }

    const onEnter = (e: PointerEvent) => {
      project(e)
      setHovering(true)
    }
    const onMove = (e: PointerEvent) => project(e)
    const onLeave = () => setHovering(false)

    const onDown = (e: PointerEvent) => {
      const drag = (ev: PointerEvent) => {
        const rect = project(ev)
        if (!stretching) return
        const past = ev.clientX > rect.right ? ev.clientX - rect.right : Math.min(0, ev.clientX - rect.left)
        // Rubber band: the stretch eases towards a limit the further you go
        pull.set(Math.sign(past) * (stretch / 100) * Math.tanh(Math.abs(past) / 80))
      }
      const release = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", drag)
        window.removeEventListener("pointerup", release)
        window.removeEventListener("pointercancel", release)
        pull.set(0)
        setPressed(false)
        const rect = el.getBoundingClientRect()
        const inside =
          ev.clientX >= rect.left && ev.clientX <= rect.right &&
          ev.clientY >= rect.top && ev.clientY <= rect.bottom
        if (!inside || ev.pointerType !== "mouse") setHovering(false)
      }
      window.addEventListener("pointermove", drag)
      window.addEventListener("pointerup", release)
      window.addEventListener("pointercancel", release)
      project(e)
      setHovering(true)
      setPressed(true)
    }

    const isRange = (t: EventTarget | null): t is HTMLInputElement =>
      t instanceof HTMLInputElement && t.type === "range"

    // Park the value pill above the focused handle and keep it there as keys move it
    const showFor = (input: HTMLInputElement) => {
      const value = Number(input.value)
      const percent = ((value - min) / (max - min)) * 100
      if (reduceMotion) cursor.jump(percent)
      else animate(cursor, percent, RAIL_SPRING)
      setHoverValue(value)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!isRange(e.target) || !e.target.matches(":focus-visible")) return
      showFor(e.target)
      setKbFocus(true)
    }
    const onFocusOut = () => setKbFocus(false)

    // Pressing past an end gives the rail a small rubber-band bump instead of doing nothing
    const onKey = (e: KeyboardEvent) => {
      if (!stretching || !isRange(e.target)) return
      const now = Number(e.target.value)
      const up = ["ArrowRight", "ArrowUp", "PageUp", "End"].includes(e.key)
      const down = ["ArrowLeft", "ArrowDown", "PageDown", "Home"].includes(e.key)
      const bump = (now >= max && up) ? 1 : (now <= min && down) ? -1 : 0
      if (!bump) return
      pull.set(bump * (stretch / 100) * 0.4)
      setTimeout(() => pull.set(0), 120)
    }

    el.addEventListener("focusin", onFocusIn)
    el.addEventListener("focusout", onFocusOut)
    el.addEventListener("keydown", onKey)
    el.addEventListener("pointerenter", onEnter)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    el.addEventListener("pointerdown", onDown)
    return () => {
      el.removeEventListener("focusin", onFocusIn)
      el.removeEventListener("focusout", onFocusOut)
      el.removeEventListener("keydown", onKey)
      el.removeEventListener("pointerenter", onEnter)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      el.removeEventListener("pointerdown", onDown)
    }
  }, [disabled, vertical, stretching, stretch, reduceMotion, min, max, nativeStep, cursor, pull])

  // Stretch from the far edge, squash to match, and nudge towards the pull
  // Base UI moves the value in code on key presses (no native input event), so follow the
  // slider's own value: keep the pill on whichever handle has keyboard focus
  React.useEffect(() => {
    const active = document.activeElement
    if (!kbFocus || !(active instanceof HTMLInputElement) || !controlRef.current?.contains(active)) return
    const now = Number(active.value)
    const percent = ((now - min) / (max - min)) * 100
    if (reduceMotion) cursor.jump(percent)
    else animate(cursor, percent, RAIL_SPRING)
    setHoverValue(now)
  }, [current, kbFocus, min, max, reduceMotion, cursor])

  const stretchX = useTransform(pullSpring, (v) => 1 + Math.abs(v))
  const squashY = useTransform(pullSpring, (v) => 1 - Math.abs(v))
  const origin = useTransform(pullSpring, (v) => (v >= 0 ? "0% 50%" : "100% 50%"))
  const offsetX = useTransform(pullSpring, (v) => v * NUDGE)
  const cursorLeft = useTransform(cursor, toPercent)

  const restThickness = THICKNESS["1"]
  const grown = THICKNESS[options.thickenTo]
  const expanded =
    options.thicken === "hover"
      ? hovering || pressed || kbFocus
      : options.thicken === "drag" && pressed
  const values = Array.isArray(current) ? current : [current as number]
  // Shade the stretch between the value and the cursor, so you see where a click will land
  // The fill runs to the raw value when no edge is shown, so it reaches the track ends
  const toRaw = (v: number) => ((v - min) / (max - min)) * 100
  const rawStart = toRaw(values[0])
  const rawEnd = toRaw(values[values.length - 1])
  // Where the fill really ends, which is not the raw value once the thumb is inset
  const fillEnd = useMotionValue(((values[0] - min) / (max - min)) * 100)
  const ghostLeft = useTransform(() => toPercent(Math.min(cursor.get(), fillEnd.get())))
  const ghostWidth = useTransform(() => toPercent(Math.abs(cursor.get() - fillEnd.get())))
  const cursorAhead = useTransform(() => cursor.get() > fillEnd.get())
  const [ahead, setAhead] = React.useState(false)
  React.useEffect(() => cursorAhead.on("change", setAhead), [cursorAhead])
  const ghostExtend =
    !ahead && options.edgeVariant === "bar" && options.showEdge && expanded ? `${EDGE_EXTEND}px` : "0px"
  const context = React.useMemo(
    () => ({ ...options, expanded, fillEnd, raw: [rawStart, rawEnd] as [number, number], pull: pullSpring }),
    [options, expanded, fillEnd, rawStart, rawEnd, pullSpring]
  )

  return (
    <SliderContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
      <SliderPrimitive.Root
        className={cn("hpx-horizontal:w-full hpx-vertical:h-full", className)}
        data-hpx-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        step={nativeStep}
        thumbAlignment="edge"
        onValueChange={(next, details) => {
          setOwnValue(next)
          onValueChange?.(next, details)
        }}
        {...props}
      >
        <SliderPrimitive.Control
          ref={controlRef}
          className={cn(
            "group/control relative flex w-full cursor-pointer touch-none items-center select-none hpx-disabled:cursor-not-allowed hpx-disabled:opacity-50 hpx-vertical:h-full hpx-vertical:min-h-40 hpx-vertical:w-auto hpx-vertical:flex-col",
            // A tall hit area, so the rail is easy to grab and never shifts the layout as it grows
            options.thicken !== "none" && "hpx-horizontal:min-h-20"
          )}
        >
          <SliderPrimitive.Track
            data-hpx-slot="slider-track"
            className={cn(
              // Min size keeps the springy shrink from dipping below the resting size
              "relative grow overflow-hidden bg-foreground/30 select-none hpx-horizontal:min-h-px hpx-horizontal:w-full hpx-vertical:h-full hpx-vertical:min-w-px",
              GROW,
              RADIUS[options.radius],
              "group-has-focus-visible/control:ring-2 group-has-focus-visible/control:ring-ring/60 group-has-focus-visible/control:ring-offset-2 group-has-focus-visible/control:ring-offset-background",
              expanded ? cn(grown.rest, "opacity-100") : cn(restThickness.rest, "opacity-80"),
              // Vertical sliders don't track hover, so they thicken on drag only
              vertical && options.thicken !== "none" && grown.drag
            )}
            render={
              stretching
                ? (trackProps) => (
                    <motion.div
                      {...(trackProps as React.ComponentProps<typeof motion.div>)}
                      style={
                        {
                          ...trackProps.style,
                          x: offsetX,
                          scaleX: stretchX,
                          scaleY: squashY,
                          transformOrigin: origin,
                        } as MotionStyle
                      }
                    />
                  )
                : undefined
            }
          >
            <Ticks min={min} max={max} step={step} kind={options.marks} />
            {followCursor && values.length === 1 && (
              <motion.div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0",
                  RADIUS[options.radius],
                  // Ahead of the fill it previews more fill; behind it, it lightens what you'd drop
                  ahead ? "rounded-l-none bg-foreground/20" : "z-[2] bg-background/25"
                )}
                style={
                  {
                    "--ghost-left": ghostLeft,
                    "--ghost-width": ghostWidth,
                    // Ahead, start under the fill so its rounded end leaves no gap
                    "--ghost-lead": ahead ? "2rem" : "0px",
                    left: "calc(var(--ghost-left) - var(--ghost-lead))",
                    // Behind the value, run to the far end of the fill like the bar edge does
                    "--ghost-extend": ghostExtend,
                    width: "calc(var(--ghost-width) + var(--ghost-extend) + var(--ghost-lead))",
                  } as unknown as MotionStyle
                }
                initial={false}
                animate={{ opacity: hovering && !pressed && !disabled ? 1 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              />
            )}
            <SliderPrimitive.Indicator
              data-hpx-slot="slider-range"
              className={cn(
                // Percent height ignores the track min size, so repeat it
                "bg-foreground select-none hpx-horizontal:h-full hpx-horizontal:min-h-px hpx-vertical:w-full hpx-vertical:min-w-px",
                RADIUS[options.radius]
              )}
              render={(indicatorProps, state) => (
                <SliderIndicatorElement {...indicatorProps} dragging={state.dragging} />
              )}
            />
          </SliderPrimitive.Track>
          {Array.from({ length: thumbCount }, (_, index) => (
            <SliderThumb key={index} index={index} />
          ))}
          {options.labels === "rail" && !vertical && (
            <>
              <RailLabel side="start" expanded={expanded}>
                {values.map((v, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && "–"}
                    <BubbleLabel value={v} options={context} />
                  </React.Fragment>
                ))}
              </RailLabel>
              <RailLabel side="end" expanded={expanded}>
                <BubbleLabel value={max} options={context} />
              </RailLabel>
            </>
          )}
          <AnimatePresence>
            {followCursor && (hovering || kbFocus) && !disabled && (
              <motion.span
                className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background tabular-nums"
                style={{ left: cursorLeft }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: -14 }}
                exit={{ opacity: 0, y: 12 }}
                transition={railSpring}
              >
                <BubbleLabel value={hoverValue} options={context} />
              </motion.span>
            )}
          </AnimatePresence>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      </MotionConfig>
    </SliderContext.Provider>
  )
}

function SliderIndicatorElement({
  dragging,
  style,
  ...props
}: React.ComponentProps<"div"> & { dragging: boolean }) {
  const options = useSliderMotion()
  // Base UI sizes the fill with CSS variables; spring those instead
  const range = readPercent(style, "--relative-size") !== undefined
  // With no edge shown there is no thumb to sit on, so the fill spans the raw value
  const flush = !options.showEdge
  const [rawStart, rawEnd] = options.raw
  const startTarget = flush ? (range ? rawStart : rawEnd) : readPercent(style, "--start-position")
  const sizeTarget = flush ? rawEnd - rawStart : readPercent(style, "--relative-size")

  const start = useSmoothPercent(startTarget, dragging)
  const end = useSmoothPercent(
    startTarget !== undefined && sizeTarget !== undefined && range ? startTarget + sizeTarget : undefined,
    dragging
  )
  React.useEffect(() => {
    options.fillEnd.set(start.get())
    return start.on("change", (v) => options.fillEnd.set(v))
  }, [start, options.fillEnd])
  const startCss = useTransform(start, toPercent)
  const sizeCss = useTransform(() => toPercent(end.get() - start.get()))

  // The bar edge sits inside the grown fill, with some fill beyond it, instead of on its rim
  const extendTo =
    options.edgeVariant === "bar" && options.showEdge && options.expanded ? EDGE_EXTEND : 0
  const extend = useSpring(extendTo, { stiffness: 400, damping: 30 })
  const reduceMotion = useReducedMotion()
  React.useEffect(() => {
    if (reduceMotion) extend.jump(extendTo)
    else extend.set(extendTo)
  }, [extend, extendTo, reduceMotion])
  const extendCss = useTransform(extend, (v) => `${v}px`)

  return (
    <motion.div
      {...(props as React.ComponentProps<typeof motion.div>)}
      style={
        {
          ...style,
          "--start-position": startCss,
          "--edge-extend": extendCss,
          ...(range
            ? {
                "--relative-size": sizeCss,
                insetInlineStart: "calc(var(--start-position) - var(--edge-extend))",
                width: "calc(var(--relative-size) + 2 * var(--edge-extend))",
              }
            : { width: "calc(var(--start-position) + var(--edge-extend))" }),
        } as unknown as MotionStyle
      }
    />
  )
}

function SliderThumb({ index }: { index: number }) {
  const options = useSliderMotion()

  return (
    <SliderPrimitive.Thumb
      data-hpx-slot="slider-thumb"
      index={index}
      // Screen readers announce the formatted value (e.g. "18°C"), not the bare number
      getAriaValueText={
        options.format
          ? (text, v) => {
              const label = options.format?.(v)
              return typeof label === "string" || typeof label === "number" ? String(label) : text
            }
          : undefined
      }
      className={cn(
        "group/thumb relative block shrink-0 select-none after:absolute after:-inset-2 disabled:pointer-events-none",
        THUMB_SIZE[options.edgeSize]
      )}
      render={(thumbProps, state) => (
        <SliderThumbElement
          {...thumbProps}
          index={index}
          value={state.values[index]}
          dragging={state.dragging}
          options={options}
        />
      )}
    />
  )
}

// Each digit is a 0-9 column that slides to the right number, like an odometer
function RollingNumber({ value }: { value: string }) {
  const roll = useMotionOk({ type: "spring", visualDuration: 0.3, bounce: 0.15 })
  const chars = value.split("")
  return (
    <span className="inline-flex" aria-label={value}>
      {chars.map((char, i) => {
        // Keyed from the right so the ones digit keeps its column as the length changes
        const key = chars.length - i
        return /\d/.test(char) ? (
          <span key={key} aria-hidden className="inline-block h-[1lh] overflow-hidden">
            <motion.span
              className="flex flex-col"
              initial={false}
              animate={{ y: `${-Number(char) * 10}%` }}
              transition={roll}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="h-[1lh]">
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        ) : (
          <span key={key} aria-hidden>
            {char}
          </span>
        )
      })}
    </span>
  )
}

function RailLabel({
  side,
  expanded,
  children,
}: {
  side: "start" | "end"
  expanded: boolean
  children: React.ReactNode
}) {
  const out = side === "start" ? -20 : 20
  const spring = useMotionOk(RAIL_SPRING)
  return (
    // The static wrapper centres it; the inner span moves, so the two transforms don't fight
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 z-[15] -translate-y-1/2",
        side === "start" ? "left-3" : "right-3"
      )}
    >
      <motion.span
        className={cn(
          "flex rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap text-foreground tabular-nums transition-colors duration-300 motion-reduce:transition-none",
          expanded ? "bg-background" : "bg-transparent"
        )}
        initial={false}
        animate={
          expanded
            ? { x: 0, y: 0, scale: 1, opacity: 1 }
            : { x: out, y: -20, scale: 0.9, opacity: side === "start" ? 0.8 : 1 }
        }
        transition={spring}
      >
        {children}
      </motion.span>
    </span>
  )
}

function BubbleLabel({
  value,
  options,
}: {
  value: number
  options: ReturnType<typeof useSliderMotion>
}) {
  const label = options.format ? options.format(value) : value.toFixed(decimalsOf(options.step))
  return options.roll && (typeof label === "string" || typeof label === "number") ? (
    <RollingNumber value={String(label)} />
  ) : (
    label
  )
}

function SliderThumbElement({
  index,
  value,
  dragging,
  options,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
  value: number
  dragging: boolean
  options: ReturnType<typeof useSliderMotion>
}) {
  const railSpring = useMotionOk(RAIL_SPRING)
  const popSpring = useMotionOk({ type: "spring", visualDuration: 0.25, bounce: 0.4 })
  const fade = useMotionOk({ duration: 0.18, ease: smoothEase })
  const position = useSmoothPercent(readPercent(style, "--position"), dragging)
  // The track stretches from its far end, so the thumb rides along and can pass the old end
  const positionCss = useTransform(() => {
    const v = options.pull.get()
    const scale = 1 + Math.abs(v)
    const at = position.get()
    return toPercent(v >= 0 ? at * scale : 100 - scale * (100 - at))
  })

  // Slide the bar towards each end, so it keeps a small gap there instead of the thumb's inset
  const rawPosition = useSmoothPercent(options.raw[index] ?? options.raw[0], dragging)
  const halfBar = options.expanded ? 3 : DOT_SIZE[options.edgeSize] / 2
  const reach = useSpring(halfBar + BAR_GAP, { stiffness: 400, damping: 30 })
  const reduceMotion = useReducedMotion()
  React.useEffect(() => {
    if (reduceMotion) reach.jump(halfBar + BAR_GAP)
    else reach.set(halfBar + BAR_GAP)
  }, [reach, halfBar, reduceMotion])
  const barShift = useTransform(
    () =>
      (reach.get() - THUMB_PX[options.edgeSize] / 2) * (1 - (2 * rawPosition.get()) / 100) +
      options.pull.get() * NUDGE
  )

  const [kbFocus, setKbFocus] = React.useState(false)
  const onThumb = options.bubble === "dragging" || (options.bubble === "hover" && !options.followCursor)
  const show = options.bubble === "always" || (onThumb && (dragging || kbFocus))

  return (
    <motion.div
      {...(props as React.ComponentProps<typeof motion.div>)}
      style={{ ...style, "--position": positionCss } as MotionStyle}
      // Focus events bubble up from the hidden range input; only keyboard focus counts
      onFocus={(e) => setKbFocus((e.target as HTMLElement).matches(":focus-visible"))}
      onBlur={() => setKbFocus(false)}
    >
      {/* Base UI's hidden range input: keyboard, focus and forms */}
      {children}
      {options.edgeVariant === "bar" ? (
        <motion.span
          key="bar"
          aria-hidden
          className={cn(
            "absolute top-1/2 left-1/2 rounded-full shadow-sm ring-ring/50 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none group-has-focus-visible/thumb:ring-3",
            // A mid tone at rest reads on both the fill and the track; the grown bar goes white on the fill
            options.expanded
              ? "bg-background shadow-background"
              : "bg-foreground"
          )}
          initial={false}
          style={{ marginLeft: barShift }}
          animate={{
            x: "-50%",
            y: "-50%",
            width: options.expanded ? 6 : DOT_SIZE[options.edgeSize],
            height: options.expanded
              ? Math.max(DOT_SIZE[options.edgeSize], THICKNESS[options.thickenTo].px - 10)
              : DOT_SIZE[options.edgeSize],
            opacity: options.showEdge ? 1 : 0,
            scale: dragging ? THUMB_SCALE[options.edgePress] : 1,
          }}
          transition={railSpring}
        />
      ) : (
      /* Scale a separate knob so Base UI still measures the thumb at rest size; keys stop the bar's sizing leaking in */
      <motion.span
        key="knob"
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border ring-ring/50 transition-shadow motion-reduce:transition-none group-has-focus-visible/thumb:ring-3",
          options.edgeVariant === "filled"
            ? "border-primary bg-primary"
            : "border-ring bg-background"
        )}
        animate={{
          scale: !options.showEdge ? 0.4 : dragging ? THUMB_SCALE[options.edgePress] : 1,
          opacity: options.showEdge ? 1 : 0,
        }}
        transition={popSpring}
      />
      )}
      <AnimatePresence>
        {show && (
          <motion.span
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums"
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={fade}
          >
            <BubbleLabel value={value} options={options} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export { Slider as HpxSlider, RollingNumber as HpxRollingNumber }
export type { SliderRadius as HpxSliderRadius, SliderLabels as HpxSliderLabels, SliderThicken as HpxSliderThicken, SliderEdgeVariant as HpxSliderEdgeVariant, SliderThickness as HpxSliderThickness, SliderEdgePress as HpxSliderEdgePress, SliderMarks as HpxSliderMarks, SliderBubble as HpxSliderBubble, SliderEdgeSize as HpxSliderEdgeSize }
