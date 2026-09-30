"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxCheckboxGroup,
  HpxCheckboxItem,
  type HpxCheckboxAppearance,
  type HpxCheckboxMark,
  type HpxCheckboxRadius,
  type HpxCheckboxCardFill,
  type HpxCheckboxVariant,
} from "@/components/ui/checkbox-group"

const toppings = [
  { value: "Mushrooms", description: "Roasted chestnut mushrooms.", accent: "var(--warning)" },
  { value: "Olives", description: "Kalamata, pitted.", accent: "var(--success)" },
  { value: "Peppers", description: "Sweet red and yellow.", accent: "var(--destructive)" },
  { value: "Onions", description: "Slow-cooked until sweet.", accent: "var(--primary)" },
  { value: "Basil", description: "Added fresh after baking.", accent: "var(--chart-2)" },
  { value: "Chilli", description: "Fresh, thinly sliced.", accent: "var(--info)" },
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
  cardFillColor: {
    disabled: (v) => v.variant === "default",
    group: "Style",
    type: "select",
    label: "Card fill color",
    value: "muted",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  showIcon: { group: "Style", type: "checkbox", label: "Icon", value: true },

  fill: { disabled: (v) => !v.showIcon, group: "Ticking", type: "checkbox", label: "Fill from centre", value: true },
  elastic: { disabled: (v) => !v.showIcon, group: "Ticking", type: "checkbox", label: "Elastic", value: true },

  mark: {
    disabled: (v) => !v.showIcon,
    group: "Box",
    type: "select",
    label: "Mark",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Filled circle", value: "circle-filled" },
      { label: "Outline circle", value: "circle-outline" },
    ],
  },
  appearance: {
    disabled: (v) => !v.showIcon,
    group: "Box",
    type: "select",
    label: "Look",
    value: "filled",
    options: [
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
    ],
  },
  rounded: {
    disabled: (v) => !v.showIcon,
    group: "Box",
    type: "select",
    label: "Roundness",
    value: "sm",
    options: [
      { label: "None", value: "none" },
      { label: "xs", value: "xs" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "Full", value: "full" },
    ],
  },

  strike: { group: "Label", type: "checkbox", label: "Strike-through", value: false },

  showSelectAll: { group: "Multiple select", type: "checkbox", label: "Show select all", value: true },
  showDeselectAll: { group: "Multiple select", type: "checkbox", label: "Show deselect all", value: true },
  showCounter: { group: "Multiple select", type: "checkbox", label: "Show counter", value: true },
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
} satisfies HpxControlSchema

export function HpxCheckboxDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const { variant, cardFillColor, mark, appearance, rounded, colorful, min, max, ...groupOptions } =
    values
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
          <HpxCheckboxGroup
            {...groupOptions}
            min={Number(min)}
            max={max === "any" ? undefined : Number(max)}
            variant={variant as HpxCheckboxVariant}
            cardFillColor={cardFillColor as HpxCheckboxCardFill}
            mark={mark as HpxCheckboxMark}
            appearance={appearance as HpxCheckboxAppearance}
            rounded={rounded as HpxCheckboxRadius}
            value={picks}
            onValueChange={setPicks}
            aria-label="Toppings"
            className={
              cards ? "grid grid-cols-2 gap-3 max-md:grid-cols-1" : "flex flex-wrap gap-x-6 gap-y-3 max-md:flex-col"
            }
          >
            {toppings.map((topping) => (
              <HpxCheckboxItem
                key={topping.value}
                value={topping.value}
                label={topping.value}
                // Only cards show a description.
                description={cards ? topping.description : undefined}
                accent={colorful ? topping.accent : undefined}
              />
            ))}
          </HpxCheckboxGroup>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Standalone</h2>
        <div className="rounded-lg border p-6 max-md:p-4">
          <HpxCheckboxItem label="I agree to the terms" checked={terms} onCheckedChange={setTerms} />
        </div>
      </div>

      <HpxControlsPanel title="Checkbox" {...panel} />
    </section>
  )
}
