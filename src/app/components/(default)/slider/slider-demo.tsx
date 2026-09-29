"use client"

import * as React from "react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Label } from "@/components/ui/label"
import {
  RollingNumber,
  Slider,
  type SliderEdgeSize,
  type SliderLabels,
  type SliderThicken,
  type SliderThickness,
  type SliderEdgePress,
  type SliderEdgeVariant,
  type SliderMarks,
  type SliderRadius,
  type SliderBubble,
} from "@/components/ui/slider"

const controls = {
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
  showEdge: { group: "Edge", type: "checkbox", label: "Show edge", value: true },
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
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
      { label: "XL", value: "xl" },
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

  edgePress: {
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
  roll: { group: "Edge", type: "checkbox", label: "Roll the numbers", value: true },

  edgeSize: {
    group: "Style",
    type: "select",
    label: "Edge size",
    value: "md",
    options: [
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
    ],
  },
} satisfies ControlSchema

function Rolled({ on, value }: { on: boolean; value: string }) {
  return on ? <RollingNumber value={value} /> : value
}

export function SliderDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const [grind, setGrind] = React.useState(18)
  const [range, setRange] = React.useState([88, 96])

  const options = {
    duration: values.duration,
    bounce: values.bounce,
    edgePress: values.edgePress as SliderEdgePress,
    thicken: values.thicken as SliderThicken,
    elastic: values.elastic,
    stretch: values.stretch,
    labels: values.labels as SliderLabels,
    marks: values.marks as SliderMarks,
    bubble: values.bubble as SliderBubble,
    edgeVariant: values.edgeVariant as SliderEdgeVariant,
    roll: values.roll,
    showEdge: values.showEdge,
    radius: values.radius as SliderRadius,
    thickenTo: values.thickenTo as SliderThickness,
    edgeSize: values.edgeSize as SliderEdgeSize,
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col justify-center gap-[4vw] rounded-lg border px-[4vw] py-8 max-md:gap-[10vw]">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="grind">Grind size</Label>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              <Rolled on={values.roll} value={String(grind)} />
            </span>
          </div>
          <Slider
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
            <Label htmlFor="temp">Water temperature</Label>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              <Rolled on={values.roll} value={String(range[0])} />–
              <Rolled on={values.roll} value={String(range[1])} />°C
            </span>
          </div>
          <Slider
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

      <ControlsPanel title="Slider" {...panel} />
    </div>
  )
}
