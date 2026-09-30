"use client"

import { Archive, Copy, Pencil, Share2, Trash2 } from "lucide-react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxFloatingTooltip,
  HpxFloatingTooltipProvider,
  type HpxFloatingTooltipAppear,
  type HpxFloatingTooltipChange,
  type HpxFloatingTooltipFollow,
  type HpxFloatingTooltipOffset,
  type HpxFloatingTooltipRounded,
  type HpxFloatingTooltipSide,
  type HpxFloatingTooltipVariant,
} from "@/components/ui/floating-tooltip"

// Short and long text, so the box visibly reshapes as you move along
const actions = [
  { label: "Share", Icon: Share2, content: "Share link", description: "Copy a shareable link to clipboard." },
  { label: "Edit", Icon: Pencil, content: "Edit", description: "Open in the inline editor." },
  {
    label: "Duplicate",
    Icon: Copy,
    content: "Duplicate this document",
    description: "Creates an exact copy in this folder, including every comment and revision.",
  },
  { label: "Archive", Icon: Archive, content: "Archive", description: "Move to archive. Reversible at any time." },
  { label: "Delete", Icon: Trash2, content: "Delete permanently", description: "This action cannot be undone." },
]

const rounded = [
  { label: "None", value: "none" },
  { label: "sm", value: "sm" },
  { label: "md", value: "md" },
  { label: "lg", value: "lg" },
  { label: "xl", value: "xl" },
  { label: "Full", value: "full" },
]

const controls = {
  variant: {
    group: "Look",
    type: "select",
    label: "Style",
    value: "default",
    options: [
      { label: "Filled", value: "default" },
      { label: "Outline", value: "outline" },
    ],
  },
  rounded: { group: "Look", type: "select", label: "Roundness", value: "md", options: rounded },

  follow: {
    group: "Position",
    type: "select",
    label: "Position",
    value: "cursor",
    options: [
      { label: "Trails the cursor", value: "cursor" },
      { label: "Sits on the element", value: "anchor" },
    ],
  },
  side: {
    group: "Position",
    type: "select",
    label: "Side",
    value: "top",
    options: [
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
  },
  offset: {
    group: "Position",
    type: "select",
    label: "Distance",
    value: "4",
    options: [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "6", value: "6" },
      { label: "8", value: "8" },
    ],
  },

  change: {
    group: "Moving between",
    type: "select",
    label: "When it changes",
    value: "slide",
    options: [
      { label: "Swap text", value: "instant" },
      { label: "Morph and fade", value: "fade" },
      { label: "Morph and slide", value: "slide" },
      { label: "Morph and roll", value: "roll" },
    ],
  },
  duration: {
    group: "Moving between",
    type: "slider",
    label: "Reshape time",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },

  elastic: { group: "Feel", type: "checkbox", label: "Elastic", value: true },
  bounce: {
    disabled: (v) => !v.elastic && v.change === "instant",
    group: "Feel",
    type: "slider",
    label: "Bounce",
    value: 0.2,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
  stretch: { disabled: (v) => !v.elastic, group: "Feel", type: "checkbox", label: "Stretches with speed (elastic)", value: true },
  tilt: { disabled: (v) => !v.elastic, group: "Feel", type: "checkbox", label: "Leans with speed (elastic)", value: true },
  stiffness: {
    group: "Feel",
    type: "slider",
    label: "Follow speed",
    value: 750,
    min: 100,
    max: 1500,
    step: 50,
  },

  appear: {
    group: "Show and hide",
    type: "select",
    label: "Appears with",
    value: "scale",
    options: [
      { label: "Scale + fade", value: "scale" },
      { label: "Fade", value: "fade" },
      { label: "Nothing", value: "none" },
    ],
  },
  closeDelay: {
    group: "Show and hide",
    type: "slider",
    label: "Close delay",
    value: 0.1,
    min: 0,
    max: 0.6,
    step: 0.05,
    unit: "s",
  },
} satisfies HpxControlSchema

export function HpxTooltipDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] items-center justify-center rounded-lg border px-4 py-8">
        <HpxFloatingTooltipProvider
          variant={values.variant as HpxFloatingTooltipVariant}
          rounded={values.rounded as HpxFloatingTooltipRounded}
          follow={values.follow as HpxFloatingTooltipFollow}
          side={values.side as HpxFloatingTooltipSide}
          offset={values.offset as HpxFloatingTooltipOffset}
          change={values.change as HpxFloatingTooltipChange}
          duration={values.duration}
          bounce={values.bounce}
          elastic={values.elastic}
          stretch={values.stretch}
          tilt={values.tilt}
          stiffness={values.stiffness}
          appear={values.appear as HpxFloatingTooltipAppear}
          closeDelay={values.closeDelay}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            {actions.map(({ label, Icon, content, description }) => (
              <HpxFloatingTooltip key={label} content={content} description={description}>
                <button className="flex items-center gap-2 rounded-lg border bg-background px-5 py-3 text-base font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <Icon className="size-4" />
                  <span>{label}</span>
                </button>
              </HpxFloatingTooltip>
            ))}
          </div>
        </HpxFloatingTooltipProvider>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: move the pointer across the buttons (on a touch screen, tap one). Set &quot;When it changes&quot; to a Morph option to see one tooltip
        stay put while its box reshapes and the text slides, fades or rolls the way you moved.
      </p>

      <HpxControlsPanel title="Tooltip" {...panel} />
    </div>
  )
}
