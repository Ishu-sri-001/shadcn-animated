"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxLabel } from "@/components/ui/label"
import {
  HpxRollingNumber,
  HpxSlider,
  type HpxSliderEdgeSize,
  type HpxSliderLabels,
  type HpxSliderThicken,
  type HpxSliderThickness,
  type HpxSliderEdgePress,
  type HpxSliderEdgeVariant,
  type HpxSliderMarks,
  type HpxSliderRadius,
  type HpxSliderBubble,
} from "@/components/ui/slider"

const controls = {
  smooth: { group: "Track", type: "checkbox", label: "Smooth (no snapping)", value: false },
  duration: {
    group: "Track",
    type: "slider",
    label: "Spring duration",
    value: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    group: "Track",
    type: "slider",
    label: "Spring bounce",
    value: 0,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
  thicken: {
    group: "Track",
    type: "select",
    label: "Thickens on",
    value: "hover",
    options: [
      { label: "Hover", value: "hover" },
      { label: "Drag", value: "drag" },
      { label: "Never", value: "none" },
    ],
  },
  elastic: { group: "Track", type: "checkbox", label: "Stretches past the ends", value: true },
  stretch: {
    disabled: (v) => !v.elastic,
    group: "Track",
    type: "slider",
    label: "Stretch amount",
    value: 10,
    min: 2,
    max: 30,
    step: 1,
    unit: "%",
  },
  labels: {
    group: "Track",
    type: "select",
    label: "Values on rail",
    value: "rail",
    options: [
      { label: "Show", value: "rail" },
      { label: "Hide", value: "none" },
    ],
  },
  thickenTo: {
    disabled: (v) => v.thicken === "none",
    group: "Track",
    type: "select",
    label: "Thickened size",
    value: "13",
    options: [
      { label: "0.5", value: "0.5" },
      { label: "1", value: "1" },
      { label: "1.5", value: "1.5" },
      { label: "2.5", value: "2.5" },
      { label: "4", value: "4" },
      { label: "13", value: "13" },
    ],
  },
  radius: {
    group: "Track",
    type: "select",
    label: "Roundness",
    value: "xl",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },
  marks: {
    group: "Track",
    type: "select",
    label: "Step marks",
    value: "none",
    options: [
      { label: "None", value: "none" },
      { label: "Dots", value: "dots" },
      { label: "Lines", value: "lines" },
    ],
  },
  showEdge: { group: "Edge", type: "checkbox", label: "Show edge", value: true },
  edgePress: {
    disabled: (v) => !v.showEdge,
    group: "Edge",
    type: "select",
    label: "While dragging",
    value: "shrink",
    options: [
      { label: "Grows", value: "grow" },
      { label: "Shrinks", value: "shrink" },
      { label: "Stays put", value: "none" },
    ],
  },
  edgeVariant: {
    disabled: (v) => !v.showEdge,
    group: "Edge",
    type: "select",
    label: "Style",
    value: "bar",
    options: [
      { label: "Bar", value: "bar" },
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
    ],
  },
  bubble: {
    group: "Edge",
    type: "select",
    label: "Value bubble",
    value: "hover",
    options: [
      { label: "Follows cursor", value: "hover" },
      { label: "While dragging", value: "dragging" },
      { label: "Always", value: "always" },
      { label: "Never", value: "none" },
    ],
  },
  roll: { disabled: (v) => v.bubble === "none", group: "Edge", type: "checkbox", label: "Roll the numbers", value: true },

  edgeSize: {
    disabled: (v) => !v.showEdge || v.edgeVariant === "bar",
    group: "Style",
    type: "select",
    label: "Edge size",
    value: "md",
    options: [
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
    ],
  },
} satisfies HpxControlSchema

function Rolled({ on, value }: { on: boolean; value: string }) {
  return on ? <HpxRollingNumber value={value} /> : value
}

export function HpxSliderDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [grind, setGrind] = React.useState(18)
  const [range, setRange] = React.useState([88, 96])

  const options = {
    duration: values.duration,
    bounce: values.bounce,
    edgePress: values.edgePress as HpxSliderEdgePress,
    thicken: values.thicken as HpxSliderThicken,
    elastic: values.elastic,
    stretch: values.stretch,
    labels: values.labels as HpxSliderLabels,
    marks: values.marks as HpxSliderMarks,
    bubble: values.bubble as HpxSliderBubble,
    edgeVariant: values.edgeVariant as HpxSliderEdgeVariant,
    roll: values.roll,
    showEdge: values.showEdge,
    radius: values.radius as HpxSliderRadius,
    thickenTo: values.thickenTo as HpxSliderThickness,
    edgeSize: values.edgeSize as HpxSliderEdgeSize,
    smooth: values.smooth,
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col justify-center gap-[4vw] rounded-lg border px-[4vw] py-8 max-md:gap-[10vw]">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <HpxLabel htmlFor="grind">Grind size</HpxLabel>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              <Rolled on={values.roll} value={String(grind)} />
            </span>
          </div>
          <HpxSlider
            id="grind"
            min={1}
            max={30}
            step={1}
            value={grind}
            onValueChange={(v) => setGrind(v as number)}
            {...options}
          />
          <p className="text-xs mt-2 text-muted-foreground">
            Finer on the left, coarser on the right.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <HpxLabel htmlFor="temp">Water temperature</HpxLabel>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              <Rolled on={values.roll} value={String(range[0])} />–
              <Rolled on={values.roll} value={String(range[1])} />°C
            </span>
          </div>
          <HpxSlider
            id="temp"
            min={80}
            max={100}
            step={1}
            value={range}
            onValueChange={(v) => setRange(v as number[])}
            {...options}
          />
          <p className="text-xs mt-2 text-muted-foreground">
            A range, so both edges animate independently.
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: drag an edge, or click straight to a spot on the track to see the fill spring across.
      </p>

      <HpxControlsPanel title="Slider" {...panel} />
    </div>
  )
}
