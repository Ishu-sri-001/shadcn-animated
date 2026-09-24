"use client"

import * as React from "react"
import { cn } from "cn"
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  Reorder,
  useMotionValue,
  useReducedMotion,
} from "motion/react"

type ChoiceType = "checkbox" | "radio"
/** "default": a control beside its label. "card": each choice is a small card that fills with colour when picked. */
type ChoiceVariant = "default" | "card"
/** Mark inside a picked icon. */
type ChoiceIndicator = "check" | "dot" | "none"
/** "filled": the icon fills with colour and the mark sits on it. "outline": the icon stays empty and the mark is coloured. */
type ChoiceAppearance = "filled" | "outline"
/** Card fill: "muted" is a soft grey (as in the accordion); "primary" is solid, with the text switching to sit on it. */
type ChoiceCardFill = "muted" | "primary"

const spring = { type: "spring", visualDuration: 0.35, bounce: 0.3 } as const
const snappy = { type: "spring", visualDuration: 0.25, bounce: 0 } as const
// Overshooting ease for CSS transitions (focus ring).
const springyEase = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"

/** Animation options set on ChoiceGroup and shared by its choices. */
type ChoiceOptions = {
  /** Checkbox background grows out from the centre instead of switching instantly. */
  fill: boolean
  /** The control squashes and springs back with an overshoot when ticked. */
  bounce: boolean
  /** A ring spreads out from the control and fades when ticked. */
  ripple: boolean
  /** Tiny lines burst out from the control when ticked. */
  burst: boolean
  /** Radio: the old dot shrinks away as the new one grows. */
  crossfade: boolean
  /** The keyboard focus ring springs out instead of appearing instantly. */
  springFocus: boolean
  /** Checkbox: a line draws through the label when ticked. */
  strike: boolean
  /** A choice's description slides open only while it's picked. */
  revealDescription: boolean
  /** Show the checkbox or radio icon. Off, the label (or card) alone shows what's picked. */
  showIcon: boolean
  /** Mark inside a picked icon. Defaults by type: check for checkbox, dot for radio. */
  indicator?: ChoiceIndicator
  /** Filled or outline icon. Defaults by type: filled for checkbox, outline for radio. */
  appearance?: ChoiceAppearance
  /** Icon corner rounding, 0 (square) to 1 (circle). Defaults by type: 0.25 for checkbox, 1 for radio. */
  radius?: number
}

const defaultOptions: ChoiceOptions = {
  fill: true,
  bounce: true,
  ripple: false,
  burst: false,
  crossfade: true,
  springFocus: true,
  strike: false,
  revealDescription: false,
  showIcon: true,
}

type ChoiceGroupContextValue = ChoiceOptions & {
  type: ChoiceType
  variant: ChoiceVariant
  cardFill: ChoiceCardFill
  selected: string[]
  toggle: (value: string) => void
  invalid: boolean
  reorder: boolean
}

const ChoiceGroupContext = React.createContext<ChoiceGroupContextValue | null>(null)
// Position within the group, for the staggered entrance.
const ChoiceIndexContext = React.createContext(0)

// Delay between choices ticking in turn (Select all / Clear all), in ms.
const CASCADE_MS = 60

type ChoiceGroupProps = Partial<ChoiceOptions> & {
  className?: string
  children?: React.ReactNode
  "aria-label"?: string
  /** "card" turns each choice into a small card whose background fills when picked. */
  variant?: ChoiceVariant
  /** Cards only: colour a picked card fills with. */
  cardFill?: ChoiceCardFill
  /** Allow picking nothing only after a warning: shakes and shows an error when emptied. Checkbox only. */
  required?: boolean
  /** Drag options to change their order, e.g. to rank them. */
  reorder?: boolean
  /** Called with the options' values in their new order after a drag. */
  onReorder?: (order: string[]) => void
  /** Shows "n selected" with a rolling number. Checkbox only. */
  counter?: boolean
} & (
    | {
        /** Any number can be picked. */
        type: "checkbox"
        value?: string[]
        defaultValue?: string[]
        onValueChange?: (value: string[]) => void
      }
    | {
        /** Exactly one can be picked. */
        type: "radio"
        value?: string
        defaultValue?: string
        onValueChange?: (value: string) => void
      }
  )

const toList = (value: string | string[] | undefined) =>
  value === undefined || value === "" ? [] : Array.isArray(value) ? value : [value]

/**
 * A list of choices. `type="checkbox"` lets people pick any number;
 * `type="radio"` exactly one. Changing `type` morphs the controls in place.
 */
function ChoiceGroup({
  type,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  required = false,
  reorder = false,
  onReorder,
  counter = true,
  variant = "default",
  cardFill = "muted",
  "aria-label": ariaLabel,
  ...optionProps
}: ChoiceGroupProps) {
  const reduceMotion = useReducedMotion()
  const groupRef = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [internal, setInternal] = React.useState(() => toList(defaultValue))
  const [invalid, setInvalid] = React.useState(false)
  const controlled = value !== undefined
  const selected = controlled ? toList(value) : internal

  const valueOf = (child: React.ReactElement) => (child.props as { value?: string }).value
  // Order after dragging; options added later go at the end.
  const [order, setOrder] = React.useState<string[]>([])
  const childElements = React.Children.toArray(children).filter(React.isValidElement)
  const childValues = childElements.flatMap((child) => valueOf(child) ?? [])
  const known = order.filter((v) => childValues.includes(v))
  const currentOrder = [...known, ...childValues.filter((v) => !known.includes(v))]
  const rank = (child: React.ReactElement) => {
    const v = valueOf(child)
    return v === undefined ? Infinity : currentOrder.indexOf(v)
  }
  const items = [...childElements].sort((a, b) => rank(a) - rank(b))
  const allValues = items.flatMap((child) => {
    const props = child.props as { value?: string; disabled?: boolean }
    return props.value !== undefined && !props.disabled ? [props.value] : []
  })

  // Latest selection for timers and pointer handlers.
  const latest = React.useRef(selected)
  React.useEffect(() => {
    latest.current = selected
  })
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const onChange = React.useEffectEvent((next: string[]) => {
    if (type === "radio") (onValueChange as ((v: string) => void) | undefined)?.(next[0] ?? "")
    else (onValueChange as ((v: string[]) => void) | undefined)?.(next)
  })

  const commit = (next: string[]) => {
    // Keep the options' order, whatever order they were picked in.
    const ordered = allValues.filter((v) => next.includes(v))
    latest.current = ordered
    if (!controlled) setInternal(ordered)
    onChange(ordered)
    if (type === "checkbox" && required) {
      if (ordered.length === 0) {
        setInvalid(true)
        if (!reduceMotion) animate(x, [0, -6, 6, -4, 4, -2, 0], { duration: 0.45, ease: "easeOut" })
      } else {
        setInvalid(false)
      }
    }
  }

  const setOne = (v: string, on: boolean) => {
    const current = latest.current
    if (type === "radio") {
      if (on) commit([v])
      return
    }
    if (current.includes(v) === on) return
    commit(on ? [...current, v] : current.filter((c) => c !== v))
  }

  const toggle = (v: string) => setOne(v, type === "radio" ? true : !latest.current.includes(v))

  const cascade = (values: string[], on: boolean) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = values.map((v, i) =>
      window.setTimeout(() => setOne(v, on), reduceMotion ? 0 : i * CASCADE_MS)
    )
  }

  // Arrow keys move between radios and pick them, as in a native radio group.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (type !== "radio" || !groupRef.current) return
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    if (!step) return
    const radios = Array.from(
      groupRef.current.querySelectorAll<HTMLButtonElement>("[data-slot=choice-control]:not(:disabled)")
    )
    const index = radios.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    event.preventDefault()
    const next = radios[(index + step + radios.length) % radios.length]
    next.focus()
    next.click()
  }

  const options: ChoiceOptions = { ...defaultOptions, ...optionProps }
  const context: ChoiceGroupContextValue = {
    ...options,
    type,
    variant,
    cardFill,
    selected,
    toggle,
    invalid,
    reorder,
  }

  return (
    <MotionConfig reducedMotion="user">
      <ChoiceGroupContext.Provider value={context}>
        <div data-slot="choice-group" data-type={type} className="flex flex-col gap-3">
          {type === "checkbox" && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => cascade(allValues.filter((v) => !latest.current.includes(v)), true)}
                  className="font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => cascade([...latest.current].reverse(), false)}
                  className="font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:underline"
                >
                  Clear all
                </button>
              </div>
              {counter && (
                <span className="text-muted-foreground tabular-nums" aria-live="polite">
                  <RollingNumber value={selected.length} /> selected
                </span>
              )}
            </div>
          )}
          {/* Always a Reorder.Group, so turning `reorder` on or off doesn't remount the choices. */}
          <Reorder.Group
            as="div"
            // "xy" reorders across wrapped rows and grid cells too.
            axis="xy"
            values={currentOrder}
            onReorder={(next: string[]) => {
              setOrder(next)
              onReorder?.(next)
            }}
            ref={groupRef}
            role={type === "radio" ? "radiogroup" : "group"}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            style={{ x }}
            onKeyDown={onKeyDown}
            className={cn("grid w-full gap-3", className)}
          >
            {items.map((child, index) => (
              <ChoiceIndexContext.Provider key={child.key ?? index} value={index}>
                {child}
              </ChoiceIndexContext.Provider>
            ))}
          </Reorder.Group>
          <AnimatePresence>
            {invalid && (
              <motion.p
                role="alert"
                className="text-sm text-destructive"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                Choose at least one.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </ChoiceGroupContext.Provider>
    </MotionConfig>
  )
}

function Choice({
  className,
  type: typeProp,
  value,
  label,
  description,
  disabled = false,
  accent,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
}: {
  className?: string
  /** "checkbox" or "radio". Defaults to the surrounding ChoiceGroup's type. */
  type?: ChoiceType
  /** Identifies this choice within its group. */
  value?: string
  label?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  /** Colour this choice fills with when picked (any CSS colour). Defaults to the primary colour. */
  accent?: string
  /** Standalone checkbox only (outside a ChoiceGroup). */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const group = React.useContext(ChoiceGroupContext)
  const index = React.useContext(ChoiceIndexContext)
  const reduceMotion = useReducedMotion()
  const visual = React.useRef<HTMLSpanElement>(null)
  // Set when a drag starts, so the click that ends it is ignored.
  const dragged = React.useRef(false)
  const [standalone, setStandalone] = React.useState(defaultChecked)

  const type = typeProp ?? group?.type ?? "checkbox"
  const options = group ?? defaultOptions
  const radio = type === "radio"
  const card = group?.variant === "card"
  const draggable = Boolean(group?.reorder) && !disabled
  const checked = group ? value !== undefined && group.selected.includes(value) : (checkedProp ?? standalone)

  // Counts each time this choice becomes picked, to replay ripple, burst and bounce.
  const [wasChecked, setWasChecked] = React.useState(checked)
  const [pulse, setPulse] = React.useState(0)
  if (checked !== wasChecked) {
    setWasChecked(checked)
    if (checked) setPulse((p) => p + 1)
  }

  React.useEffect(() => {
    if (pulse === 0 || !options.bounce || reduceMotion || !visual.current) return
    animate(visual.current, { scale: [1, 0.8, 1.15, 1] }, { duration: 0.45, ease: "easeOut" })
  }, [pulse, options.bounce, reduceMotion])

  const toggle = () => {
    if (disabled) return
    if (group && value !== undefined) {
      group.toggle(value)
      return
    }
    const next = !checked
    setStandalone(next)
    onCheckedChange?.(next)
  }

  const invalid = group?.invalid && !checked
  const effects = pulse > 0 && !reduceMotion
  const hasText = label !== undefined || description !== undefined
  // Solid (primary) cards: the fill carries its own copy of the text, and the
  // control switches to the colour that sits on the fill.
  const solid = card && group?.cardFill === "primary"
  const onFill = solid && checked
  // The icon can be hidden; the (visually hidden) button still carries focus and state.
  const showControl = options.showIcon
  // The icon's look is independent of the type; unset, each type keeps its familiar look.
  const indicator = options.indicator ?? (radio ? "dot" : "check")
  const filled = (options.appearance ?? (radio ? "outline" : "filled")) === "filled"
  const cornerRadius = Math.min(Math.max(options.radius ?? (radio ? 1 : 0.25), 0), 1) * 12
  const showsFill = checked && filled
  const showsCheck = checked && indicator === "check"
  const showsDot = checked && indicator === "dot"
  // The mark contrasts with whatever it sits on: the icon's fill, or the card's.
  // (Full class names, so Tailwind can find them.)
  const markOnAccent = filled !== onFill

  // Label and description. On a solid card they render twice: on the page, and
  // in the on-fill colour inside the fill, so the colour change sweeps across
  // the text with the fill instead of switching all at once.
  const renderText = (onAccent: boolean) => (
    <span className="flex flex-col gap-1">
      {label !== undefined && (
        <span className="relative inline-grid w-fit leading-none">
          {/* Reserves the bold width, so picking doesn't nudge the next option. */}
          <span aria-hidden className="invisible col-start-1 row-start-1 font-medium">
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-weight] duration-200",
              onAccent
                ? "font-medium text-(--choice-on-accent)"
                : checked
                  ? "font-medium text-foreground"
                  : "font-normal text-muted-foreground group-hover/choice:text-foreground"
            )}
          >
            {label}
          </span>
          {options.strike && (
            <motion.span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-1/2 h-px origin-left opacity-70",
                onAccent ? "bg-(--choice-on-accent)" : "bg-foreground"
              )}
              initial={false}
              animate={{ scaleX: checked ? 1 : 0 }}
              transition={snappy}
            />
          )}
        </span>
      )}
      {description !== undefined &&
        (options.revealDescription ? (
          <motion.span
            className={cn(
              "overflow-hidden text-sm",
              onAccent ? "text-(--choice-on-accent)/80" : "text-muted-foreground",
              // Collapsed, it takes the label's width, so hidden text doesn't space options apart.
              !checked && "w-0 min-w-full"
            )}
            initial={false}
            animate={{ height: checked ? "auto" : 0, opacity: checked ? 1 : 0 }}
            transition={spring}
          >
            {description}
          </motion.span>
        ) : (
          <span
            className={cn("text-sm", onAccent ? "text-(--choice-on-accent)/80" : "text-muted-foreground")}
          >
            {description}
          </span>
        ))}
    </span>
  )

  const rootProps = {
    "data-slot": "choice",
    "data-type": type,
    "data-value": value,
    "data-checked": checked || undefined,
    "data-disabled": disabled || undefined,
    className: cn(
      "group/choice relative flex cursor-pointer gap-3 text-lg select-none [--choice-accent:var(--primary)] [--choice-on-accent:var(--primary-foreground)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
      description !== undefined ? "items-start" : "items-center",
      // No icon: the focus ring goes around the whole option instead.
      !showControl &&
        "rounded-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background",
      card &&
        cn(
          "isolate overflow-hidden rounded-xl border px-4 py-3 transition-colors duration-300",
          checked
            ? solid
              ? "border-(--choice-accent)"
              : accent
                ? "border-(--choice-accent)/40"
                : "border-foreground/15"
            : "hover:border-foreground/30"
        ),
      draggable && "cursor-grab active:cursor-grabbing",
      className
    ),
    style: accent
      ? ({ "--choice-accent": accent, "--choice-on-accent": "white" } as React.CSSProperties)
      : undefined,
    // Choices appear one after another when the list first shows.
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring, delay: index * 0.05, layout: spring },
  }

  const content = (
    <>
        {card && (
          // Fills the card from the control outward; drains back when unpicked.
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0",
              solid
                ? // Above the page-coloured text (it has its own copy), below the control.
                  cn(
                    "z-10 flex gap-3 bg-(--choice-accent) px-4 py-3",
                    description !== undefined ? "items-start" : "items-center"
                  )
                : cn("-z-10", accent ? "bg-(--choice-accent)/15" : "bg-muted")
            )}
            initial={false}
            animate={{
              // 135% just covers the far corner, so the spread stays visible.
              clipPath: showControl
                ? `circle(${checked ? "135%" : "0%"} at 1.75rem ${description !== undefined ? "1.5rem" : "50%"})`
                : `circle(${checked ? "150%" : "0%"} at 0% 50%)`,
            }}
            transition={options.fill ? { duration: 0.6, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
          >
            {solid && (
              <>
                {/* Same spacing as the real control, so the text lines up exactly. */}
                {showControl && <span className="size-6 shrink-0" />}
                {hasText && renderText(true)}
              </>
            )}
          </motion.span>
        )}
        <motion.span
          // Hidden icon: only the button remains, visually hidden but focusable.
          className={
            showControl
              ? cn("relative grid size-6 shrink-0 place-items-center", solid && "z-20")
              : "sr-only"
          }
          // Press squish.
          whileTap={disabled ? undefined : { scale: 0.85 }}
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -inset-1 scale-75 border-2 border-ring/50 opacity-0 group-has-[:focus-visible]/choice:scale-100 group-has-[:focus-visible]/choice:opacity-100",
              options.springFocus ? cn("transition-[opacity,scale] duration-300", springyEase) : "transition-none"
            )}
            // Follows the icon's corners, 4px further out.
            style={{ borderRadius: cornerRadius + 4 }}
          />

          {/* The box: its corners ease to `radius`, from square to circle. */}
          <motion.span
            ref={visual}
            aria-hidden
            className={cn(
              "absolute inset-0 overflow-hidden border transition-colors duration-200 dark:bg-input/30",
              onFill
                ? "border-(--choice-on-accent)"
                : checked
                  ? "border-(--choice-accent)"
                  : "border-input group-hover/choice:border-foreground/40",
              invalid && "border-destructive"
            )}
            initial={false}
            animate={{ borderRadius: cornerRadius }}
            transition={spring}
          >
            <motion.span
              className={cn("absolute inset-0", onFill ? "bg-(--choice-on-accent)" : "bg-(--choice-accent)")}
              initial={false}
              animate={{ scale: showsFill ? 1 : 0 }}
              transition={options.fill ? snappy : { duration: 0 }}
            />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "absolute inset-0 size-full transition-colors duration-200",
                markOnAccent ? "text-(--choice-on-accent)" : "text-(--choice-accent)"
              )}
            >
              {/* The tick draws itself in, and erases in reverse. */}
              <motion.path
                d="M5 12.5 10 17.5 19 7"
                initial={false}
                animate={{ pathLength: showsCheck ? 1 : 0, opacity: showsCheck ? 1 : 0 }}
                transition={{
                  pathLength: { duration: 0.25, ease: "easeOut", delay: checked ? 0.08 : 0 },
                  opacity: { duration: 0.1 },
                }}
              />
            </svg>
          </motion.span>

          <AnimatePresence initial={false}>
            {showsDot && (
              <motion.span
                key="dot"
                aria-hidden
                className={cn(
                  "pointer-events-none absolute size-3 rounded-full",
                  markOnAccent ? "bg-(--choice-on-accent)" : "bg-(--choice-accent)"
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={
                  options.crossfade
                    ? { scale: 0, opacity: 0, transition: snappy }
                    : { opacity: 0, transition: { duration: 0 } }
                }
                transition={spring}
              />
            )}
          </AnimatePresence>

          {effects && options.ripple && (
            <motion.span
              key={`ripple-${pulse}`}
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 border-2",
                onFill ? "border-(--choice-on-accent)" : "border-(--choice-accent)"
              )}
              style={{ borderRadius: cornerRadius }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
          {effects && options.burst && <Burst key={`burst-${pulse}`} />}

          {/* The real control, transparent over the visuals. */}
          <button
            type="button"
            data-slot="choice-control"
            role={type}
            aria-checked={checked}
            disabled={disabled}
            tabIndex={radio && group ? (checked || group.selected.length === 0 ? 0 : -1) : 0}
            onClick={toggle}
            className="absolute -inset-1 z-10 cursor-[inherit] rounded-sm outline-none"
          />
        </motion.span>

        {hasText && renderText(false)}
    </>
  )

  if (group && value !== undefined) {
    return (
      <Reorder.Item
        as="label"
        value={value}
        // Only draggable with `reorder`; otherwise a plain (layout-animated) item.
        drag={draggable ? true : false}
        whileDrag={{ scale: 1.03, zIndex: 10 }}
        onDragStart={() => (dragged.current = true)}
        onPointerDown={() => (dragged.current = false)}
        onClickCapture={(event) => {
          // The click that ends a drag shouldn't also pick the option.
          if (!dragged.current) return
          event.preventDefault()
          event.stopPropagation()
        }}
        {...rootProps}
      >
        {content}
      </Reorder.Item>
    )
  }

  return <motion.label {...rootProps}>{content}</motion.label>
}

/** Eight short lines shooting out from the control. */
function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 8 }, (_, i) => (
        // Rotated wrapper, so each line travels outward along its own angle.
        <span key={i} className="absolute top-1/2 left-1/2" style={{ rotate: `${i * 45}deg` }}>
          <motion.span
            className="absolute -left-px h-2 w-0.5 rounded-full bg-(--choice-accent)"
            initial={{ y: -12, opacity: 1, scaleY: 1 }}
            animate={{ y: -22, opacity: 0, scaleY: 0.4 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </span>
      ))}
    </span>
  )
}

function RollingNumber({ value }: { value: number }) {
  const digits = String(value).split("")
  return (
    <span>
      <span className="sr-only">{value}</span>
      {digits.map((digit, i) => (
        // Keyed from the right, so the ones digit keeps rolling when a tens digit appears.
        <RollingDigit key={digits.length - i} digit={Number(digit)} />
      ))}
    </span>
  )
}

function RollingDigit({ digit }: { digit: number }) {
  return (
    // The hidden digit keeps the baseline and width; clip-path (unlike
    // overflow) clips the rolling column without moving the baseline.
    <span aria-hidden className="relative inline-block [clip-path:inset(0)]">
      <span className="invisible">{digit}</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={spring}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  )
}

export {
  ChoiceGroup,
  Choice,
  type ChoiceType,
  type ChoiceVariant,
  type ChoiceCardFill,
  type ChoiceIndicator,
  type ChoiceAppearance,
}
