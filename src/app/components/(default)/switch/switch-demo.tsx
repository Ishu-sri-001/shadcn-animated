"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxSwitch,
  type HpxSwitchColor,
  type HpxSwitchLabelSide,
  type HpxSwitchRounded,
  type HpxSwitchSize,
  type HpxSwitchVariant,
} from "@/components/ui/switch"

const controls = {
  variant: {
    group: "Style",
    type: "select",
    label: "Switch type",
    value: "elastic",
    options: [
      { label: "Elastic", value: "elastic" },
      { label: "Apple", value: "apple" },
    ],
  },
  size: {
    group: "Style",
    type: "select",
    label: "Size",
    value: "xl",
    options: [
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
    ],
  },
  color: {
    group: "Style",
    type: "select",
    label: "On colour",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Foreground", value: "foreground" },
      { label: "Green", value: "green" },
      { label: "Blue", value: "blue" },
      { label: "Orange", value: "orange" },
      { label: "Rose", value: "rose" },
    ],
  },
  green: { disabled: (v) => v.variant !== "apple" || v.color !== "foreground", group: "Style", type: "checkbox", label: "iOS green (Apple)", value: false },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "full",
    options: [
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },
  marks: { group: "Style", type: "checkbox", label: "I / O marks", value: false },
  labelSide: {
    group: "Style",
    type: "select",
    label: "Text position",
    value: "top",
    options: [
      { label: "Above", value: "top" },
      { label: "Below", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
  },

  squeeze: {
    group: "Motion",
    type: "slider",
    label: "Press squeeze",
    value: 0.18,
    min: 0,
    max: 0.4,
    step: 0.01,
  },
  duration: {
    group: "Motion",
    type: "slider",
    label: "Travel time",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    group: "Motion",
    type: "slider",
    label: "Bounce",
    value: 0.3,
    min: 0,
    max: 0.7,
    step: 0.05,
  },
} satisfies HpxControlSchema

export function HpxSwitchDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [on, setOn] = React.useState(true)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] items-center justify-center rounded-lg border px-4 py-8">
        <HpxSwitch
          checked={on}
          onCheckedChange={setOn}
          label="Wi-Fi"
          variant={values.variant as HpxSwitchVariant}
          size={values.size as HpxSwitchSize}
          color={values.color as HpxSwitchColor}
          green={values.green}
          rounded={values.rounded as HpxSwitchRounded}
          marks={values.marks}
          labelSide={values.labelSide as HpxSwitchLabelSide}
          squeeze={values.squeeze}
          duration={values.duration}
          bounce={values.bounce}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: press and hold to see the handle squeeze before you let go. On Apple, drag the handle across.
      </p>

      <HpxControlsPanel title="Switch" {...panel} />
    </div>
  )
}
