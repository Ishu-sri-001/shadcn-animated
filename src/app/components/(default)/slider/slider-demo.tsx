"use client"

import * as React from "react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Label } from "@/components/ui/label"
import {
  Slider,
  type SliderSize,
  type SliderThumbGrow,
  type SliderTicks,
  type SliderTooltip,
  type SliderTrackFill,
} from "@/components/ui/slider"

const controls = {
  trackFill: {
    group: "Track",
    type: "select",
    label: "Fill follows",
    value: "spring",
    options: [
      { label: "Spring", value: "spring" },
      { label: "Ease", value: "ease" },
      { label: "Exactly", value: "none" },
    ],
  },
  fillDuration: {
    group: "Track",
    type: "slider",
    label: "Fill duration",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  trackExpand: { group: "Track", type: "checkbox", label: "Thickens while dragging", value: true },
  ticks: {
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

  thumbGrow: {
    group: "Thumb",
    type: "select",
    label: "While dragging",
    value: "grow",
    options: [
      { label: "Grows", value: "grow" },
      { label: "Shrinks", value: "shrink" },
      { label: "Stays put", value: "none" },
    ],
  },
  tooltip: {
    group: "Thumb",
    type: "select",
    label: "Value bubble",
    value: "dragging",
    options: [
      { label: "While dragging", value: "dragging" },
      { label: "Always", value: "always" },
      { label: "Never", value: "none" },
    ],
  },

  size: {
    group: "Style",
    type: "select",
    label: "Size",
    value: "md",
    options: [
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
    ],
  },
} satisfies ControlSchema

export function SliderDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const [grind, setGrind] = React.useState(18)
  const [range, setRange] = React.useState([88, 96])

  const options = {
    trackFill: values.trackFill as SliderTrackFill,
    fillDuration: values.fillDuration,
    thumbGrow: values.thumbGrow as SliderThumbGrow,
    trackExpand: values.trackExpand,
    ticks: values.ticks as SliderTicks,
    tooltip: values.tooltip as SliderTooltip,
    size: values.size as SliderSize,
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col justify-center gap-[4vw] rounded-lg border px-[4vw] py-8 max-md:gap-[10vw]">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="grind">Grind size</Label>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{grind}</span>
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
          <p className="text-xs text-muted-foreground">
            Finer on the left, coarser on the right.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="temp">Water temperature</Label>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {range[0]}–{range[1]}°C
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
          <p className="text-xs text-muted-foreground">
            A range, so both thumbs animate independently.
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: drag a thumb, or click straight to a spot on the track to see the fill spring across.
      </p>

      <ControlsPanel title="Slider" {...panel} />
    </div>
  )
}
