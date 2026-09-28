"use client"

import * as React from "react"
import { cn } from "cn"
import { AnimatePresence, motion } from "motion/react"
import { z } from "zod"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldInput,
  FieldLegend,
  FieldSet,
  type FieldErrorAnimation,
  type FieldLabelStyle,
  type FieldRounded,
} from "@/components/ui/field"
import { FillButton } from "@/components/ui/hover-effects"

const controls = {
  labelStyle: {
    group: "Label",
    type: "select",
    label: "Label",
    value: "floating",
    options: [
      { label: "Floating", value: "floating" },
      { label: "Inside, fades on typing", value: "inside" },
      { label: "Above", value: "above" },
    ],
  },

  successTick: { group: "Input", type: "checkbox", label: "Tick when valid", value: true },
  counter: { group: "Input", type: "checkbox", label: "Rolling character count", value: true },
  description: { group: "Input", type: "checkbox", label: "Hint under email", value: false },
  rounded: {
    group: "Input",
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

  // Off: anything goes, empty included, so no errors show. On: the fields are checked.
  validate: { group: "Errors", type: "checkbox", label: "Check required fields", value: false },
  errorAnimation: {
    group: "Errors",
    type: "select",
    label: "Error message entry",
    value: "slide",
    options: [
      { label: "Slide open", value: "slide" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  shakeOnError: { group: "Errors", type: "checkbox", label: "Shake on error", value: true },
} satisfies ControlSchema

/**
 * Fades the form's pieces in one after another when the page loads. A CSS animation, so it
 * plays from the server-rendered page without the form showing first.
 */
function enter(order: number) {
  return {
    className:
      "animate-in fade-in-0 animation-duration-500 ease-out fill-mode-backwards motion-reduce:animate-none",
    style: { animationDelay: `${order * 80}ms` },
  }
}

/** How long the "Address saved" message stays. */
const SAVED_FOR_MS = 3000

/** The rules the form is checked against when "Check required fields" is on. */
const addressSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.email("Enter an email like sam@example.com."),
  postcode: z.string().trim().min(5, "Enter a full postcode."),
  note: z.string().max(60, "Keep the note under 60 characters."),
})

export function FieldDemo() {
  const panel = useControls(controls)
  const { counter, description, rounded, errorAnimation, labelStyle, validate, ...options } =
    panel.values

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [note, setNote] = React.useState("")
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  // Each successful save gets a new id, so the message replays even if it's still showing.
  const [savedId, setSavedId] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (savedId === null) return
    const timer = window.setTimeout(() => setSavedId(null), SAVED_FOR_MS)
    return () => window.clearTimeout(timer)
  }, [savedId])

  // With checks on, zod decides what's valid; each field shows its first problem once it has
  // been left (or Save pressed). With checks off any value is accepted, so a field is "valid"
  // once it has anything in it.
  const result = addressSchema.safeParse({ name, email, postcode, note })
  const problems = result.success ? {} : z.flattenError(result.error).fieldErrors
  const filled = (value: string) => value.trim() !== ""
  const valid = {
    name: validate ? !problems.name : filled(name),
    email: validate ? !problems.email : filled(email),
    postcode: validate ? !problems.postcode : filled(postcode),
  }
  const errorFor = (key: "name" | "email" | "postcode") =>
    validate && touched[key] ? (problems[key]?.[0] ?? null) : null
  const errors = { name: errorFor("name"), email: errorFor("email"), postcode: errorFor("postcode") }

  return (
    <div className="flex flex-col gap-3">
      <form
        noValidate
        className="flex flex-col gap-6 rounded-lg border p-6 max-md:p-4"
        onSubmit={(event) => {
          event.preventDefault()
          setTouched({ name: true, email: true, postcode: true })
          // With checks off anything goes, so every save succeeds.
          const ok = !validate || result.success
          setSavedId(ok ? Date.now() : null)
        }}
      >
        <FieldSet>
          {/* A legend isn't a flex item of its fieldset, so the set's gap doesn't reach it. */}
          <FieldLegend style={enter(0).style} className={cn("mb-12", enter(0).className)}>
            Delivery address
          </FieldLegend>
          <FieldGroup
          className=""
            {...options}
            rounded={rounded as FieldRounded}
            errorAnimation={errorAnimation as FieldErrorAnimation}
            labelStyle={labelStyle as FieldLabelStyle}
          >
            <Field invalid={!!errors.name} valid={valid.name} {...enter(1)}>
              <FieldInput
                label="Name"
                placeholder="Sam Rivera"
                value={name}
                maxLength={40}
                counter={counter}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => touch("name")}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>
            <Field invalid={!!errors.email} valid={valid.email} {...enter(2)}>
              <FieldInput
                label="Email"
                type="email"
                placeholder="sam@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => touch("email")}
              />
              {description && <FieldDescription>We&apos;ll send tracking here.</FieldDescription>}
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field invalid={!!errors.postcode} valid={valid.postcode} {...enter(3)}>
              <FieldInput
                label="Postcode"
                placeholder="BS1 4DJ"
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                onBlur={() => touch("postcode")}
              />
              <FieldError>{errors.postcode}</FieldError>
            </Field>
            <Field {...enter(4)}>
              <FieldInput
                label="Note for the courier"
                placeholder="Leave it by the blue door"
                value={note}
                maxLength={60}
                counter={counter}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <div style={enter(5).style} className={cn("flex items-center gap-4", enter(5).className)}>
          <FillButton type="submit" className="h-auto px-5 py-2.5 text-base">
            Save address
          </FillButton>
          <AnimatePresence mode="wait">
            {savedId !== null && (
              <motion.p
                key={savedId}
                role="status"
                className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                  />
                </svg>
                Address saved
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
      <p className="text-sm text-muted-foreground">
        Tip: turn on &quot;Check required fields&quot;, then press Save with the form empty to see the errors.
      </p>

      <ControlsPanel title="Field" {...panel} />
    </div>
  )
}
