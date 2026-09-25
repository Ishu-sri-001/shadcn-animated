"use client"

import * as React from "react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  CheckboxGroup,
  CheckboxItem,
  type CheckboxAppearance,
  type CheckboxCardFill,
  type CheckboxVariant,
} from "@/components/ui/checkbox-group"

const toppings = [
  { value: "Mushrooms", description: "Roasted chestnut mushrooms.", accent: "#a16207" },
  { value: "Olives", description: "Kalamata, pitted.", accent: "#4d7c0f" },
  { value: "Peppers", description: "Sweet red and yellow.", accent: "#dc2626" },
  { value: "Onions", description: "Slow-cooked until sweet.", accent: "#9333ea" },
  { value: "Basil", description: "Added fresh after baking.", accent: "#16a34a" },
  { value: "Chilli", description: "Fresh, thinly sliced.", accent: "#ea580c" },
]

const controls = {
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
  showIcon: { group: "Style", type: "checkbox", label: "Show box", value: true },

  fill: { group: "Ticking", type: "checkbox", label: "Fill from centre", value: true },
  bounce: { group: "Ticking", type: "checkbox", label: "Springy tick", value: true },

  appearance: {
    group: "Box",
    type: "select",
    label: "Look",
    value: "filled",
    options: [
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
    ],
  },
  radius: { group: "Box", type: "slider", label: "Corner radius", value: 25, min: 0, max: 100, step: 5, unit: "%" },

  strike: { group: "Label", type: "checkbox", label: "Strike-through", value: false },

  selectAll: { group: "Multiple select", type: "checkbox", label: "Select all", value: true },
  deselectAll: { group: "Multiple select", type: "checkbox", label: "Deselect all", value: true },
  counter: { group: "Multiple select", type: "checkbox", label: "Selected counter", value: true },
  rangeSelect: { group: "Multiple select", type: "checkbox", label: "Shift-click ranges", value: true },
  min: {
    group: "Multiple select",
    type: "select",
    label: "At least",
    value: "0",
    options: [
      { label: "None", value: "0" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
    ],
  },
  max: {
    group: "Multiple select",
    type: "select",
    label: "At most",
    value: "any",
    options: [
      { label: "Any", value: "any" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
    ],
  },
  reorder: { group: "Multiple select", type: "checkbox", label: "Drag to reorder", value: false },
  colorful: { group: "Multiple select", type: "checkbox", label: "Colour per option", value: false },
} satisfies ControlSchema

export function CheckboxDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const { variant, cardFill, appearance, radius, colorful, min, max, ...groupOptions } = values
  const cards = variant === "card"
  const [picks, setPicks] = React.useState(["Olives", "Basil"])
  const [terms, setTerms] = React.useState(false)

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Group · {cards ? "Cards" : "Inline"}
        </h2>
        <div className="rounded-lg border p-6 max-md:p-4">
          <CheckboxGroup
            {...groupOptions}
            min={Number(min)}
            max={max === "any" ? undefined : Number(max)}
            variant={variant as CheckboxVariant}
            cardFill={cardFill as CheckboxCardFill}
            appearance={appearance as CheckboxAppearance}
            // Slider is 0–100%; the prop is 0 (square) to 1 (circle).
            radius={radius / 100}
            value={picks}
            onValueChange={setPicks}
            aria-label="Toppings"
            className={
              cards ? "grid grid-cols-2 gap-3 max-md:grid-cols-1" : "flex flex-wrap gap-x-6 gap-y-3 max-md:flex-col"
            }
          >
            {toppings.map((topping) => (
              <CheckboxItem
                key={topping.value}
                value={topping.value}
                label={topping.value}
                // Only cards show a description.
                description={cards ? topping.description : undefined}
                accent={colorful ? topping.accent : undefined}
              />
            ))}
          </CheckboxGroup>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Standalone</h2>
        <div className="rounded-lg border p-6 max-md:p-4">
          <CheckboxItem label="I agree to the terms" checked={terms} onCheckedChange={setTerms} />
        </div>
      </div>

      <ControlsPanel title="Checkbox" {...panel} />
    </section>
  )
}
