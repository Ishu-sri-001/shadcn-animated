"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useHpxThemeTransition } from "@/components/theme-provider"

import { HpxButton } from "@/components/ui/button"

export function HpxThemeToggle() {
  const toggleTheme = useHpxThemeTransition()

  return (
    <HpxButton
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
    </HpxButton>
  )
}
