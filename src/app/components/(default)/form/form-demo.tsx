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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerIcon,
  DropdownMenuValue,
} from "@/components/ui/dropdown-menu"

import { countries } from "./countries"

const selectorRadius: Record<FieldRounded, string> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md",
  lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full",
}

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

  successTick: { disabled: (v) => !v.validate, group: "Input", type: "checkbox", label: "Tick when valid", value: true },
  counter: { group: "Input", type: "checkbox", label: "Rolling character count", value: true },
  description: { group: "Input", type: "checkbox", label: "Hint under email", value: false },
  rounded: {
    group: "Input",
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

  // Off: anything goes, empty included, so no errors show. On: the fields are checked.
  validate: { group: "Errors", type: "checkbox", label: "Check required fields", value: false },
  errorAnimation: {
    disabled: (v) => !v.validate,
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
  shakeOnError: { disabled: (v) => !v.validate, group: "Errors", type: "checkbox", label: "Shake on error", value: true },
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

export function FormDemo() {
  const panel = useControls(controls)
  const { counter, description, rounded, errorAnimation, labelStyle, validate, ...options } =
    panel.values

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [note, setNote] = React.useState("")
  const [countryId, setCountryId] = React.useState("IN")
  const [mobile, setMobile] = React.useState("")
  const country = countries.find((item) => item.id === countryId) ?? countries[0]
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
                label={validate ? "Name *" : "Name"}
                required={validate}
                placeholder={labelStyle === "floating" ? " " : "Sam Rivera"}
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
                label={validate ? "Email *" : "Email"}
                required={validate}
                type="email"
                placeholder={labelStyle === "floating" ? " " : "sam@example.com"}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => touch("email")}
              />
              {description && <FieldDescription className="text-sm">We&apos;ll send tracking here.</FieldDescription>}
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field {...enter(3)}>
              <div className="flex items-end gap-2">
                <DropdownMenu animation="scale" duration={0.3} delay={0.02} stagger={0} highlight="slide" highlightColor="muted" typeahead>
                  <DropdownMenuTrigger
                    type="button"
                    animateValue
                    aria-label={`Country calling code: ${country.name} ${country.code}`}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border border-input bg-transparent px-2.5 text-sm shadow-xs transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30",
                      labelStyle === "above" ? "h-9" : "h-11",
                      selectorRadius[rounded as FieldRounded]
                    )}
                  >
                    <DropdownMenuValue>{`${country.flag} ${country.code}`}</DropdownMenuValue>
                    <DropdownMenuTriggerIcon icon="chevron" className="size-3.5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72 w-72 max-w-[calc(100vw-2rem)] p-1.5">
                    <DropdownMenuRadioGroup aria-label="Country calling code" value={countryId} onValueChange={setCountryId}>
                      {countries.map((item) => (
                        <DropdownMenuRadioItem key={item.id} value={item.id} label={item.name} className="py-2.5">
                          <span aria-hidden>{item.flag}</span>
                          <DropdownMenuItemTitle>{item.name}</DropdownMenuItemTitle>
                          <span className="ml-auto text-sm tabular-nums text-muted-foreground">{item.code}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="min-w-0 flex-1">
                  <FieldInput label="Mobile number (optional)" type="tel" inputMode="tel" autoComplete="tel-national" name="mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} />
                </div>
              </div>
              <input type="hidden" name="country" value={country.id} />
              <input type="hidden" name="callingCode" value={country.code} />
            </Field>
            <Field invalid={!!errors.postcode} valid={valid.postcode} {...enter(4)}>
              <FieldInput
                label={validate ? "Postcode *" : "Postcode"}
                required={validate}
                placeholder={labelStyle === "floating" ? " " : "BS1 4DJ"}
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                onBlur={() => touch("postcode")}
              />
              <FieldError>{errors.postcode}</FieldError>
            </Field>
            <Field {...enter(5)}>
              <FieldInput
                label="Note for the courier"
                placeholder={labelStyle === "floating" ? " " : "Leave it by the blue door"}
                value={note}
                maxLength={60}
                counter={counter}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <div style={enter(6).style} className={cn("flex items-center gap-4", enter(6).className)}>
          <FillButton type="submit" className="h-auto px-5 py-2.5 text-base">
            Save address
          </FillButton>
          <AnimatePresence mode="wait">
            {savedId !== null && (
              <motion.p
                key={savedId}
                role="status"
                className="flex items-center gap-2 text-base text-success"
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

      <ControlsPanel title="Form" {...panel} />
    </div>
  )
}
