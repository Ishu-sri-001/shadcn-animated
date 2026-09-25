"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { animate } from "motion"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

const ThemeTransitionContext = React.createContext<(() => void) | null>(null)

export function useThemeTransition() {
  const toggleTheme = React.useContext(ThemeTransitionContext)
  if (!toggleTheme) throw new Error("useThemeTransition requires ThemeProvider")
  return toggleTheme
}

function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const busy = React.useRef(false)

  const toggleTheme = async () => {
    if (busy.current || forcedTheme) return
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme)
      return
    }

    busy.current = true
    const root = document.documentElement
    root.classList.add("theme-sweeping")
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme))
    })

    try {
      await transition.ready
      // A paused native animation keeps the snapshot alive while Motion drives it.
      const reveal = root.animate(
        { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"] },
        { duration: 650, fill: "both", pseudoElement: "::view-transition-new(root)" }
      )
      reveal.pause()
      await animate(0, 650, {
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (time) => { reveal.currentTime = time },
      })
      reveal.finish()
      await transition.finished
    } catch {
      // Hidden tabs or interrupted snapshots can skip the visual transition.
      transition.skipTransition()
      await transition.finished.catch(() => {})
    } finally {
      root.classList.remove("theme-sweeping")
      busy.current = false
    }
  }

  return (
    <ThemeTransitionContext.Provider value={toggleTheme}>
      {children}
    </ThemeTransitionContext.Provider>
  )
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeTransition>{children}</ThemeTransition>
    </NextThemesProvider>
  )
}
