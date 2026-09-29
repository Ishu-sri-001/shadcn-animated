"use client"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  type HoverCardAnimation,
  type HoverCardRounded,
} from "@/components/ui/hover-card"

const controls = {
  contentAnimation: {
    group: "Opening",
    type: "select",
    label: "Content in",
    value: "scale",
    options: [
      { label: "Scale + fade", value: "scale" },
      { label: "Fade", value: "fade" },
    ],
  },
  startScale: {
    group: "Opening",
    type: "slider",
    label: "Start scale",
    value: 0.9,
    min: 0.5,
    max: 1,
    step: 0.05,
  },
  contentFade: { group: "Opening", type: "checkbox", label: "Content fade-in", value: true },

  openDelay: {
    group: "Timing",
    type: "slider",
    label: "Open after",
    value: 400,
    min: 0,
    max: 1000,
    step: 50,
    unit: "ms",
  },
  closeDelay: {
    group: "Timing",
    type: "slider",
    label: "Close after",
    value: 200,
    min: 0,
    max: 1000,
    step: 50,
    unit: "ms",
  },

  followCursor: { group: "Link", type: "checkbox", label: "Follow the pointer", value: false },
  underline: { group: "Link", type: "checkbox", label: "Underline draws in", value: true },

  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
      { label: "XL", value: "xl" },
      { label: "2XL", value: "2xl" },
    ],
  },
} satisfies ControlSchema

const roasts = [
  {
    name: "Ethiopia Guji",
    process: "Washed · Light roast",
    notes: "Jasmine, peach and black tea. Bright and clean, best on filter.",
    color: "bg-amber-200 dark:bg-amber-900",
  },
  {
    name: "Colombia Huila",
    process: "Honey · Medium roast",
    notes: "Red apple, caramel and cocoa. Sweet enough for espresso.",
    color: "bg-orange-300 dark:bg-orange-900",
  },
]

export function HoverCardDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const options = {
    ...values,
    contentAnimation: values.contentAnimation as HoverCardAnimation,
    rounded: values.rounded as HoverCardRounded,
  }

  const link = (roast: (typeof roasts)[number]) => (
    <HoverCard {...options}>
      <HoverCardTrigger
        href="#"
        onClick={(event) => event.preventDefault()}
        className={values.underline ? "font-medium" : "font-medium underline underline-offset-4"}
      >
        {roast.name}
      </HoverCardTrigger>
      <HoverCardContent className="flex flex-col gap-2">
        <div className={`h-[8vh] rounded-md ${roast.color}`} />
        <span className="font-medium">{roast.name}</span>
        <span className="text-xs text-muted-foreground">{roast.process}</span>
        <span className="text-muted-foreground">{roast.notes}</span>
      </HoverCardContent>
    </HoverCard>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border px-6 text-sm">
        <p className="max-w-[70%] text-lg text-center leading-relaxed">
          This week&apos;s filter is {link(roasts[0])}, and on espresso we&apos;re pulling{" "}
          {link(roasts[1])} until Saturday.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">Tip: hover a coffee name and hold still, or tap it on a touch screen.</p>

      <ControlsPanel title="Hover Card" {...panel} />
    </div>
  )
}
