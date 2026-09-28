"use client"

import * as React from "react"
import { cn } from "cn"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { staggerIn } from "@/lib/stagger-in"

const smoothEase = [0.22, 1, 0.36, 1] as const

type SkeletonAnimation = "shimmer" | "pulse" | "wave" | "none"
type SkeletonRounded = "none" | "sm" | "md" | "lg" | "xl" | "full"
type SkeletonSwap = "fade" | "rise" | "scale" | "none"

type SkeletonMotion = {
  animation: SkeletonAnimation
  duration: number
  stagger: number
  rounded: SkeletonRounded
}

const ROUNDED: Record<SkeletonRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const SkeletonContext = React.createContext<SkeletonMotion | null>(null)

function SkeletonGroup({
  animation = "shimmer",
  duration = 1.6,
  stagger = 0.12,
  rounded = "md",
  children,
}: Partial<SkeletonMotion> & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ animation, duration, stagger, rounded }),
    [animation, duration, stagger, rounded]
  )
  return <SkeletonContext.Provider value={value}>{children}</SkeletonContext.Provider>
}

const SkeletonIndexContext = React.createContext(0)

function Skeleton({
  className,
  animation,
  duration,
  rounded,
  index,
  style,
  ...props
}: React.ComponentProps<"div"> &
  Partial<Pick<SkeletonMotion, "animation" | "duration" | "rounded">> & {
    index?: number
  }) {
  const group = React.useContext(SkeletonContext)
  const fallbackIndex = React.useContext(SkeletonIndexContext)
  const reduced = useReducedMotion()

  const kind = animation ?? group?.animation ?? "shimmer"
  const seconds = duration ?? group?.duration ?? 1.6
  const radius = rounded ?? group?.rounded ?? "md"
  // Negative delay: offset, but moving immediately
  const lag = ((index ?? fallbackIndex) * (group?.stagger ?? 0)) % seconds
  const delay = lag === 0 ? 0 : lag - seconds

  const active = !reduced && kind !== "none"

  return (
    <div
      data-slot="skeleton"
      data-animation={kind}
      className={cn(
        "relative overflow-hidden bg-muted",
        ROUNDED[radius],
        active && kind === "pulse" && "animate-pulse",
        // Shared viewport band; see globals.css
        active && (kind === "shimmer" || kind === "wave") && "skeleton-sweep",
        // CSS catches reduced motion during hydration
        "motion-reduce:animate-none",
        className
      )}
      style={{
        ...style,
        ...(active
          ? ({
              "--skeleton-duration": `${seconds}s`,
              "--skeleton-delay": `${delay}s`,
              animationDuration: kind === "pulse" ? `${seconds}s` : undefined,
              animationDelay: kind === "pulse" ? `${delay}s` : undefined,
            } as React.CSSProperties)
          : null),
      }}
      {...props}
    />
  )
}

function SkeletonSwap({
  loading,
  swap = "scale",
  duration = 0.4,
  stagger = 0.06,
  skeleton,
  children,
  className,
}: {
  loading: boolean
  swap?: SkeletonSwap
  duration?: number
  stagger?: number
  skeleton: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  const enter = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || reduced || swap === "none" || stagger <= 0) return
      return staggerIn(node, ":scope > *", {
        gap: stagger,
        delay: 0,
        distance: swap === "rise" ? 8 : 0,
      })?.stop
    },
    [reduced, swap, stagger]
  )

  const kind = reduced && swap !== "none" ? "fade" : swap
  const initial = {
    fade: { opacity: 0 },
    rise: { opacity: 0, y: 8 },
    scale: { opacity: 0, scale: 0.97 },
    none: {},
  }[kind]
  const length = reduced ? Math.min(duration, 0.2) : duration

  return (
    <div className={cn("relative", className)}>
      // Crossfade: placeholders fade over content
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            aria-hidden
            className="z-10"
            exit={kind === "none" ? undefined : { opacity: 0 }}
            transition={{ duration: length, ease: "easeInOut" }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            ref={enter}
            initial={initial}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: length, ease: smoothEase }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SkeletonText({
  lines = 3,
  start = 0,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number
  start?: number
}) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonIndexContext.Provider key={i} value={start + i}>
          <Skeleton className={cn("h-3.5", i === lines - 1 && "w-[60%]")} />
        </SkeletonIndexContext.Provider>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonGroup, SkeletonSwap, SkeletonText }
export type {
  SkeletonAnimation,
  SkeletonRounded,
  SkeletonSwap as SkeletonSwapKind,
}
