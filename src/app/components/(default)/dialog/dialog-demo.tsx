"use client"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import {
  HpxDialog,
  HpxDialogButton,
  HpxDialogClose,
  HpxDialogContent,
  HpxDialogDescription,
  HpxDialogFooter,
  HpxDialogHeader,
  HpxDialogTitle,
  HpxDialogTrigger,
  type HpxDialogBackdrop,
  type HpxDialogExit,
  type HpxDialogRounded,
} from "@/components/ui/dialog"

const controls = {
  rollingText: { group: "Button", type: "checkbox", label: "Rolling text", value: true },
  fillOnHover: { group: "Button", type: "checkbox", label: "Fill on hover", value: false },

  originFromTrigger: { group: "Opening", type: "checkbox", label: "Origin from trigger", value: true },
  elastic: { group: "Opening", type: "checkbox", label: "Elastic", value: true },
  duration: {
    group: "Opening",
    type: "slider",
    label: "Duration",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: { disabled: (v) => !v.elastic, group: "Opening", type: "slider", label: "Bounce", value: 0.2, min: 0, max: 0.6, step: 0.05 },
  fadeContent: { group: "Opening", type: "checkbox", label: "Fade content", value: true },
  scaleContent: { disabled: (v) => !v.fadeContent, group: "Opening", type: "checkbox", label: "Scale content", value: false },

  exitAnimation: {
    disabled: (v) => !!v.originFromTrigger,
    group: "Closing",
    type: "select",
    label: "Exit animation",
    value: "fade",
    options: [
      { label: "Fade", value: "fade" },
      { label: "Drop", value: "drop" },
      { label: "Shrink", value: "shrink" },
    ],
  },
  fadeContentOut: { group: "Closing", type: "checkbox", label: "Fade content out", value: true },
  dismissible: { group: "Closing", type: "checkbox", label: "Click outside closes", value: true },
  shakeOnBlock: { disabled: (v) => !!v.dismissible, group: "Closing", type: "checkbox", label: "Shake when blocked", value: true },

  backdrop: {
    group: "Style",
    type: "select",
    label: "Backdrop",
    value: "blur",
    options: [
      { label: "None", value: "none" },
      { label: "Dim", value: "dim" },
      { label: "Blur", value: "blur" },
    ],
  },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "xl",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
      { label: "3xl", value: "3xl" },
    ],
  },
} satisfies HpxControlSchema

export function HpxDialogDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border">
        <HpxDialog
          {...values}
          backdrop={values.backdrop as HpxDialogBackdrop}
          exitAnimation={values.exitAnimation as HpxDialogExit}
          rounded={values.rounded as HpxDialogRounded}
        >
          <HpxDialogTrigger className="h-auto px-5 py-2.5 text-lg" render={<HpxButton variant="outline" />}>Pause subscription</HpxDialogTrigger>
          <HpxDialogContent>
            <HpxDialogHeader>
              <HpxDialogTitle>Pause your subscription?</HpxDialogTitle>
              <HpxDialogDescription>
                We&apos;ll skip your next two boxes. You can resume any time before Thursday noon
                and your next delivery goes out as usual.
              </HpxDialogDescription>
            </HpxDialogHeader>
            <HpxDialogFooter>
              <HpxDialogClose render={<HpxDialogButton />}>Keep it</HpxDialogClose>
              <HpxDialogClose render={<HpxDialogButton />}>Pause</HpxDialogClose>
            </HpxDialogFooter>
          </HpxDialogContent>
        </HpxDialog>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: turn off &quot;Click outside closes&quot;, then click the backdrop.
      </p>

      <HpxControlsPanel title="Dialog" {...panel} />
    </div>
  )
}
