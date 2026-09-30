"use client"

import * as React from "react"
import { RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import {
  SKELETON_ROUNDED,
  Skeleton,
  SkeletonGroup,
  SkeletonSwap,
  SkeletonText,
  type SkeletonAnimation,
  type SkeletonRounded,
  type SkeletonSwapKind,
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
    label: "Animation cycle duration",
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
    label: "Delay between placeholders",
    value: 0.12,
    min: 0,
    max: 0.4,
    step: 0.02,
    unit: "s",
  },
  rounded: {
    group: "Skeleton appearance",
    type: "select",
    label: "Corner radius",
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

  swap: {
    group: "Content transition",
    type: "select",
    label: "Transition animation",
    value: "scale",
    options: [
      { label: "Rise", value: "rise" },
      { label: "Scale", value: "scale" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  swapDuration: {
    disabled: (v) => v.swap === "none",
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
    disabled: (v) => v.swap === "none",
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
} satisfies ControlSchema

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

export function SkeletonDemo() {
  const panel = useControls(controls)
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
    <SkeletonGroup
      animation={values.animation as SkeletonAnimation}
      duration={values.duration}
      stagger={values.stagger}
      rounded={values.rounded as SkeletonRounded}
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[18vh] w-full" index={0} />
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" index={1} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-[40%]" index={2} />
            <Skeleton className="h-3 w-[25%]" index={3} />
          </div>
        </div>
        <SkeletonText lines={3} start={4} />
      </div>
    </SkeletonGroup>
  )

  const content = (
    <div className="flex flex-col gap-4">
      <div className={cn("h-[18vh] w-full bg-linear-to-br from-warning/40 to-destructive/40", SKELETON_ROUNDED[values.rounded as SkeletonRounded])} />
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
          <Button variant="outline" size="sm" onClick={replay} disabled={loading}>
            <RotateCcwIcon />
            Replay
          </Button>
        </div>

        <SkeletonSwap
          loading={loading}
          swap={values.swap as SkeletonSwapKind}
          duration={values.swapDuration}
          stagger={values.swapStagger}
          skeleton={placeholder}
        >
          {content}
        </SkeletonSwap>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: the placeholders leave before the content arrives, so the card never shows both.
      </p>

      <ControlsPanel title="Skeleton" {...panel} />
    </div>
  )
}
