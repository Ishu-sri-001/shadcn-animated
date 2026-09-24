"use client"

import * as React from "react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Choice,
  ChoiceGroup,
  type ChoiceCardFill,
  type ChoiceAppearance,
  type ChoiceIndicator,
  type ChoiceVariant,
} from "@/components/ui/choice"

const options = [
  { value: "Whole bean", description: "Stays fresh longest.", accent: "#f59e0b" },
  { value: "Espresso", description: "Fine, for espresso machines.", accent: "#10b981" },
  { value: "Filter", description: "Medium, for pour-over.", accent: "#0ea5e9" },
  { value: "French press", description: "Coarse, for cafetières.", accent: "#f43f5e" },
]

const controls = {
  // On: checkboxes (pick any). Off: radios (pick one).
  multiple: { group: "Style", type: "checkbox", label: "Multiple select", value: true },
  variant: {
    group: "Style",
    type: "select",
    label: "Style",
    value: "default",
    options: [
      { label: "Inline", value: "default" },
      { label: "Cards", value: "card" },
    ],
  },
  cardFill: {
    group: "Style",
    type: "select",
    label: "Card fill",
    value: "muted",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  showIcon: { group: "Style", type: "checkbox", label: "Show icon", value: true },

  fill: { group: "Checking", type: "checkbox", label: "Fill from centre", value: true },
  bounce: { group: "Checking", type: "checkbox", label: "Springy tick", value: true },
  ripple: { group: "Checking", type: "checkbox", label: "Ripple", value: false },
  burst: { group: "Checking", type: "checkbox", label: "Burst", value: false },

  // The icon's look is independent of Multiple select, so any combination works.
  indicator: {
    group: "Icon",
    type: "select",
    label: "Mark",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Dot", value: "dot" },
      { label: "None", value: "none" },
    ],
  },
  appearance: {
    group: "Icon",
    type: "select",
    label: "Look",
    value: "filled",
    options: [
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
    ],
  },
  radius: { group: "Icon", type: "slider", label: "Corner radius", value: 25, min: 0, max: 100, step: 5, unit: "%" },
  crossfade: { group: "Icon", type: "checkbox", label: "Old dot shrinks out", value: true },

  springFocus: { group: "Focus", type: "checkbox", label: "Springy focus ring", value: true },

  strike: { group: "Label", type: "checkbox", label: "Strike-through", value: false },
  revealDescription: { group: "Label", type: "checkbox", label: "Reveal description", value: false },

  reorder: { group: "Group", type: "checkbox", label: "Drag to reorder", value: false },
  counter: { group: "Group", type: "checkbox", label: "Selected counter", value: true },
  required: { group: "Group", type: "checkbox", label: "Required (checkboxes)", value: false },
  colorful: { group: "Group", type: "checkbox", label: "Colour per option", value: false },
} satisfies ControlSchema

export function ChoiceDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const { multiple, variant, cardFill, indicator, appearance, radius, colorful, required, ...groupOptions } = values
  const type = multiple ? "checkbox" : "radio"
  const cards = variant === "card"

  // Kept as a list for both types: radio shows the first pick, and switching
  // back to checkbox restores the rest if nothing else was picked meanwhile.
  const [picks, setPicks] = React.useState(["Espresso"])

  const items = options.map((option) => (
    <Choice
      key={option.value}
      value={option.value}
      label={option.value}
      // Cards always show their description; inline only when revealing.
      description={cards || values.revealDescription ? option.description : undefined}
      accent={colorful ? option.accent : undefined}
    />
  ))

  const shared = {
    ...groupOptions,
    variant: variant as ChoiceVariant,
    cardFill: cardFill as ChoiceCardFill,
    indicator: indicator as ChoiceIndicator,
    appearance: appearance as ChoiceAppearance,
    // Slider is 0–100%; the prop is 0 (square) to 1 (circle).
    radius: radius / 100,
    "aria-label": "Grind",
    className: cards
      ? "grid grid-cols-2 gap-3 max-md:grid-cols-1"
      : "flex flex-wrap gap-x-6 gap-y-3 max-md:flex-col",
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {multiple ? "Multiple select" : "Single select"} · {cards ? "Cards" : "Inline"}
      </h2>
      <div className="rounded-lg border p-6 max-md:p-4">
        {/* One group; switching `type` morphs the same options in place. */}
        {type === "checkbox" ? (
          <ChoiceGroup
            key="grind"
            type="checkbox"
            required={required}
            value={picks}
            onValueChange={setPicks}
            {...shared}
          >
            {items}
          </ChoiceGroup>
        ) : (
          <ChoiceGroup
            key="grind"
            type="radio"
            value={picks[0] ?? ""}
            onValueChange={(next) => setPicks([next])}
            {...shared}
          >
            {items}
          </ChoiceGroup>
        )}
      </div>

      <ControlsPanel title="Checkbox & Radio" {...panel} />
    </section>
  )
}
