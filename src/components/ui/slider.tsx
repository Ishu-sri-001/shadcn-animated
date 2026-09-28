"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

const smoothEase = [0.22, 1, 0.36, 1] as const

type SliderTrackFill = "spring" | "ease" | "none"
type SliderThumbGrow = "none" | "grow" | "shrink"
type SliderTicks = "none" | "dots" | "lines"
type SliderTooltip = "none" | "dragging" | "always"
type SliderSize = "sm" | "md" | "lg"

type SliderMotion = {
  /**
   * How the filled part of the track follows the value. `spring` overshoots a little on a jump,
   * `ease` glides, `none` tracks the pointer exactly (what a plain slider does).
   */
  trackFill: SliderTrackFill
  /** Length of the fill animation, in seconds. */
  fillDuration: number
  /** What the thumb does while you drag it. */
  thumbGrow: SliderThumbGrow
  /** The track thickens while you drag. */
  trackExpand: boolean
  /** Marks along the track, one per step. */
  ticks: SliderTicks
  /** A bubble showing the value. */
  tooltip: SliderTooltip
  /** Track and thumb size. */
  size: SliderSize
}

const TRACK_SIZE: Record<SliderSize, string> = {
  sm: "data-horizontal:h-1 data-vertical:w-1",
  md: "data-horizontal:h-1.5 data-vertical:w-1.5",
  lg: "data-horizontal:h-2.5 data-vertical:w-2.5",
}

/** The track thickens to this while dragging. Written out in full so Tailwind can see them. */
const TRACK_SIZE_ACTIVE: Record<SliderSize, string> = {
  sm: "data-dragging:data-horizontal:h-1.5 data-dragging:data-vertical:w-1.5",
  md: "data-dragging:data-horizontal:h-2.5 data-dragging:data-vertical:w-2.5",
  lg: "data-dragging:data-horizontal:h-3.5 data-dragging:data-vertical:w-3.5",
}

const THUMB_SIZE: Record<SliderSize, string> = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

const SliderContext = React.createContext<SliderMotion | null>(null)

function useSliderMotion() {
  const context = React.useContext(SliderContext)
  if (!context) throw new Error("Slider parts must be used inside <Slider>.")
  return context
}

/** Evenly spaced marks along the track, one per step. */
function Ticks({
  min,
  max,
  step,
  kind,
}: {
  min: number
  max: number
  step: number
  kind: SliderTicks
}) {
  const count = Math.floor((max - min) / step)
  // Only worth drawing when the steps are far enough apart to tell apart.
  if (kind === "none" || count < 2 || count > 40) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-between data-vertical:flex-col"
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
  trackFill = "spring",
  fillDuration = 0.35,
  thumbGrow = "grow",
  trackExpand = true,
  ticks = "none",
  tooltip = "dragging",
  size = "md",
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderPrimitive.Root.Props & Partial<SliderMotion>) {
  const options = React.useMemo(
    () => ({ trackFill, fillDuration, thumbGrow, trackExpand, ticks, tooltip, size }),
    [trackFill, fillDuration, thumbGrow, trackExpand, ticks, tooltip, size]
  )
  const reduceMotion = useReducedMotion()

  const thumbCount = Array.isArray(value)
    ? value.length
    : Array.isArray(defaultValue)
      ? defaultValue.length
      : 1

  // The indicator is positioned by the primitive with inline styles, so it is eased with a CSS
  // transition rather than Motion, which would fight it for the same properties.
  const fillTransition =
    options.trackFill === "none" || reduceMotion
      ? undefined
      : {
          // Base UI sizes and offsets the indicator inline; these are the properties it writes.
          transitionProperty: "width, height, inset-inline-start, inset-block-start",
          transitionDuration: `${options.fillDuration}s`,
          transitionTimingFunction:
            options.trackFill === "spring"
              ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "cubic-bezier(0.22, 1, 0.36, 1)",
        }

  return (
    <SliderContext.Provider value={options}>
      <SliderPrimitive.Root
        className={cn("data-horizontal:w-full data-vertical:h-full", className)}
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        step={step}
        thumbAlignment="edge"
        {...props}
      >
        <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
          <SliderPrimitive.Track
            data-slot="slider-track"
            className={cn(
              "relative grow rounded-full bg-muted transition-[height,width] duration-200 ease-out select-none data-horizontal:w-full data-vertical:h-full",
              TRACK_SIZE[options.size],
              options.trackExpand && TRACK_SIZE_ACTIVE[options.size]
            )}
          >
            <Ticks min={min} max={max} step={step} kind={options.ticks} />
            <SliderPrimitive.Indicator
              data-slot="slider-range"
              className="rounded-full bg-primary select-none data-horizontal:h-full data-vertical:w-full"
              style={fillTransition}
            />
          </SliderPrimitive.Track>
          {Array.from({ length: thumbCount }, (_, index) => (
            <SliderThumb key={index} index={index} />
          ))}
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </SliderContext.Provider>
  )
}

const THUMB_SCALE: Record<SliderThumbGrow, number> = { none: 1, grow: 1.25, shrink: 0.8 }

function SliderThumb({ index }: { index: number }) {
  const options = useSliderMotion()

  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      index={index}
      className={cn(
        "relative block shrink-0 rounded-full border border-ring bg-background ring-ring/50 select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50",
        THUMB_SIZE[options.size]
      )}
      render={(thumbProps, state) => {
        const value = state.values[index]
        const show =
          options.tooltip === "always" || (options.tooltip === "dragging" && state.dragging)

        return (
          <motion.div
            {...(thumbProps as React.ComponentProps<typeof motion.div>)}
            animate={{ scale: state.dragging ? THUMB_SCALE[options.thumbGrow] : 1 }}
            transition={{ type: "spring", visualDuration: 0.25, bounce: 0.4 }}
          >
            <AnimatePresence>
              {show && (
                <motion.span
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums"
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  transition={{ duration: 0.18, ease: smoothEase }}
                >
                  {Math.round(value)}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )
      }}
    />
  )
}

export { Slider }
export type { SliderTrackFill, SliderThumbGrow, SliderTicks, SliderTooltip, SliderSize }
