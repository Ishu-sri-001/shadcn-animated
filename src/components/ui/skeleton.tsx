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
  /** How the placeholder shows it is waiting. */
  animation: SkeletonAnimation
  /** Length of one loop of that animation, in seconds. */
  duration: number
  /** Gap between neighbouring placeholders' loops, in seconds, so they ripple. */
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

/** Wraps a group of placeholders so they share settings and ripple together. */
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

/** Position in the group, so each placeholder's loop starts a little after the one before. */
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
    /** Overrides the position used for the ripple delay. */
    index?: number
  }) {
  const group = React.useContext(SkeletonContext)
  const fallbackIndex = React.useContext(SkeletonIndexContext)
  // Follows the system's reduced-motion setting: a still placeholder, holding the shape.
  const reduced = useReducedMotion()

  const kind = animation ?? group?.animation ?? "shimmer"
  const seconds = duration ?? group?.duration ?? 1.6
  const radius = rounded ?? group?.rounded ?? "md"
  // Each placeholder runs the same loop, `stagger` behind the one before, so their cycles finish
  // one after another. Written as a negative delay: a positive one would hold each placeholder
  // still until its turn; this starts them all at once, already offset.
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
        // One band of light sweeping across the whole group (see `.skeleton-sweep` in
        // globals.css); `wave` is the same sweep, wider and softer.
        active && (kind === "shimmer" || kind === "wave") && "skeleton-sweep",
        // CSS stops the loop too (`.skeleton-sweep` does the same for the sweep). Motion's hook
        // reads the preference once and reports "no preference" while the page hydrates, so on
        // first load the placeholders would keep moving; the media query applies from the very
        // first paint.
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

/**
 * Swaps placeholders for the real thing once it has loaded, as a crossfade in place: the content
 * starts arriving straight away, and the placeholders lift out of the layout and fade out on top
 * of it. The card never goes blank in between, and never jumps in height.
 */
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
  /** How the loaded content arrives. */
  swap?: SkeletonSwap
  /** Length of the swap, in seconds. */
  duration?: number
  /** Gap between the loaded items arriving, in seconds. */
  stagger?: number
  skeleton: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  // With reduced motion, the swap becomes a short fade, with no movement or stagger.
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

  // Reduced motion keeps a plain fade — no rising or scaling — so the handover still reads.
  const kind = reduced && swap !== "none" ? "fade" : swap
  // Only the content moves as it arrives; the placeholders just fade. Moving them too (growing
  // or drifting) while they vanish is what made the handover look like a glitch.
  const initial = {
    fade: { opacity: 0 },
    rise: { opacity: 0, y: 8 },
    scale: { opacity: 0, scale: 0.97 },
    none: {},
  }[kind]
  const length = reduced ? Math.min(duration, 0.2) : duration

  return (
    <div className={cn("relative", className)}>
      {/* `popLayout` takes the leaving placeholders out of the layout, over the arriving content. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            aria-hidden
            // Above the arriving content while it fades out. Beneath it, the content covered the
            // placeholders in patches, leaving grey slivers poking out around the words.
            className="z-10"
            exit={kind === "none" ? undefined : { opacity: 0 }}
            // An even fade: an ease-out dropped most of the opacity in the first frame, so the
            // placeholders seemed to blink out rather than fade.
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

/** Text placeholder lines, the last one short like a real paragraph's last line. */
function SkeletonText({
  lines = 3,
  start = 0,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number
  /** Position of the first line in the group, so the stagger carries on from what's above. */
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
