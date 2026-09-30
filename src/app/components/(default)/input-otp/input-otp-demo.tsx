"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import {
  HpxInputOTP,
  HpxInputOTPGroup,
  HpxInputOTPSeparator,
  HpxInputOTPSlot,
  type HpxInputOTPAllow,
  type HpxInputOTPCharAnimation,
  type HpxInputOTPRounded,
  type HpxInputOTPSize,
} from "@/components/ui/input-otp"

/** The right code for each kind of input. */
const CODES: Record<HpxInputOTPAllow, string> = {
  numbers: "427193",
  letters: "KQWMZT",
  symbols: "!@#$%&",
  mixed: "A7#k2$",
}

/** Hover leaves the button's background alone; an underline draws in under its text instead. */
const LINE_BUTTON = "group/line"
/** Draws in from the left on hover and leaves to the right, like the drawer's Cancel. */
const LINE_TEXT =
  "relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out group-hover/line:after:origin-left group-hover/line:after:scale-x-100 group-focus-visible/line:after:origin-left group-focus-visible/line:after:scale-x-100 motion-reduce:after:transition-none"

const controls = {
  allow: {
    group: "Input",
    type: "select",
    label: "Allowed characters",
    value: "mixed",
    options: [
      { label: "Mixed", value: "mixed" },
      { label: "Numbers", value: "numbers" },
      { label: "Letters", value: "letters" },
      { label: "Special characters", value: "symbols" },
    ],
  },

  glide: { group: "Typing", type: "checkbox", label: "Ring glides between boxes", value: true },
  charAnimation: {
    group: "Typing",
    type: "select",
    label: "Character in",
    value: "pop",
    options: [
      { label: "Pop", value: "pop" },
      { label: "Roll", value: "roll" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  pasteStagger: {
    disabled: (v) => v.charAnimation === "none",
    group: "Typing",
    type: "slider",
    label: "Paste stagger",
    value: 0.05,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },

  shakeOnError: { group: "Result", type: "checkbox", label: "Shake when wrong", value: true },
  successWave: { group: "Result", type: "checkbox", label: "Green wave when right", value: true },

  boxSize: {
    group: "Style",
    type: "select",
    label: "Box size",
    value: "10",
    options: [
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "10", value: "10" },
      { label: "11", value: "11" },
      { label: "12", value: "12" },
      { label: "14", value: "14" },
    ],
  },
  joined: { group: "Style", type: "checkbox", label: "Joined boxes", value: false },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },
} satisfies HpxControlSchema

export function HpxInputOTPDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const allow = values.allow as HpxInputOTPAllow
  const CODE = CODES[allow]
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  // A new kind of input starts over
  const [lastAllow, setLastAllow] = React.useState(allow)
  if (lastAllow !== allow) {
    setLastAllow(allow)
    setCode("")
    setError(null)
  }

  const change = (next: string) => {
    setCode(next)
    setError(null)
  }

  const complete = code.length === CODE.length
  const success = complete && code === CODE
  const invalid = complete && code !== CODE

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border px-4">
        <HpxInputOTP
          maxLength={CODE.length}
          value={code}
          onChange={change}
          allow={allow}
          onReject={setError}
          invalid={invalid}
          success={success}
          aria-label="Verification code"
          glide={values.glide}
          charAnimation={values.charAnimation as HpxInputOTPCharAnimation}
          pasteStagger={values.pasteStagger}
          shakeOnError={values.shakeOnError}
          successWave={values.successWave}
          boxSize={values.boxSize as HpxInputOTPSize}
          rounded={values.rounded as HpxInputOTPRounded}
          joined={values.joined}
        >
          <HpxInputOTPGroup>
            <HpxInputOTPSlot index={0} />
            <HpxInputOTPSlot index={1} />
            <HpxInputOTPSlot index={2} />
          </HpxInputOTPGroup>
          <HpxInputOTPSeparator />
          <HpxInputOTPGroup>
            <HpxInputOTPSlot index={3} />
            <HpxInputOTPSlot index={4} />
            <HpxInputOTPSlot index={5} />
          </HpxInputOTPGroup>
        </HpxInputOTP>
        <p
          className={cn(
            "text-center text-sm text-muted-foreground",
            (error || invalid) && "text-destructive"
          )}
          aria-live="assertive"
        >
          {error
            ? error
            : success
              ? "Verified. Your delivery is confirmed."
              : invalid
                ? "That code isn't right. Check the email and try again."
                : "Enter the code we emailed you."}
        </p>
        <div className="flex gap-2">
          <HpxButton
            variant="ghost"
            size="sm"
            className={cn(LINE_BUTTON, "hover:bg-transparent dark:hover:bg-transparent")}
            onClick={() => change(CODE)}
          >
            <span className={LINE_TEXT}>Paste the right code</span>
          </HpxButton>
          <HpxButton
            variant="ghost"
            size="sm"
            className={cn(LINE_BUTTON, "hover:bg-transparent dark:hover:bg-transparent")}
            onClick={() => change("")}
          >
            <span className={LINE_TEXT}>Clear</span>
          </HpxButton>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: the right code is {CODE}. Any other six characters shows the error, and a character
        that isn&apos;t allowed is blocked with a message.
      </p>

      <HpxControlsPanel title="Input OTP" {...panel} />
    </div>
  )
}
