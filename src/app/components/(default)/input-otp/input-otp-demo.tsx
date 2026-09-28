"use client"

import * as React from "react"
import { cn } from "cn"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  type InputOTPCharAnimation,
  type InputOTPRounded,
  type InputOTPSize,
} from "@/components/ui/input-otp"

const CODE = "427193"

/** Hover leaves the button's background alone; an underline draws in under its text instead. */
const LINE_BUTTON = "group/line"
/** Draws in from the left on hover and leaves to the right, like the drawer's Cancel. */
const LINE_TEXT =
  "relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out group-hover/line:after:origin-left group-hover/line:after:scale-x-100 group-focus-visible/line:after:origin-left group-focus-visible/line:after:scale-x-100 motion-reduce:after:transition-none"

const controls = {
  glide: { group: "Typing", type: "checkbox", label: "Ring glides between boxes", value: true },
  charAnimation: {
    group: "Typing",
    type: "select",
    label: "Digit in",
    value: "pop",
    options: [
      { label: "Pop", value: "pop" },
      { label: "Roll", value: "roll" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  pasteStagger: {
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
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
      { label: "XL", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },
} satisfies ControlSchema

export function InputOTPDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const [code, setCode] = React.useState("")

  const complete = code.length === CODE.length
  const success = complete && code === CODE
  const invalid = complete && code !== CODE

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border px-4">
        <InputOTP
          maxLength={CODE.length}
          value={code}
          onChange={setCode}
          invalid={invalid}
          success={success}
          aria-label="Verification code"
          glide={values.glide}
          charAnimation={values.charAnimation as InputOTPCharAnimation}
          pasteStagger={values.pasteStagger}
          shakeOnError={values.shakeOnError}
          successWave={values.successWave}
          boxSize={values.boxSize as InputOTPSize}
          rounded={values.rounded as InputOTPRounded}
          joined={values.joined}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {success
            ? "Verified. Your delivery is confirmed."
            : invalid
              ? "That code isn't right. Check the email and try again."
              : "Enter the code we emailed you."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(LINE_BUTTON, "hover:bg-transparent dark:hover:bg-transparent")}
            onClick={() => setCode(CODE)}
          >
            <span className={LINE_TEXT}>Paste the right code</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(LINE_BUTTON, "hover:bg-transparent dark:hover:bg-transparent")}
            onClick={() => setCode("")}
          >
            <span className={LINE_TEXT}>Clear</span>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: the right code is {CODE}. Any other six digits shows the error.
      </p>

      <ControlsPanel title="Input OTP" {...panel} />
    </div>
  )
}
