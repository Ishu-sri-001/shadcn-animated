"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { animate } from "motion"
import {
  HPX_CUSTOM_THEMES_EVENT,
  HPX_CUSTOM_THEMES_KEY,
  HPX_PALETTE_KEY,
  hpxApplyTheme,
  type HpxCustomTheme,
} from "@/components/theme-colors"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

export const HPX_PALETTES = [
  { value: "default", label: "Default" },
  { value: "claude", label: "Claude" },
  { value: "vscode", label: "VS Code" },
  { value: "caffeine", label: "Caffeine" },
  { value: "ghibli", label: "Ghibli Studio" },
  { value: "spotify", label: "Spotify" },
  { value: "valorant", label: "Valorant" },
] as const

// Built-in value, or `custom:<id>` for a user-made theme
export type HpxPalette = string

type PaletteContextValue = {
  palette: HpxPalette
  setPalette: (palette: HpxPalette) => void
  customThemes: HpxCustomTheme[]
  addCustomTheme: (theme: HpxCustomTheme) => void
  deleteCustomTheme: (id: string) => void
}

const PaletteContext = React.createContext<PaletteContextValue | null>(null)

export function useHpxPalette() {
  const ctx = React.useContext(PaletteContext)
  if (!ctx) throw new Error("useHpxPalette requires HpxThemeProvider")
  return ctx
}

function subscribePalette(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-hpx-theme", "data-hpx-custom"],
  })
  return () => observer.disconnect()
}

function getPalette(): HpxPalette {
  const root = document.documentElement
  const custom = root.getAttribute("data-hpx-custom")
  if (custom) return `custom:${custom}`
  const attr = root.getAttribute("data-hpx-theme")
  return HPX_PALETTES.some((p) => p.value === attr) ? (attr as string) : "default"
}

function subscribeThemes(onChange: () => void) {
  window.addEventListener(HPX_CUSTOM_THEMES_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(HPX_CUSTOM_THEMES_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function getThemesRaw() {
  try {
    return localStorage.getItem(HPX_CUSTOM_THEMES_KEY) ?? "[]"
  } catch {
    return "[]"
  }
}

// Wipes in from the left, or back from the right
async function sweepTransition(update: () => void, direction: "ltr" | "rtl" = "ltr") {
  const root = document.documentElement
  if (
    !document.startViewTransition ||
    root.classList.contains("theme-sweeping") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update()
    return
  }

  root.classList.add("theme-sweeping")
  const transition = document.startViewTransition(update)

  try {
    await transition.ready
    // A paused native animation keeps the snapshot alive while Motion drives it.
    const reveal = root.animate(
      {
        clipPath:
          direction === "ltr"
            ? ["inset(0 100% 0 0)", "inset(0 0 0 0)"]
            : ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
      },
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
  }
}

function PaletteProvider({ children }: { children: React.ReactNode }) {
  const palette = React.useSyncExternalStore(subscribePalette, getPalette, () => "default")
  const themesRaw = React.useSyncExternalStore(subscribeThemes, getThemesRaw, () => "[]")
  const customThemes = React.useMemo<HpxCustomTheme[]>(() => {
    try {
      return JSON.parse(themesRaw)
    } catch {
      return []
    }
  }, [themesRaw])

  const setPalette = React.useCallback(
    (next: HpxPalette) => {
      // Moving down the list wipes forward, up wipes back
      const order = [
        ...HPX_PALETTES.map((p) => p.value as string),
        ...customThemes.map((t) => `custom:${t.id}`),
      ]
      const forward = order.indexOf(next) >= order.indexOf(getPalette())
      sweepTransition(
        () => {
          try {
            localStorage.setItem(HPX_PALETTE_KEY, next)
          } catch {}
          hpxApplyTheme()
        },
        forward ? "ltr" : "rtl"
      )
    },
    [customThemes]
  )

  const saveThemes = React.useCallback((list: HpxCustomTheme[]) => {
    try {
      localStorage.setItem(HPX_CUSTOM_THEMES_KEY, JSON.stringify(list))
    } catch {}
    window.dispatchEvent(new Event(HPX_CUSTOM_THEMES_EVENT))
  }, [])

  const addCustomTheme = React.useCallback(
    (theme: HpxCustomTheme) => {
      saveThemes([...customThemes, theme])
      setPalette(`custom:${theme.id}`)
    },
    [customThemes, saveThemes, setPalette]
  )

  const deleteCustomTheme = React.useCallback(
    (id: string) => {
      saveThemes(customThemes.filter((t) => t.id !== id))
      setPalette("default")
    },
    [customThemes, saveThemes, setPalette]
  )

  const value = React.useMemo(
    () => ({ palette, setPalette, customThemes, addCustomTheme, deleteCustomTheme }),
    [palette, setPalette, customThemes, addCustomTheme, deleteCustomTheme]
  )
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}

const ThemeTransitionContext = React.createContext<(() => void | Promise<void>) | null>(null)

export function useHpxThemeTransition() {
  const toggleTheme = React.useContext(ThemeTransitionContext)
  if (!toggleTheme) throw new Error("useThemeTransition requires ThemeProvider")
  return toggleTheme
}

function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()

  const toggleTheme = () => {
    if (forcedTheme) return
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    // Going dark wipes in from the left, going light from the right
    return sweepTransition(
      () => flushSync(() => setTheme(nextTheme)),
      nextTheme === "dark" ? "ltr" : "rtl"
    )
  }

  return (
    <ThemeTransitionContext.Provider value={toggleTheme}>
      {children}
    </ThemeTransitionContext.Provider>
  )
}

export function HpxThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <PaletteProvider>
        <ThemeTransition>{children}</ThemeTransition>
      </PaletteProvider>
    </NextThemesProvider>
  )
}
