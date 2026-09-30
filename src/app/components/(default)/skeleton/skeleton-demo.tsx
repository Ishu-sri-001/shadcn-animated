"use client"

import * as React from "react"
import { RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  HPX_SKELETON_ROUNDED,
  HpxSkeleton,
  HpxSkeletonGroup,
  HpxSkeletonSwap,
  HpxSkeletonText,
  type HpxSkeletonAnimation,
  type HpxSkeletonRounded,
  type HpxSkeletonSwapKind,
} from "@/components/ui/skeleton"

const controls = {
  animation: {
    group: "Skeleton appearance",
    type: "select",
    label: "Animation",
    value: "shimmer",
    options: [
      { label: "Shimmer", value: "shimmer" },
      { label: "Wave", value: "wave" },
      { label: "Pulse", value: "pulse" },
      { label: "None", value: "none" },
    ],
  },
  duration: {
    disabled: (v) => v.animation === "none",
    group: "Skeleton appearance",
    type: "slider",
    label: "Duration",
    value: 1.6,
    min: 0.6,
    max: 3,
    step: 0.1,
    unit: "s",
  },
  stagger: {
    disabled: (v) => v.animation === "none",
    group: "Skeleton appearance",
    type: "slider",
    label: "Stagger",
    value: 0.12,
    min: 0,
    max: 0.4,
    step: 0.02,
    unit: "s",
  },
  rounded: {
    group: "Skeleton appearance",
    type: "select",
    label: "Roundness",
    value: "md",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },

  swapAnimation: {
    group: "Content transition",
    type: "select",
    label: "Swap animation",
    value: "scale",
    options: [
      { label: "Rise", value: "rise" },
      { label: "Scale", value: "scale" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  swapDuration: {
    disabled: (v) => v.swapAnimation === "none",
    group: "Content transition",
    type: "slider",
    label: "Content entrance duration",
    value: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  swapStagger: {
    disabled: (v) => v.swapAnimation === "none",
    group: "Content transition",
    type: "slider",
    label: "Delay between content items",
    value: 0.06,
    min: 0,
    max: 0.2,
    step: 0.01,
    unit: "s",
  },
  loadTime: {
    group: "Loading preview",
    type: "slider",
    label: "Skeleton loading time",
    value: 3,
    min: 0.5,
    max: 5,
    step: 0.5,
    unit: "s",
  },
} satisfies HpxControlSchema

/** The status label, rolling up to its new text when it changes. */
function StatusRoll({ children }: { children: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className="relative inline-grid overflow-hidden text-sm text-muted-foreground">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={children}
          className="block"
          initial={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function HpxSkeletonDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [loading, setLoading] = React.useState(true)
  const timer = React.useRef(0)

  // Loads once on arrival, at the control's default; the Replay button uses the current value.
  React.useEffect(() => {
    timer.current = window.setTimeout(
      () => setLoading(false),
      controls.loadTime.value * 1000
    )
    return () => window.clearTimeout(timer.current)
  }, [])

  const replay = () => {
    window.clearTimeout(timer.current)
    setLoading(true)
    timer.current = window.setTimeout(() => setLoading(false), values.loadTime * 1000)
  }

  const placeholder = (
    <HpxSkeletonGroup
      animation={values.animation as HpxSkeletonAnimation}
      duration={values.duration}
      stagger={values.stagger}
      rounded={values.rounded as HpxSkeletonRounded}
    >
      <div className="flex flex-col gap-4">
        <HpxSkeleton className="h-[18vh] w-full" index={0} />
        <div className="flex items-center gap-3">
          <HpxSkeleton className="size-10 shrink-0 rounded-full" index={1} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <HpxSkeleton className="h-3.5 w-[40%]" index={2} />
            <HpxSkeleton className="h-3 w-[25%]" index={3} />
          </div>
        </div>
        <HpxSkeletonText lines={3} start={4} />
      </div>
    </HpxSkeletonGroup>
  )

  const content = (
    <div className="flex flex-col gap-4">
      <div className={cn("h-[18vh] w-full bg-linear-to-br from-warning/40 to-destructive/40", HPX_SKELETON_ROUNDED[values.rounded as HpxSkeletonRounded])} />
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          LK
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">Little Kiln Roasters</span>
          <span className="text-xs text-muted-foreground">Posted 2 hours ago</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This week we&apos;re pouring an Ethiopia Guji — jasmine, peach and black tea, washed and
        roasted light. It&apos;s bright without ever turning sharp, which makes it a forgiving
        first pour-over. Bags are roasted on Tuesdays and ship the same afternoon.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col gap-4 rounded-lg border px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <StatusRoll>{loading ? "Loading…" : "Loaded"}</StatusRoll>
          <HpxButton variant="outline" size="sm" onClick={replay} disabled={loading}>
            <RotateCcwIcon />
            Replay
          </HpxButton>
        </div>

        <HpxSkeletonSwap
          loading={loading}
          swapAnimation={values.swapAnimation as HpxSkeletonSwapKind}
          duration={values.swapDuration}
          stagger={values.swapStagger}
          skeleton={placeholder}
        >
          {content}
        </HpxSkeletonSwap>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: the placeholders leave before the content arrives, so the card never shows both.
      </p>

      <HpxControlsPanel title="Skeleton" {...panel} />
    </div>
  )
}
