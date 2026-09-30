"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxAnimatedButton,
  type HpxAnimatedButtonIcon,
  type HpxAnimatedButtonIconPosition,
  type HpxAnimatedButtonRounded,
  type HpxAnimatedButtonStatus,
  type HpxAnimatedButtonSurface,
  type HpxAnimatedButtonTone,
  type HpxAnimatedButtonVariant,
} from "@/components/ui/animated-button"

const controls = {
  variant: {
    group: "Effect",
    type: "select",
    label: "Hover effect",
    value: "dot-fill",
    options: [
      { label: "Dot fill", value: "dot-fill" },
      { label: "Char stagger", value: "char-stagger" },
      { label: "Scramble", value: "scramble" },
      { label: "Link (line draw)", value: "link" },
      { label: "Border draw", value: "border-draw" },
    ],
  },
  surface: {
    disabled: (v) => v.variant === "link",
    group: "Effect",
    type: "select",
    label: "Background",
    value: "filled",
    options: [
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
      { label: "Plain", value: "plain" },
    ],
  },
  tone: {
    group: "Effect",
    type: "select",
    label: "Colour",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
      { label: "Destructive", value: "destructive" },
      { label: "Success", value: "success" },
      { label: "Warning", value: "warning" },
      { label: "Info", value: "info" },
      { label: "Gradient", value: "gradient" },
    ],
  },
  underline: { disabled: (v) => v.surface !== "plain" || v.variant === "link", group: "Effect", type: "checkbox", label: "Line under text (plain)", value: true },
  textRoll: { disabled: (v) => v.variant === "char-stagger" || v.variant === "scramble", group: "Effect", type: "checkbox", label: "Text roll on hover", value: true },
  shimmer: { disabled: (v) => v.variant === "char-stagger" || v.variant === "scramble", group: "Effect", type: "checkbox", label: "Text shimmer (loops)", value: false },
  press: { group: "Effect", type: "checkbox", label: "Press effect (scale down)", value: true },
  magnetic: { group: "Effect", type: "checkbox", label: "Magnetic", value: false },
  loadingState: { group: "State", type: "checkbox", label: "Loading, then success on click", value: false },
  icon: {
    group: "Icon",
    type: "select",
    label: "Icon",
    value: "arrow",
    options: [
      { label: "None", value: "none" },
      { label: "Arrow", value: "arrow" },
      { label: "Search", value: "search" },
      { label: "Settings", value: "settings" },
    ],
  },
  iconPosition: {
    disabled: (v) => v.icon === "none",
    group: "Icon",
    type: "select",
    label: "Icon position",
    value: "end",
    options: [
      { label: "End", value: "end" },
      { label: "Start", value: "start" },
    ],
  },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "full",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
      { label: "Full", value: "full" },
    ],
  },
  duration: {
    group: "Motion",
    type: "slider",
    label: "Duration",
    value: 0.55,
    min: 0.2,
    max: 1.2,
    step: 0.05,
    unit: "s",
  },
  stagger: {
    disabled: (v) => v.variant !== "char-stagger",
    group: "Motion",
    type: "slider",
    label: "Letter stagger",
    value: 0.02,
    min: 0,
    max: 0.08,
    step: 0.005,
    unit: "s",
  },
} satisfies HpxControlSchema

export function HpxButtonDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [simulated, setSimulated] = React.useState<HpxAnimatedButtonStatus>("idle")
  const timers = React.useRef<number[]>([])
  const status = values.loadingState ? simulated : "idle"

  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(window.clearTimeout)
  }, [])

  // Click: loads for a moment, shows the check, then resets
  const simulate = () => {
    if (!values.loadingState || simulated !== "idle") return
    setSimulated("loading")
    timers.current.push(
      window.setTimeout(() => setSimulated("success"), 1500),
      window.setTimeout(() => setSimulated("idle"), 3200)
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border px-[4vw] py-8">
        <HpxAnimatedButton
          variant={values.variant as HpxAnimatedButtonVariant}
          surface={values.surface as HpxAnimatedButtonSurface}
          tone={values.tone as HpxAnimatedButtonTone}
          shimmer={values.shimmer}
          textRoll={values.textRoll}
          magnetic={values.magnetic}
          press={values.press}
          status={status}
          loadingText={values.loadingState ? "Loading" : undefined}
          successText={values.loadingState ? "Success" : undefined}
          onClick={simulate}
          iconPosition={values.iconPosition as HpxAnimatedButtonIconPosition}
          underline={values.underline}
          icon={values.icon as HpxAnimatedButtonIcon}
          rounded={values.rounded as HpxAnimatedButtonRounded}
          duration={values.duration}
          stagger={values.stagger}
        >
          Hover me
        </HpxAnimatedButton>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: hover in from different sides to see where the dot fill starts. Click it to see the loading and success state.
      </p>

      <HpxControlsPanel title="Button" {...panel} />
    </div>
  )
}
