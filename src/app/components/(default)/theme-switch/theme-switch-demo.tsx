"use client"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  ThemeSwitch,
  type ThemeSwitchIconMotion,
  type ThemeSwitchVariant,
} from "@/components/ui/theme-switch"

const controls = {
  transition: {
    group: "Transition",
    type: "select",
    label: "Reveal",
    value: "circle",
    options: [
      { label: "Circle from button", value: "circle" },
      { label: "Swipe", value: "swipe" },
      { label: "Fade", value: "fade" },
    ],
  },
  duration: {
    group: "Transition",
    type: "slider",
    label: "Duration",
    value: 0.7,
    min: 0.2,
    max: 2,
    step: 0.05,
    unit: "s",
  },
  iconMotion: {
    group: "Button",
    type: "select",
    label: "Icon motion",
    value: "spin",
    options: [
      { label: "Spin", value: "spin" },
      { label: "Orbit", value: "orbit" },
    ],
  },
  tooltip: { group: "Button", type: "checkbox", label: "Tooltip", value: true },
  variant: {
    group: "Button",
    type: "select",
    label: "Look",
    value: "outline",
    options: [
      { label: "Outline", value: "outline" },
      { label: "Ghost", value: "ghost" },
      { label: "Default", value: "default" },
      { label: "Secondary", value: "secondary" },
    ],
  },
} satisfies ControlSchema

export function ThemeSwitchDemo() {
  const panel = useControls(controls)
  const { values } = panel

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border">
        <ThemeSwitch
          transition={values.transition as ThemeSwitchVariant}
          duration={values.duration}
          iconMotion={values.iconMotion as ThemeSwitchIconMotion}
          tooltip={values.tooltip}
          variant={values.variant as "outline" | "ghost" | "default" | "secondary"}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: The circle grows from the button
      </p>

      <ControlsPanel title="Theme switch" {...panel} />
    </div>
  )
}
