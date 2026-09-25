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

type CheckboxVariant = "default" | "card"
type CheckboxAppearance = "filled" | "outline"
type CheckboxCardFill = "muted" | "primary"

const spring = { type: "spring", visualDuration: 0.35, bounce: 0.3 } as const
const snappy = { type: "spring", visualDuration: 0.25, bounce: 0 } as const
const springyEase = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"
const shake = [0, -6, 6, -4, 4, -2, 0]

type CheckboxOptions = {
  fill: boolean
  bounce: boolean
  strike: boolean
  showIcon: boolean
  /** Filled or outline box. */
  appearance: CheckboxAppearance
  radius: number
}

const defaultOptions: CheckboxOptions = {
  fill: true,
  bounce: true,
  strike: false,
  showIcon: true,
  appearance: "filled",
  radius: 0.25,
}

type CheckboxGroupContextValue = {
  variant: CheckboxVariant
  cardFill: CheckboxCardFill
  selected: string[]
  toggle: (value: string, range: boolean) => boolean
  invalid: boolean
  full: boolean
  reorder: boolean
}

const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null)
const CheckboxOptionsContext = React.createContext<CheckboxOptions>(defaultOptions)
const CheckboxIndexContext = React.createContext(0)

const toolbarButton = cn(
  "relative font-medium text-muted-foreground transition-[color,opacity] outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40",
  "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
  "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
)

const CASCADE_MS = 60

type CheckboxGroupProps = Partial<CheckboxOptions> & {
  className?: string
  children?: React.ReactNode
  "aria-label"?: string
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  variant?: CheckboxVariant
  cardFill?: CheckboxCardFill
  min?: number
  max?: number
  selectAll?: boolean
  deselectAll?: boolean
  counter?: boolean
  rangeSelect?: boolean
  reorder?: boolean
  onReorder?: (order: string[]) => void
}

function CheckboxGroup({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  min = 0,
  max,
  selectAll = true,
  deselectAll = true,
  counter = true,
  rangeSelect = true,
  reorder = false,
  onReorder,
  variant = "default",
  cardFill = "muted",
  "aria-label": ariaLabel,
  ...optionProps
}: CheckboxGroupProps) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const [internal, setInternal] = React.useState(defaultValue ?? [])
  const [invalid, setInvalid] = React.useState(false)
  const [limitHit, setLimitHit] = React.useState(false)
  const controlled = value !== undefined
  const selected = controlled ? value : internal

  const valueOf = (child: React.ReactElement) => (child.props as { value?: string }).value
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
  const capacity = Math.min(max ?? Infinity, allValues.length)

  const latest = React.useRef(selected)
  React.useEffect(() => {
    latest.current = selected
  })
  const anchor = React.useRef<string | null>(null)
  const timers = React.useRef<number[]>([])
  const limitTimer = React.useRef<number>(undefined)
  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      window.clearTimeout(limitTimer.current)
    },
    []
  )

  const onChange = React.useEffectEvent((next: string[]) => onValueChange?.(next))

  const flashLimit = () => {
    setLimitHit(true)
    window.clearTimeout(limitTimer.current)
    limitTimer.current = window.setTimeout(() => setLimitHit(false), 2000)
  }

  const commit = (next: string[]) => {
    const previous = latest.current
    const ordered = allValues.filter((v) => next.includes(v))
    latest.current = ordered
    if (!controlled) setInternal(ordered)
    onChange(ordered)
    if (max === undefined || ordered.length < max) setLimitHit(false)
    if (min > 0) {
      if (ordered.length < min) {
        setInvalid(true)
        if (ordered.length < previous.length && !reduceMotion) {
          animate(x, shake, { duration: 0.45, ease: "easeOut" })
        }
      } else {
        setInvalid(false)
      }
    }
  }

  const setOne = (v: string, on: boolean) => {
    const current = latest.current
    if (current.includes(v) === on) return true
    if (on && max !== undefined && current.length >= max) {
      flashLimit()
      return false
    }
    commit(on ? [...current, v] : current.filter((c) => c !== v))
    return true
  }

  const cascade = (values: string[], on: boolean) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = values.map((v, i) =>
      window.setTimeout(() => setOne(v, on), reduceMotion ? 0 : i * CASCADE_MS)
    )
  }

  const toggle = (v: string, range: boolean) => {
    const on = !latest.current.includes(v)
    const from = anchor.current === null ? -1 : allValues.indexOf(anchor.current)
    const to = allValues.indexOf(v)
    anchor.current = v
    if (range && rangeSelect && from !== -1 && to !== -1 && from !== to) {
      const span = allValues.slice(Math.min(from, to), Math.max(from, to) + 1)
      const outward = from < to ? span : span.reverse()
      cascade(outward.filter((c) => latest.current.includes(c) !== on), on)
      return true
    }
    return setOne(v, on)
  }

  const allTicked = capacity > 0 && selected.length >= capacity
  const clearAll = () => cascade([...latest.current].reverse(), false)
  const tickAll = () => {
    const room = (max ?? Infinity) - latest.current.length
    cascade(allValues.filter((v) => !latest.current.includes(v)).slice(0, room), true)
  }

  const options: CheckboxOptions = { ...defaultOptions, ...optionProps }
  const context: CheckboxGroupContextValue = {
    variant,
    cardFill,
    selected,
    toggle,
    invalid,
    full: max !== undefined && selected.length >= max,
    reorder,
  }

  return (
    <MotionConfig reducedMotion="user">
      <CheckboxOptionsContext.Provider value={options}>
        <CheckboxGroupContext.Provider value={context}>
          <div data-slot="checkbox-group" className="flex flex-col gap-8">
            {(selectAll || deselectAll || counter) && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-8 max-md:gap-6">
                  {selectAll && (
                    <button type="button" onClick={tickAll} disabled={allTicked} className={toolbarButton}>
                      Select all
                    </button>
                  )}
                  {deselectAll && (
                    <button
                      type="button"
                      onClick={clearAll}
                      disabled={selected.length === 0}
                      className={toolbarButton}
                    >
                      Deselect all
                    </button>
                  )}
                </div>
                {counter && (
                  <span className="text-muted-foreground tabular-nums" aria-live="polite">
                    <RollingNumber value={selected.length} />
                    {max !== undefined && ` of ${max}`} selected
                  </span>
                )}
              </div>
            )}
            <Reorder.Group
              as="div"
              axis="xy"
              values={currentOrder}
              onReorder={(next: string[]) => {
                setOrder(next)
                onReorder?.(next)
              }}
              role="group"
              aria-label={ariaLabel}
              aria-invalid={invalid || undefined}
              aria-required={min > 0 || undefined}
              style={{ x }}
              className={cn("grid w-full gap-3", className)}
            >
              {items.map((child, index) => (
                <CheckboxIndexContext.Provider key={child.key ?? index} value={index}>
                  {child}
                </CheckboxIndexContext.Provider>
              ))}
            </Reorder.Group>
            <AnimatePresence mode="popLayout">
              {(invalid || limitHit) && (
                <motion.p
                  key={invalid ? "min" : "max"}
                  role="alert"
                  className={cn("text-sm", invalid ? "text-destructive" : "text-muted-foreground")}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {invalid
                    ? min === 1
                      ? "Choose at least one."
                      : `Choose at least ${min}.`
                    : `You can choose up to ${max}.`}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CheckboxGroupContext.Provider>
      </CheckboxOptionsContext.Provider>
    </MotionConfig>
  )
}

function CheckboxItem({
  className,
  value,
  label,
  description,
  disabled = false,
  accent,
  checked: checkedProp,
  defaultChecked = false,
  indeterminate = false,
  onCheckedChange,
}: {
  className?: string
  value?: string
  label?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  accent?: string
  /** Standalone only (outside a CheckboxGroup). */
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const group = React.useContext(CheckboxGroupContext)
  const options = React.useContext(CheckboxOptionsContext)
  const index = React.useContext(CheckboxIndexContext)
  const reduceMotion = useReducedMotion()
  const root = React.useRef<HTMLLabelElement>(null)
  const visual = React.useRef<HTMLSpanElement>(null)
  const dragged = React.useRef(false)
  const shift = React.useRef(false)
  const [standalone, setStandalone] = React.useState(defaultChecked)
  const [entered, setEntered] = React.useState(false)

  const inGroup = group !== null && value !== undefined
  const card = group?.variant === "card"
  const draggable = Boolean(group?.reorder) && !disabled
  const checked = inGroup ? group.selected.includes(value) : (checkedProp ?? standalone)
  const mixed = !inGroup && indeterminate && !checked

  const [wasChecked, setWasChecked] = React.useState(checked)
  const [pulse, setPulse] = React.useState(0)
  if (checked !== wasChecked) {
    setWasChecked(checked)
    if (checked) setPulse((p) => p + 1)
  }

  React.useEffect(() => {
    if (pulse === 0 || !options.bounce || reduceMotion || !visual.current) return
    animate(
      visual.current,
      { scale: [1, 0.7, 1.25, 0.94, 1] },
      { duration: 0.55, times: [0, 0.2, 0.5, 0.75, 1], ease: "easeOut" }
    )
  }, [pulse, options.bounce, reduceMotion])

  const toggle = (event: React.MouseEvent) => {
    if (disabled) return
    const range = event.shiftKey || shift.current
    shift.current = false
    if (inGroup) {
      const target = options.showIcon ? visual.current : root.current
      if (!group.toggle(value, range) && target && !reduceMotion) {
        animate(target, { x: [0, -3, 3, -2, 2, 0] }, { duration: 0.35, ease: "easeOut" })
      }
      return
    }
    const next = !checked
    setStandalone(next)
    onCheckedChange?.(next)
  }

  const invalid = group?.invalid && !checked
  const dimmed = disabled || (group?.full && !checked)
  const hasText = label !== undefined || description !== undefined
  const solid = card && group?.cardFill === "primary"
  const onFill = solid && checked
  const showControl = options.showIcon
  const filled = options.appearance === "filled"
  const roundness = Math.min(Math.max(options.radius, 0), 1)
  const cornerRadius = roundness * 12
  const marked = checked || mixed
  const markOnAccent = filled !== onFill

  const renderText = (onAccent: boolean) => (
    <span className="flex flex-col gap-1">
      {label !== undefined && (
        <span className="relative inline-grid w-fit leading-none">
          <span aria-hidden className="invisible col-start-1 row-start-1 font-medium">
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-weight] duration-200",
              onAccent
                ? "font-medium text-(--checkbox-on-accent)"
                : marked
                  ? "font-medium text-foreground"
                  : "font-normal text-muted-foreground group-hover/checkbox:text-foreground"
            )}
          >
            {label}
          </span>
          {options.strike && inGroup && (
            <motion.span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-1/2 h-px origin-left opacity-70",
                onAccent ? "bg-(--checkbox-on-accent)" : "bg-foreground"
              )}
              initial={false}
              animate={{ scaleX: checked ? 1 : 0 }}
              transition={snappy}
            />
          )}
        </span>
      )}
      {description !== undefined && (
        <span className={cn("text-sm", onAccent ? "text-(--checkbox-on-accent)/80" : "text-muted-foreground")}>
          {description}
        </span>
      )}
    </span>
  )

  const rootProps = {
    ref: root,
    "data-slot": "checkbox-item",
    "data-value": value,
    "data-checked": checked || undefined,
    "data-indeterminate": mixed || undefined,
    "data-disabled": disabled || undefined,
    className: cn(
      "group/checkbox relative flex cursor-pointer gap-3 text-lg select-none [--checkbox-accent:var(--primary)] [--checkbox-on-accent:var(--primary-foreground)] data-disabled:cursor-not-allowed",
      description !== undefined ? "items-start" : "items-center",
      !showControl &&
        "rounded-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background",
      card &&
        cn(
          "isolate overflow-hidden rounded-xl border px-4 py-3 transition-colors duration-300",
          checked
            ? solid
              ? "border-(--checkbox-accent)"
              : accent
                ? "border-(--checkbox-accent)/40"
                : "border-foreground/15"
            : "hover:border-foreground/30"
        ),
      draggable && "cursor-grab active:cursor-grabbing",
      className
    ),
    style: accent
      ? ({ "--checkbox-accent": accent, "--checkbox-on-accent": "white" } as React.CSSProperties)
      : undefined,
    onPointerDown: (event: React.PointerEvent) => {
      shift.current = event.shiftKey
      dragged.current = false
    },
    initial: { opacity: 0, y: 6 },
    animate: { opacity: dimmed ? 0.5 : 1, y: 0 },
    onAnimationComplete: () => setEntered(true),
    transition: { ...spring, delay: entered ? 0 : index * 0.05, layout: spring },
  }

  const content = (
    <>
      {card && (
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            solid
              ?
                cn(
                  "z-10 flex gap-3 bg-(--checkbox-accent) px-4 py-3",
                  description !== undefined ? "items-start" : "items-center"
                )
              : cn("-z-10", accent ? "bg-(--checkbox-accent)/15" : "bg-muted")
          )}
          initial={false}
          animate={{
            clipPath: showControl
              ? `circle(${checked ? "135%" : "0%"} at 1.75rem ${description !== undefined ? "1.5rem" : "50%"})`
              : `circle(${checked ? "150%" : "0%"} at 0% 50%)`,
          }}
          transition={options.fill ? { duration: 0.6, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
        >
          {solid && (
            <>
              {showControl && <span className="size-6 shrink-0" />}
              {hasText && renderText(true)}
            </>
          )}
        </motion.span>
      )}
      <motion.span
        className={
          showControl ? cn("relative grid size-6 shrink-0 place-items-center", solid && "z-20") : "sr-only"
        }
        whileTap={disabled || !options.bounce ? undefined : { scale: 0.85 }}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-1 scale-75 border-2 border-ring/50 opacity-0 group-has-[:focus-visible]/checkbox:scale-100 group-has-[:focus-visible]/checkbox:opacity-100",
            cn("transition-[opacity,scale] duration-300", springyEase)
          )}
          style={{ borderRadius: cornerRadius + 4 }}
        />

        <motion.span
          ref={visual}
          aria-hidden
          className={cn(
            "absolute inset-0 overflow-hidden border transition-colors duration-200 dark:bg-input/30",
            onFill
              ? "border-(--checkbox-on-accent)"
              : marked
                ? "border-(--checkbox-accent)"
                : "border-input group-hover/checkbox:border-foreground/40",
            invalid && "border-destructive"
          )}
          initial={false}
          animate={{ borderRadius: cornerRadius }}
          transition={spring}
        >
          <motion.span
            className={cn("absolute inset-0", onFill ? "bg-(--checkbox-on-accent)" : "bg-(--checkbox-accent)")}
            initial={false}
            animate={{ scale: marked && filled ? 1 : 0, borderRadius: `${roundness * 50}%` }}
            transition={{ scale: options.fill ? snappy : { duration: 0 }, borderRadius: spring }}
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
              markOnAccent ? "text-(--checkbox-on-accent)" : "text-(--checkbox-accent)"
            )}
          >
            <motion.path
              d="M5 12.5 10 17.5 19 7"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{
                pathLength: { duration: 0.25, ease: "easeOut", delay: checked ? 0.08 : 0 },
                opacity: { duration: 0.1 },
              }}
            />
            <motion.path
              d="M6 12h12"
              initial={false}
              animate={{ scaleX: mixed ? 1 : 0, opacity: mixed ? 1 : 0 }}
              transition={{ scaleX: snappy, opacity: { duration: 0.1 } }}
            />
          </svg>
        </motion.span>

        <button
          type="button"
          data-slot="checkbox-control"
          role="checkbox"
          aria-checked={mixed ? "mixed" : checked}
          disabled={disabled}
          onClick={toggle}
          className="absolute -inset-1 z-10 cursor-[inherit] rounded-sm outline-none"
        />
      </motion.span>

      {hasText && renderText(false)}
    </>
  )

  if (inGroup) {
    return (
      <Reorder.Item
        as="label"
        value={value}
        drag={draggable}
        whileDrag={{ scale: 1.03, zIndex: 10 }}
        onDragStart={() => (dragged.current = true)}
        onClickCapture={(event) => {
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

function RollingNumber({ value }: { value: number }) {
  const digits = String(value).split("")
  return (
    <span>
      <span className="sr-only">{value}</span>
      {digits.map((digit, i) => (
        <RollingDigit key={digits.length - i} digit={Number(digit)} />
      ))}
    </span>
  )
}

function RollingDigit({ digit }: { digit: number }) {
  return (
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

export { CheckboxGroup, CheckboxItem, type CheckboxVariant, type CheckboxCardFill, type CheckboxAppearance }
