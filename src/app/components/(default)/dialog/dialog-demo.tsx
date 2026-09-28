"use client"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogButton,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogBackdrop,
  type DialogExit,
  type DialogRounded,
} from "@/components/ui/dialog"

const controls = {
  textRoll: { group: "Button", type: "checkbox", label: "Text roll on hover", value: true },
  fillOnHover: { group: "Button", type: "checkbox", label: "Fill on hover", value: false },

  fromTrigger: { group: "Opening", type: "checkbox", label: "Grow from button", value: true },
  springy: { group: "Opening", type: "checkbox", label: "Springy", value: true },
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
  bounce: { group: "Opening", type: "slider", label: "Bounce", value: 0.2, min: 0, max: 0.6, step: 0.05 },
  contentFade: { group: "Opening", type: "checkbox", label: "Content fade-in", value: true },
  contentScale: { group: "Opening", type: "checkbox", label: "Content scales in", value: false },

  exit: {
    group: "Closing",
    type: "select",
    label: "Exit",
    value: "fade",
    options: [
      { label: "Fade", value: "fade" },
      { label: "Drop", value: "drop" },
      { label: "Shrink", value: "shrink" },
    ],
  },
  contentFadeOut: { group: "Closing", type: "checkbox", label: "Content fades out first", value: true },
  dismissible: { group: "Closing", type: "checkbox", label: "Click outside closes", value: true },
  shakeOnBlock: { group: "Closing", type: "checkbox", label: "Shake when blocked", value: true },

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
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
      { label: "XL", value: "xl" },
      { label: "2XL", value: "2xl" },
      { label: "3XL", value: "3xl" },
    ],
  },
} satisfies ControlSchema

export function DialogDemo() {
  const panel = useControls(controls)
  const { values } = panel

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border">
        <Dialog
          {...values}
          backdrop={values.backdrop as DialogBackdrop}
          exit={values.exit as DialogExit}
          rounded={values.rounded as DialogRounded}
        >
          <DialogTrigger className="h-auto px-5 py-2.5 text-lg" render={<Button variant="outline" />}>Pause subscription</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pause your subscription?</DialogTitle>
              <DialogDescription>
                We&apos;ll skip your next two boxes. You can resume any time before Thursday noon
                and your next delivery goes out as usual.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<DialogButton />}>Keep it</DialogClose>
              <DialogClose render={<DialogButton />}>Pause</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: turn off &quot;Click outside closes&quot;, then click the backdrop.
      </p>

      <ControlsPanel title="Dialog" {...panel} />
    </div>
  )
}
