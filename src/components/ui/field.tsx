"use client"

import * as React from "react"
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type FieldRounded = "none" | "sm" | "md" | "lg" | "xl" | "full"
type FieldErrorAnimation = "slide" | "fade" | "none"

/**
 * Where an input's label goes:
 * - `floating`: inside the input, rising onto its top border on focus or once filled.
 * - `inside`: inside the input like a placeholder, fading out as you start typing.
 * - `above`: a plain label above the input.
 */
type FieldLabelStyle = "floating" | "inside" | "above"

type FieldMotion = {
  labelStyle: FieldLabelStyle
  errorAnimation: FieldErrorAnimation
  /** The input shakes once when its field turns invalid. */
  shakeOnError: boolean
  /** A tick draws itself in when the field is valid. */
  successTick: boolean
  rounded: FieldRounded
}

const FIELD_ROUNDED: Record<FieldRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const FieldMotionContext = React.createContext<FieldMotion>({
  labelStyle: "floating",
  errorAnimation: "slide",
  shakeOnError: true,
  successTick: true,
  rounded: "lg",
})

const FieldStateContext = React.createContext<{ invalid: boolean; valid: boolean }>({
  invalid: false,
  valid: false,
})

const easeOut = [0.22, 1, 0.36, 1] as const

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-base data-[variant=legend]:text-lg",
        className
      )}
      {...props}
    />
  )
}

/** Sets the animation options for every field inside it. */
function FieldGroup({
  className,
  labelStyle = "floating",
  errorAnimation = "slide",
  shakeOnError = true,
  successTick = true,
  rounded = "lg",
  ...props
}: React.ComponentProps<"div"> & Partial<FieldMotion>) {
  const options = React.useMemo(
    () => ({ labelStyle, errorAnimation, shakeOnError, successTick, rounded }),
    [labelStyle, errorAnimation, shakeOnError, successTick, rounded]
  )
  return (
    <FieldMotionContext.Provider value={options}>
      <div
        data-slot="field-group"
        className={cn(
          "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
          className
        )}
        {...props}
      />
    </FieldMotionContext.Provider>
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  invalid = false,
  valid = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof fieldVariants> & {
    /** Marks the field invalid: red label and input, and a shake if `shakeOnError` is on. */
    invalid?: boolean
    /** Marks the field valid: shows the tick if `successTick` is on. */
    valid?: boolean
  }) {
  const state = React.useMemo(() => ({ invalid, valid }), [invalid, valid])
  return (
    <FieldStateContext.Provider value={state}>
      <div
        role="group"
        data-slot="field"
        data-orientation={orientation}
        data-invalid={invalid || undefined}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    </FieldStateContext.Provider>
  )
}

/** Characters that roll to their new value, like a mechanical counter. */
function RollingText({ text }: { text: string }) {
  // Rolls up as the count grows and down as it shrinks.
  const [previous, setPrevious] = React.useState(text)
  const [direction, setDirection] = React.useState(1)
  if (previous !== text) {
    setDirection(parseInt(text, 10) >= parseInt(previous, 10) ? 1 : -1)
    setPrevious(text)
  }
  return (
    <span className="inline-flex tabular-nums">
      {text.split("").map((char, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.span
              key={char}
              className="inline-block"
              custom={direction}
              variants={{
                enter: (d: number) => ({ y: `${d * 100}%`, opacity: 0 }),
                center: { y: "0%", opacity: 1 },
                exit: (d: number) => ({ y: `${d * -100}%`, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: easeOut }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

/**
 * An input with its label, ready for the group's animations: a floating label, a success
 * tick, a rolling character count and a shake on error.
 */
function FieldInput({
  label,
  counter = false,
  className,
  id: idProp,
  value,
  defaultValue,
  onChange,
  maxLength,
  placeholder,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue"> & {
  label: React.ReactNode
  /** Shows how many characters are used, out of `maxLength` when set. */
  counter?: boolean
  value?: string
  defaultValue?: string
}) {
  const options = React.useContext(FieldMotionContext)
  const { invalid, valid } = React.useContext(FieldStateContext)
  const reduceMotion = useReducedMotion()
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const box = React.useRef<HTMLDivElement>(null)
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "")
  const text = value ?? uncontrolled

  // Shake once each time the field turns invalid.
  const wasInvalid = React.useRef(invalid)
  React.useEffect(() => {
    const was = wasInvalid.current
    wasInvalid.current = invalid
    if (!invalid || was || !options.shakeOnError || reduceMotion || !box.current) return
    animate(box.current, { x: [0, -6, 6, -4, 4, -2, 0] }, { duration: 0.4, ease: "easeOut" })
  }, [invalid, options.shakeOnError, reduceMotion])

  const floating = options.labelStyle === "floating"
  const inside = options.labelStyle === "inside"
  const count = maxLength ? `${text.length}/${maxLength}` : String(text.length)

  return (
    <div className="flex flex-col gap-2">
      {options.labelStyle === "above" && (
        <FieldLabel
          htmlFor={id}
          className="text-base group-data-[invalid=true]/field:text-destructive"
        >
          {label}
        </FieldLabel>
      )}
      <div
        ref={box}
        data-slot="field-input"
        className={cn(
          "relative flex items-center gap-2 border border-input bg-transparent px-2.5 transition-colors has-aria-invalid:border-destructive dark:bg-input/30",
          // A plain border on focus and on error, with no glow round it.
          "has-focus-visible:border-foreground has-aria-invalid:has-focus-visible:border-destructive",
          options.labelStyle === "above" ? "h-9" : "h-11",
          FIELD_ROUNDED[options.rounded],
          className
        )}
      >
        <input
          id={id}
          data-slot="input"
          aria-invalid={invalid || undefined}
          value={text}
          maxLength={maxLength}
          // A label in the input needs a placeholder to tell "empty" apart. A floating label
          // shows the real one once focused; a label that stays inside stands in for it.
          placeholder={floating ? (placeholder ?? " ") : inside ? " " : placeholder}
          onChange={(event) => {
            setUncontrolled(event.target.value)
            onChange?.(event)
          }}
          className={cn(
            "peer h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground",
            // Browser autofill paints its own tint behind the text, stopping short of the
            // box's padding. Holding the background change off indefinitely keeps the input
            // clear, and the text keeps its usual colour.
            "[transition:background-color_600000s_0s] autofill:[-webkit-text-fill-color:var(--color-foreground)]",
            floating &&
              "py-1 placeholder:text-transparent focus:placeholder:text-muted-foreground focus:placeholder:transition-colors focus:placeholder:delay-100",
            inside && "py-1"
          )}
          {...props}
        />
        {floating && (
          <label
            htmlFor={id}
            data-slot="field-label"
            className={cn(
              // Rests inside the input; once focused or filled it rises onto the top border,
              // with a patch of the page's background behind it that cuts the border line.
              "pointer-events-none absolute top-1/2 left-1.5 origin-left -translate-y-1/2 rounded-sm px-1 text-base leading-none text-muted-foreground transition-[top,scale,color,background-color] duration-200 ease-out motion-reduce:transition-none",
              "peer-focus:top-0 peer-focus:scale-[0.85] peer-focus:bg-background peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:scale-[0.85] peer-not-placeholder-shown:bg-background",
              invalid ? "text-destructive" : "peer-focus:text-foreground"
            )}
          >
            {label}
          </label>
        )}
        {inside && (
          <label
            htmlFor={id}
            data-slot="field-label"
            className={cn(
              // Sits where the text will go and fades out once there's any text.
              "pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-base text-muted-foreground transition-opacity duration-200 ease-out peer-not-placeholder-shown:opacity-0 motion-reduce:transition-none",
              invalid && "text-destructive"
            )}
          >
            {label}
          </label>
        )}
        {counter && (
          <span
            aria-live="polite"
            className={cn(
              "shrink-0 text-sm text-muted-foreground",
              maxLength && text.length >= maxLength && "text-destructive"
            )}
          >
            <RollingText text={count} />
          </span>
        )}
        <AnimatePresence initial={false}>
          {options.successTick && valid && !invalid && (
            <motion.svg
              key="tick"
              aria-label="Valid"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
              transition={{ type: "spring", visualDuration: 0.3, bounce: 0.4 }}
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: easeOut, delay: 0.05 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left text-base leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  const { errorAnimation } = React.useContext(FieldMotionContext)
  const reduceMotion = useReducedMotion()

  const error = (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-xs font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )

  if (errorAnimation === "none" || reduceMotion) return content ? error : null

  // The field's gap is pulled in while the error is closed, so opening it doesn't jump.
  const slide = errorAnimation === "slide"
  return (
    <AnimatePresence initial={false}>
      {content && (
        <motion.div
          key="error"
          className={slide ? "overflow-hidden" : undefined}
          initial={slide ? { height: 0, opacity: 0, marginTop: "-0.5rem", y: -4 } : { opacity: 0 }}
          animate={slide ? { height: "auto", opacity: 1, marginTop: "0rem", y: 0 } : { opacity: 1 }}
          exit={slide ? { height: 0, opacity: 0, marginTop: "-0.5rem", y: -4 } : { opacity: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  FieldInput,
}
export type { FieldErrorAnimation, FieldLabelStyle, FieldRounded }
