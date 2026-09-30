"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionStyle,
  type Transition,
} from "motion/react"

/** elastic: the handle squashes when pressed and stretches as it travels. apple: a glass capsule that turns see-through when pressed, and can be dragged. */
type SwitchVariant = "elastic" | "apple"
type SwitchSize = "md" | "lg" | "xl"
type SwitchColor = "foreground" | "green" | "blue" | "orange" | "rose"
type SwitchRounded = "sm" | "md" | "lg" | "xl" | "full"
type SwitchLabelSide = "top" | "right" | "bottom" | "left"

type SwitchMotion = {
  variant: SwitchVariant
  size: SwitchSize
  /** Track colour when on. "foreground" is the theme foreground. */
  color: SwitchColor
  /** With "foreground" colour, use the system green on the apple switch. */
  green: boolean
  rounded: SwitchRounded
  /** How hard the handle squashes (elastic) or widens (apple) when pressed. */
  squeeze: number
  /** Travel time of the handle, in seconds. */
  duration: number
  bounce: number
  /** Small I / O marks in the track. */
  marks: boolean
  labelSide: SwitchLabelSide
}

// Track and handle sizes. The numbers are what the animation needs; the classes size the track.
const SIZE: Record<
  SwitchSize,
  { track: string; w: number; d: number; gap: number; label: string; mark: string }
> = {
  md: { track: "h-6.5 w-11", w: 44, d: 20, gap: 2, label: "gap-2.5 text-base", mark: "text-[0.6rem]" },
  lg: { track: "h-9 w-16", w: 64, d: 28, gap: 4, label: "gap-3 text-xl", mark: "text-xs" },
  xl: { track: "h-13 w-24", w: 96, d: 40, gap: 6, label: "gap-5 text-3xl", mark: "text-lg" },
}

// The apple switch is a little longer than the elastic one
const APPLE_WIDE: Record<SwitchSize, { track: string; w: number }> = {
  md: { track: "h-6.5 w-17", w: 68 },
  lg: { track: "h-9 w-25", w: 100 },
  xl: { track: "h-13 w-36", w: 144 },
}

const TRACK_ROUNDED: Record<SwitchRounded, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

// One step tighter than the track, so the handle sits concentric inside it
const HANDLE_ROUNDED: Record<SwitchRounded, string> = {
  sm: "rounded-xs",
  md: "rounded-sm",
  lg: "rounded-md",
  xl: "rounded-lg",
  full: "rounded-full",
}

// On a dark page "on" is the dark grey that "off" used to be, not a bright fill
const FOREGROUND = "bg-foreground dark:bg-secondary"

const ON_COLOR: Record<SwitchColor, string> = {
  foreground: FOREGROUND,
  green: "bg-success",
  blue: "bg-info",
  orange: "bg-warning",
  rose: "bg-destructive",
}

const IOS_GREEN = "bg-success"
const OFF: Record<SwitchVariant, string> = {
  elastic: "bg-foreground/20 dark:bg-foreground/10",
  apple: "bg-foreground/20 dark:bg-foreground/10",
}

const FAST: Transition = { type: "spring", duration: 0.15, bounce: 0 }
const SNAP: Transition = { type: "spring", duration: 0.4, bounce: 0.5 }

function Switch({
  variant = "elastic",
  size = "xl",
  color = "foreground",
  green = false,
  rounded = "full",
  squeeze = 0.18,
  duration = 0.35,
  bounce = 0.3,
  marks = false,
  labelSide = "right",
  label,
  className,
  labelClassName,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: Omit<SwitchPrimitive.Root.Props, "children" | "className" | "render"> &
  Partial<SwitchMotion> & {
    label?: React.ReactNode
    className?: string
    labelClassName?: string
  }) {
  const reduceMotion = useReducedMotion()
  const spec = { ...SIZE[size], ...(variant === "apple" ? APPLE_WIDE[size] : null) }
  // The apple handle is a wider capsule, like the system switch
  const handleW = variant === "apple" ? Math.round(spec.d * 1.4) : spec.d
  const handleH = variant === "apple" ? Math.round(spec.d * 1.1) : spec.d
  const travel = spec.w - handleW - spec.gap * 2
  // Only the apple switch can be dragged, like the system one
  const canDrag = variant === "apple"

  const [own, setOwn] = React.useState(defaultChecked ?? false)
  const on = checked ?? own

  // Where the handle is, and how it is squashed or widened
  const x = useMotionValue(on ? travel : 0)
  const scaleX = useMotionValue(1)
  const scaleY = useMotionValue(1)
  const widen = useMotionValue(0)
  const lift = useMotionValue(0)
  const fillOpacity = useTransform(x, [0, travel], [0, 1])
  const offOpacity = useTransform(x, [0, travel], [1, 0])
  // The apple handle grows both ways, so it can overhang the track ends
  const appleX = useTransform(() => x.get() - widen.get() / 2)
  const appleWidth = useTransform(widen, (w) => handleW + w)
  const appleHeight = useTransform(lift, (h) => handleH + h)
  // 0 at rest, 1 while pressed: the capsule goes from milky white to clear glass
  const glass = useMotionValue(0)
  const glassBg = useTransform(glass, (g) => `color-mix(in oklab, var(--background) ${(1 - 0.7 * g) * 100}%, transparent)`)
  const glassBlur = useTransform(glass, (g) => `blur(${g * 10}px) saturate(${1 + g * 0.8})`)
  const glassShadow = useTransform(glass, (g) =>
    [
      `0 ${2 + g * 2}px ${8 + g * 6}px rgba(0,0,0,${0.2 - g * 0.08})`,
      `inset 0 0 0 1px rgba(255,255,255,${0.35 + g * 0.35})`,
      `inset 0 2px 3px rgba(255,255,255,${0.9 - g * 0.3})`,
      `inset 0 -2px 4px rgba(0,0,0,${0.06 + g * 0.06})`,
    ].join(",")
  )

  const ok = (t: Transition): Transition => (reduceMotion ? { duration: 0 } : t)
  const travelSpring: Transition = { type: "spring", duration, bounce }

  const dragging = React.useRef(false)
  const suppressClick = React.useRef(false)
  const allowClick = React.useRef(false)
  const start = React.useRef({ pointer: 0, handle: 0 })

  // Follow the state: slide the handle, with a stretch on the way for elastic
  const previous = React.useRef(on)
  React.useEffect(() => {
    if (previous.current === on) return
    previous.current = on
    animate(x, on ? travel : 0, ok(travelSpring))
    if (variant === "elastic" && !reduceMotion) {
      animate(scaleX, 1 + squeeze * 0.85, FAST).then(() => animate(scaleX, 1, SNAP))
      animate(scaleY, 1 - squeeze * 0.65, FAST).then(() => animate(scaleY, 1, SNAP))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  // Snap to a new size if it changes
  React.useEffect(() => {
    x.jump(on ? travel : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel])

  const change = (next: boolean, details: Parameters<NonNullable<typeof onCheckedChange>>[1]) => {
    setOwn(next)
    onCheckedChange?.(next, details)
  }

  const press = () => {
    if (reduceMotion) return
    if (variant === "elastic") {
      animate(scaleX, 1 - squeeze, FAST)
      animate(scaleY, 1 + squeeze * 0.55, FAST)
    } else {
      // The glass swells wider and stands a little taller than the track
      const cover = Math.min(1, squeeze / 0.2)
      // No bounce, so it lands on its final size and stays exactly that through a drag
      const swell: Transition = { type: "spring", duration: 0.25, bounce: 0 }
      animate(widen, (spec.w * 0.68 - handleW) * cover, swell)
      animate(lift, handleH * Math.min(0.75, squeeze * 2.8), swell)
      animate(glass, 1, FAST)
    }
  }
  const release = () => {
    if (variant === "elastic") {
      animate(scaleX, 1, ok(SNAP))
      animate(scaleY, 1, ok(SNAP))
    } else {
      animate(widen, 0, ok({ type: "spring", duration: 0.35, bounce: 0.25 }))
      animate(lift, 0, ok({ type: "spring", duration: 0.35, bounce: 0.25 }))
      animate(glass, 0, ok({ duration: 0.3, ease: "easeOut" }))
    }
  }

  const rootRef = React.useRef<HTMLElement>(null)

  const fill = color === "foreground" && variant === "apple" && green ? IOS_GREEN : ON_COLOR[color]

  const control = (
    <SwitchPrimitive.Root
      ref={rootRef as React.Ref<HTMLSpanElement>}
      data-hpx-slot="switch"
      data-variant={variant}
      checked={on}
      disabled={disabled}
      onCheckedChange={(next, details) => change(next, details)}
      onPointerDown={(e) => {
        if (disabled) return
        press()
        if (!canDrag) return
        dragging.current = false
        start.current = { pointer: e.clientX, handle: x.get() }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!canDrag || !e.currentTarget.hasPointerCapture(e.pointerId)) return
        const dx = e.clientX - start.current.pointer
        if (!dragging.current && Math.abs(dx) < 3) return
        dragging.current = true
        x.set(Math.min(travel, Math.max(0, start.current.handle + dx)))
      }}
      onPointerUp={(e) => {
        release()
        if (!canDrag || !dragging.current) return
        dragging.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
        // The click the browser sends after a drag must not flip it a second time
        suppressClick.current = true
        setTimeout(() => (suppressClick.current = false), 100)
        if (x.get() > travel / 2 !== on) {
          // Flip through the switch's own click, so a parent that controls it hears about it
          allowClick.current = true
          e.currentTarget.click()
        } else animate(x, on ? travel : 0, ok(travelSpring))
      }}
      onPointerLeave={release}
      onPointerCancel={release}
      onClickCapture={(e) => {
        if (allowClick.current) {
          allowClick.current = false
          return
        }
        if (!suppressClick.current) return
        suppressClick.current = false
        e.stopPropagation()
        e.preventDefault()
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hpx-disabled:cursor-not-allowed hpx-disabled:opacity-50",
        canDrag && "touch-none",
        spec.track,
        TRACK_ROUNDED[rounded],
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn("absolute inset-0", TRACK_ROUNDED[rounded], OFF[variant])}
        style={variant === "apple" ? { boxShadow: "inset 0 1px 3px rgba(0,0,0,0.22)" } : undefined}
      />
      <motion.span
        aria-hidden
        className={cn("absolute inset-0", TRACK_ROUNDED[rounded], fill)}
        style={{ opacity: fillOpacity }}
      />
      {variant === "apple" && (
        // A soft sheen along the top of the track
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-b from-background/30 via-transparent to-foreground/5",
            TRACK_ROUNDED[rounded]
          )}
        />
      )}
      {marks && (
        <>
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center justify-center font-semibold text-background",
              spec.mark
            )}
            style={{ left: spec.gap, width: travel, opacity: fillOpacity }}
          >
            I
          </motion.span>
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center justify-center font-semibold text-muted-foreground",
              spec.mark
            )}
            style={{ right: spec.gap, width: travel, opacity: offOpacity }}
          >
            O
          </motion.span>
        </>
      )}
      <SwitchPrimitive.Thumb
        data-hpx-slot="switch-thumb"
        render={(thumbProps) => (
          <motion.span
            {...(thumbProps as React.ComponentProps<typeof motion.span>)}
            className={cn(
              "pointer-events-none z-10 block",
              variant === "elastic" && "bg-background shadow-md ring-1 ring-foreground/10",
              HANDLE_ROUNDED[rounded]
            )}
            style={
              {
                ...thumbProps.style,
                marginLeft: spec.gap,
                ...(variant === "apple" ? {} : { height: spec.d }),
                ...(variant === "apple"
                  ? {
                      width: appleWidth,
                      height: appleHeight,
                      x: appleX,
                      backgroundColor: glassBg,
                      backdropFilter: glassBlur,
                      WebkitBackdropFilter: glassBlur,
                      boxShadow: glassShadow,
                    }
                  : { width: spec.d, x, scaleX, scaleY }),
              } as MotionStyle
            }
          />
        )}
      />
    </SwitchPrimitive.Root>
  )

  if (label === undefined) return <MotionConfig reducedMotion="user">{control}</MotionConfig>

  return (
    <MotionConfig reducedMotion="user">
      <label
        className={cn(
          "inline-flex cursor-pointer items-center select-none",
          (labelSide === "top" || labelSide === "bottom") && "flex-col",
          spec.label,
          disabled && "cursor-not-allowed opacity-50",
          labelClassName
        )}
        // A click on the text flips the switch, whichever side the text is on
        onClick={(e) => {
          if (e.target !== e.currentTarget && rootRef.current?.contains(e.target as Node)) return
          e.preventDefault()
          if (!disabled) rootRef.current?.click()
        }}
      >
        {(labelSide === "left" || labelSide === "top") && <span>{label}</span>}
        {control}
        {(labelSide === "right" || labelSide === "bottom") && <span>{label}</span>}
      </label>
    </MotionConfig>
  )
}

export { Switch as HpxSwitch }
export type { SwitchVariant as HpxSwitchVariant, SwitchSize as HpxSwitchSize, SwitchColor as HpxSwitchColor, SwitchRounded as HpxSwitchRounded, SwitchLabelSide as HpxSwitchLabelSide }
