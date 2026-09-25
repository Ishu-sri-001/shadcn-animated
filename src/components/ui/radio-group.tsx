"use client"

import * as React from "react"
import { cn } from "cn"
import { animate, AnimatePresence, motion, MotionConfig, Reorder, useReducedMotion } from "motion/react"

type RadioVariant = "default" | "card"
type RadioAppearance = "outline" | "filled" | "full"
type RadioCardFill = "muted" | "primary"
const spring = { type: "spring", visualDuration: 0.35, bounce: 0.3 } as const
const glide = { type: "spring", visualDuration: 0.4, bounce: 0.15 } as const
const snappy = { type: "spring", visualDuration: 0.25, bounce: 0 } as const
const springyEase = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"

type RadioOptions = {
  dotSlide: boolean
  cardSlide: boolean
  bounce: boolean
  showIcon: boolean
  /** Outline or filled radio. */
  appearance: RadioAppearance
}

const defaultOptions: RadioOptions = {
  dotSlide: false,
  cardSlide: true,
  bounce: true,
  showIcon: true,
  appearance: "outline",
}

type RadioGroupContextValue = RadioOptions & {
  id: string
  variant: RadioVariant
  cardFill: RadioCardFill
  selected: string
  select: (value: string) => void
  reorder: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)
const RadioIndexContext = React.createContext(0)

type RadioGroupProps = Partial<RadioOptions> & {
  className?: string
  children?: React.ReactNode
  "aria-label"?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  variant?: RadioVariant
  cardFill?: RadioCardFill
  reorder?: boolean
  onReorder?: (order: string[]) => void
}

function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  reorder = false,
  onReorder,
  variant = "default",
  cardFill = "muted",
  "aria-label": ariaLabel,
  ...optionProps
}: RadioGroupProps) {
  const id = React.useId()
  const groupRef = React.useRef<HTMLDivElement>(null)
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const selected = value !== undefined ? value : internal

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

  const select = (next: string) => {
    if (next === selected) return
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!groupRef.current) return
    const radios = Array.from(
      groupRef.current.querySelectorAll<HTMLButtonElement>("[data-slot=radio-control]:not(:disabled)")
    )
    const index = radios.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    const steps: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    let target: number
    if (event.key === "Home") target = 0
    else if (event.key === "End") target = radios.length - 1
    else if (event.key in steps) target = (index + steps[event.key] + radios.length) % radios.length
    else return
    event.preventDefault()
    radios[target].focus()
    radios[target].click()
  }

  const context: RadioGroupContextValue = {
    ...defaultOptions,
    ...optionProps,
    id,
    variant,
    cardFill,
    selected,
    select,
    reorder,
  }

  return (
    <MotionConfig reducedMotion="user">
      <RadioGroupContext.Provider value={context}>
        <Reorder.Group
          as="div"
          axis="xy"
          values={currentOrder}
          onReorder={(next: string[]) => {
            setOrder(next)
            onReorder?.(next)
          }}
          ref={groupRef}
          role="radiogroup"
          aria-label={ariaLabel}
          data-slot="radio-group"
          onKeyDown={onKeyDown}
          className={cn("isolate grid w-full gap-3", className)}
        >
          {items.map((child, index) => (
            <RadioIndexContext.Provider key={child.key ?? index} value={index}>
              {child}
            </RadioIndexContext.Provider>
          ))}
        </Reorder.Group>
      </RadioGroupContext.Provider>
    </MotionConfig>
  )
}

type RadioGroupItemProps = {
  className?: string
  value: string
  label?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  accent?: string
}

function RadioGroupItem(props: RadioGroupItemProps) {
  const group = React.useContext(RadioGroupContext)
  if (!group) throw new Error("RadioGroupItem must be used inside a RadioGroup.")
  return <RadioItem group={group} {...props} />
}

function RadioItem({
  group,
  className,
  value,
  label,
  description,
  disabled = false,
  accent,
}: RadioGroupItemProps & { group: RadioGroupContextValue }) {
  const index = React.useContext(RadioIndexContext)
  const reduceMotion = useReducedMotion()
  const visual = React.useRef<HTMLSpanElement>(null)
  const dragged = React.useRef(false)
  const [entered, setEntered] = React.useState(false)

  const checked = group.selected === value
  const card = group.variant === "card"
  const draggable = group.reorder && !disabled

  const [wasChecked, setWasChecked] = React.useState(checked)
  const [pulse, setPulse] = React.useState(0)
  if (checked !== wasChecked) {
    setWasChecked(checked)
    if (checked) setPulse((p) => p + 1)
  }

  React.useEffect(() => {
    if (pulse === 0 || !group.bounce || reduceMotion || !visual.current) return
    animate(
      visual.current,
      { scale: [1, 0.7, 1.25, 0.94, 1] },
      { duration: 0.55, times: [0, 0.2, 0.5, 0.75, 1], ease: "easeOut" }
    )
  }, [pulse, group.bounce, reduceMotion])

  const hasText = label !== undefined || description !== undefined
  const solid = card && group.cardFill === "primary"
  const onFill = solid && checked
  const showControl = group.showIcon
  const filled = group.appearance === "filled"
  const full = group.appearance === "full"
  const dotOnAccent = filled !== onFill
  const dotClass = cn(
    "pointer-events-none absolute z-10 size-3 rounded-full",
    dotOnAccent ? "bg-(--radio-on-accent)" : "bg-(--radio-accent)"
  )

  const cardHighlight = cn(
    "pointer-events-none absolute inset-0 -z-10 rounded-xl",
    solid ? "bg-(--radio-accent)" : accent ? "bg-(--radio-accent)/15" : "bg-muted"
  )

  const rootProps = {
    "data-slot": "radio-item",
    "data-value": value,
    "data-checked": checked || undefined,
    "data-disabled": disabled || undefined,
    className: cn(
      "group/radio relative flex cursor-pointer gap-3 text-lg select-none [--radio-accent:var(--primary)] [--radio-on-accent:var(--primary-foreground)] data-disabled:cursor-not-allowed",
      description !== undefined ? "items-start" : "items-center",
      !showControl &&
        "rounded-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background",
      card &&
        cn(
          "rounded-xl border px-4 py-3 transition-colors duration-300",
          checked
            ? solid
              ? "border-(--radio-accent)"
              : accent
                ? "border-(--radio-accent)/40"
                : "border-foreground/15"
            : "hover:border-foreground/30"
        ),
      draggable && "cursor-grab active:cursor-grabbing",
      className
    ),
    style: accent
      ? ({ "--radio-accent": accent, "--radio-on-accent": "white" } as React.CSSProperties)
      : undefined,
    initial: { opacity: 0, y: 6 },
    animate: { opacity: disabled ? 0.5 : 1, y: 0 },
    onAnimationComplete: () => setEntered(true),
    transition: { ...spring, delay: entered ? 0 : index * 0.05, layout: spring },
  }

  return (
    <Reorder.Item
      as="label"
      value={value}
      drag={draggable}
      whileDrag={{ scale: 1.03, zIndex: 10 }}
      onDragStart={() => (dragged.current = true)}
      onPointerDown={() => (dragged.current = false)}
      onClickCapture={(event) => {
        if (!dragged.current) return
        event.preventDefault()
        event.stopPropagation()
      }}
      {...rootProps}
    >
      {card &&
        (group.cardSlide ? (
          checked && (
            <motion.span
              layoutId={`${group.id}-card`}
              aria-hidden
              className={cardHighlight}
              style={{ borderRadius: 12 }}
              transition={glide}
            />
          )
        ) : (
          <motion.span
            aria-hidden
            className={cardHighlight}
            initial={false}
            animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.96 }}
            transition={snappy}
          />
        ))}

      <motion.span
        className={showControl ? "relative grid size-6 shrink-0 place-items-center" : "sr-only"}
        whileTap={disabled || !group.bounce ? undefined : { scale: 0.85 }}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-1 scale-75 rounded-full border-2 border-ring/50 opacity-0 group-has-[:focus-visible]/radio:scale-100 group-has-[:focus-visible]/radio:opacity-100",
            cn("transition-[opacity,scale] duration-300", springyEase)
          )}
        />

        {/* The ring. */}
        <span
          ref={visual}
          aria-hidden
          className={cn(
            "absolute inset-0 overflow-hidden rounded-full border transition-colors duration-200 dark:bg-input/30",
            onFill
              ? "border-(--radio-on-accent)"
              : checked
                ? "border-(--radio-accent)"
                : "border-input group-hover/radio:border-foreground/40"
          )}
        >
          {(filled || full) && (
            <motion.span
              className={cn(
                "absolute inset-0 rounded-full",
                onFill ? "bg-(--radio-on-accent)" : "bg-(--radio-accent)"
              )}
              initial={false}
              animate={{ scale: checked ? 1 : 0 }}
              transition={snappy}
            />
          )}
        </span>

        {showControl &&
          !full &&
          (group.dotSlide ? (
            checked && (
              <motion.span layoutId={`${group.id}-dot`} aria-hidden className={dotClass} transition={glide} />
            )
          ) : (
            <AnimatePresence initial={false}>
              {checked && (
                <motion.span
                  key="dot"
                  aria-hidden
                  className={dotClass}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: snappy }}
                  transition={spring}
                />
              )}
            </AnimatePresence>
          ))}

        <button
          type="button"
          data-slot="radio-control"
          role="radio"
          aria-checked={checked}
          disabled={disabled}
          tabIndex={checked || group.selected === "" ? 0 : -1}
          onClick={() => !disabled && group.select(value)}
          className="absolute -inset-1 z-20 cursor-[inherit] rounded-full outline-none"
        />
      </motion.span>

      {hasText && (
        <span className="flex flex-col gap-1">
          {label !== undefined && (
            <span className="inline-grid w-fit leading-none">
              <span aria-hidden className="invisible col-start-1 row-start-1 font-medium">
                {label}
              </span>
              <span
                className={cn(
                  "col-start-1 row-start-1 transition-[color,font-weight] duration-300",
                  onFill
                    ? "font-medium text-(--radio-on-accent)"
                    : checked
                      ? "font-medium text-foreground"
                      : "font-normal text-muted-foreground group-hover/radio:text-foreground"
                )}
              >
                {label}
              </span>
            </span>
          )}
          {description !== undefined && (
            <span
              className={cn(
                "text-sm transition-colors duration-300",
                onFill ? "text-(--radio-on-accent)/80" : "text-muted-foreground"
              )}
            >
              {description}
            </span>
          )}
        </span>
      )}
    </Reorder.Item>
  )
}

export { RadioGroup, RadioGroupItem, type RadioVariant, type RadioCardFill, type RadioAppearance }
