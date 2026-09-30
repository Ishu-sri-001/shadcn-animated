"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxRadioGroup,
  HpxRadioGroupItem,
  type HpxRadioAppearance,
  type HpxRadioCardFill,
  type HpxRadioVariant,
} from "@/components/ui/radio-group"

const shipping = [
  { value: "Standard", description: "3–5 working days. Free.", accent: "var(--info)" },
  { value: "Express", description: "Next working day. £4.99.", accent: "var(--warning)" },
  { value: "Same day", description: "Order before noon. £9.99.", accent: "var(--destructive)" },
  { value: "Collect", description: "Pick up in store tomorrow.", accent: "var(--success)" },
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
    disabled: (v) => v.variant === "default",
    group: "Style",
    type: "select",
    label: "Card fill",
    value: "muted",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  showIcon: { group: "Style", type: "checkbox", label: "Show radio", value: true },

  dotSlide: { disabled: (v) => v.appearance === "full" || !v.showIcon, group: "Choosing", type: "checkbox", label: "Dot slides between", value: false },
  cardSlide: { disabled: (v) => v.variant === "default", group: "Choosing", type: "checkbox", label: "Card highlight slides between", value: true },
  bounce: { disabled: (v) => !v.showIcon, group: "Choosing", type: "checkbox", label: "Springy pick", value: true },

  appearance: {
    disabled: (v) => !v.showIcon,
    group: "Radio",
    type: "select",
    label: "Look",
    value: "outline",
    options: [
      { label: "Outline", value: "outline" },
      { label: "Filled", value: "filled" },
      { label: "Full", value: "full" },
    ],
  },

  reorder: { group: "Group", type: "checkbox", label: "Drag to reorder", value: false },
  colorful: { group: "Group", type: "checkbox", label: "Colour per option", value: false },
} satisfies HpxControlSchema

export function HpxRadioDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const { variant, cardFill, appearance, colorful, ...groupOptions } = values
  const cards = variant === "card"
  const [choice, setChoice] = React.useState("Express")

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Single select · {cards ? "Cards" : "Inline"}
      </h2>
      <div className="rounded-lg border p-6 max-md:p-4">
        <HpxRadioGroup
          {...groupOptions}
          variant={variant as HpxRadioVariant}
          cardFill={cardFill as HpxRadioCardFill}
          appearance={appearance as HpxRadioAppearance}
          value={choice}
          onValueChange={setChoice}
          aria-label="Delivery"
          className={
            cards ? "grid grid-cols-2 gap-3 max-md:grid-cols-1" : "flex flex-col gap-4"
          }
        >
          {shipping.map((option) => (
            <HpxRadioGroupItem
              key={option.value}
              value={option.value}
              label={option.value}
              // Only cards show a description.
              description={cards ? option.description : undefined}
              accent={colorful ? option.accent : undefined}
            />
          ))}
        </HpxRadioGroup>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: focus the group with Tab, then use the arrow keys, Home and End.
      </p>

      <HpxControlsPanel title="Radio" {...panel} />
    </section>
  )
}
