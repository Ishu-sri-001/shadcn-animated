"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { flushSync } from "react-dom"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { HpxButton } from "@/components/ui/button"

/** swipe: the new theme wipes across, and back the other way. fade: it fades in. circle: it grows from the button. */
type ThemeSwitchVariant = "swipe" | "fade" | "circle"
/** spin: the old icon spins away, the new one spins in. orbit: the two icons circle each other. */
type ThemeSwitchIconMotion = "spin" | "orbit"

type ThemeSwitchProps = Omit<React.ComponentProps<typeof HpxButton>, "size" | "onClick"> & {
  /** How the new theme reveals itself. */
  transition?: ThemeSwitchVariant
  /** Seconds. */
  duration?: number
  iconMotion?: ThemeSwitchIconMotion
  /** A label above the button while hovered or focused. */
  tooltip?: boolean
  onThemeChange?: (theme: "light" | "dark") => void
}

function revealFrames(
  transition: ThemeSwitchVariant,
  toDark: boolean,
  origin: { x: number; y: number; radius: number }
): Keyframe[] {
  if (transition === "fade") return [{ opacity: 0 }, { opacity: 1 }]
  if (transition === "swipe") {
    // Going dark wipes left to right, going light wipes back
    return toDark
      ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
      : [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }]
  }
  return [
    { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` },
    { clipPath: `circle(${origin.radius}px at ${origin.x}px ${origin.y}px)` },
  ]
}

const subscribe = () => () => {}

function ThemeSwitch({
  transition = "circle",
  duration = 0.7,
  iconMotion = "spin",
  tooltip = true,
  variant = "outline",
  className,
  onThemeChange,
  ...props
}: ThemeSwitchProps) {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const busy = React.useRef(false)
  const sun = React.useRef<SVGSVGElement>(null)
  const moon = React.useRef<SVGSVGElement>(null)
  const orbit = React.useRef<HTMLSpanElement>(null)
  const wrapper = React.useRef<HTMLSpanElement>(null)
  const previous = React.useRef(resolvedTheme)
  const [hovered, setHovered] = React.useState(false)
  const reduceMotion = useReducedMotion()
  const dark = resolvedTheme === "dark"
  const orbiting = iconMotion === "orbit"

  // The orbit starts wherever the current theme needs it
  React.useLayoutEffect(() => {
    if (!orbiting || !mounted || !orbit.current || !sun.current || !moon.current) return
    gsap.set(orbit.current, { transformOrigin: "50% 100%", rotation: dark ? 180 : 0 })
    gsap.set([sun.current, moon.current], { rotation: dark ? -180 : 0 })
    // Only the first paint should reset it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbiting, mounted])

  React.useLayoutEffect(() => {
    const before = previous.current
    previous.current = resolvedTheme
    if (!before || before === resolvedTheme || !sun.current || !moon.current) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (orbiting && orbit.current) {
      // Both icons travel half a circle, staying upright
      gsap.killTweensOf([orbit.current, sun.current, moon.current])
      const to = { duration: reduced ? 0 : 0.6, ease: "power3.inOut" }
      gsap.to(orbit.current, { rotation: "+=180", ...to })
      gsap.to([sun.current, moon.current], { rotation: "-=180", ...to })
      return
    }

    // The old icon spins away, then the new one spins up in its place
    const toDark = resolvedTheme === "dark"
    const leaving = toDark ? sun.current : moon.current
    const entering = toDark ? moon.current : sun.current
    gsap.killTweensOf([leaving, entering])
    if (reduced) {
      gsap.set(leaving, { scale: 0, opacity: 0 })
      gsap.set(entering, { scale: 1, rotate: 0, opacity: 1 })
      return
    }
    gsap
      .timeline()
      .fromTo(
        leaving,
        { rotate: 0, scale: 1, opacity: 1 },
        { rotate: 180, scale: 0, opacity: 0, duration: 0.17, ease: "power2.in" }
      )
      .fromTo(
        entering,
        { rotate: -180, scale: 0, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.6)" }
      )
  }, [resolvedTheme, orbiting])

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (busy.current || forcedTheme) return
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const box = event.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const origin = {
      x,
      y,
      radius: Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)),
    }
    const apply = () => {
      setTheme(next)
      onThemeChange?.(next)
    }

    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply()
      return
    }

    busy.current = true
    const root = document.documentElement
    // Turns off the browser's own cross-fade, see globals.css
    root.classList.add("theme-sweeping")
    const view = document.startViewTransition(() => {
      flushSync(apply)
    })

    try {
      await view.ready
      const progress = { value: 0 }
      // A paused native animation holds the snapshot while GSAP sets its time
      const reveal = root.animate(revealFrames(transition, next === "dark", origin), {
        duration: 1000,
        easing: "linear",
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      })
      reveal.pause()
      await gsap.to(progress, {
        value: 1000,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          reveal.currentTime = progress.value
        },
      })
      reveal.finish()
      await view.finished
    } catch {
      // Hidden tabs can skip the snapshot
      view.skipTransition()
      await view.finished.catch(() => {})
    } finally {
      root.classList.remove("theme-sweeping")
      busy.current = false
      setHovered(wrapper.current?.matches(":hover") ?? false)
    }
  }

  const word = dark ? "light" : "dark"
  const current = dark ? "Dark" : "Light"
  const iconClass = "size-7 transition-[scale] duration-200 group-hover/button:scale-90"

  return (
    <span
      ref={wrapper}
      data-hpx-slot="theme-switch-root"
      className="relative inline-flex"
      onPointerEnter={() => setHovered(true)}
      // The transition overlay steals the pointer, so leaving is checked afterwards
      onPointerLeave={() => !busy.current && setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <HpxButton
        data-hpx-slot="theme-switch"
        variant={variant}
        size="icon-lg"
        aria-label="Toggle theme"
        onClick={toggle}
        className={cn(
          "relative size-12 overflow-hidden",
          // These keep their colour on hover
          variant === "outline" && "hover:bg-background dark:hover:bg-input/30",
          variant === "default" && "hover:bg-primary",
          variant === "secondary" && "hover:bg-secondary",
          className
        )}
        {...props}
      >
        {orbiting ? (
          mounted && (
            <span ref={orbit} aria-hidden className="pointer-events-none absolute inset-0">
              <span className="absolute inset-0 grid place-items-center">
                <SunIcon ref={sun} className={iconClass} />
              </span>
              <span className="absolute inset-0 grid translate-y-12 place-items-center">
                <MoonIcon ref={moon} className={iconClass} />
              </span>
            </span>
          )
        ) : (
          <>
            <SunIcon ref={sun} className={cn("absolute opacity-100 dark:opacity-0", iconClass)} />
            <MoonIcon ref={moon} className={cn("absolute opacity-0 dark:opacity-100", iconClass)} />
          </>
        )}
      </HpxButton>

      {mounted && resolvedTheme && (
        <span role="status" aria-live="polite" className="sr-only">
          {current} theme on
        </span>
      )}

      <AnimatePresence>
        {tooltip && hovered && resolvedTheme && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <span>Change to</span>
            {reduceMotion ? (
              <span>{word}</span>
            ) : (
              <span className="relative inline-flex overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={word}
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.2, ease: [0.45, 0, 0.25, 1] }}
                  >
                    {word}
                  </motion.span>
                </AnimatePresence>
              </span>
            )}
            <span>theme</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export { ThemeSwitch as HpxThemeSwitch }
export type { ThemeSwitchIconMotion as HpxThemeSwitchIconMotion, ThemeSwitchVariant as HpxThemeSwitchVariant }
