"use client"

import * as React from "react"
import { cn } from "cn"
import {
  addMonths,
  addYears,
  differenceInCalendarMonths,
  endOfYear,
  format,
  startOfToday,
  startOfYear,
} from "date-fns"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { animate, useAnimate } from "motion/react"

import {
  CalendarRangeIcon,
  type CalendarRangeIconHandle,
} from "@/components/animated-icons/calendar-range-icon"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CalendarProps = React.ComponentProps<typeof Calendar>

function SlidingChevron({
  className,
  orientation,
  ...props
}: {
  className?: string
  style?: React.CSSProperties
  size?: number
  disabled?: boolean
  orientation?: "up" | "down" | "left" | "right"
}) {
  if (orientation !== "left" && orientation !== "right") {
    return <ChevronDownIcon className={cn("size-4", className)} {...props} />
  }

  const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
  const slide =
    "size-4 transition-transform duration-500 ease-in-out motion-reduce:transition-none"

  return (
    <span
      className={cn(
        "relative flex size-4 [--travel:calc(var(--cell-size)/2+0.5rem)]",
        className
      )}
    >
      <Icon
        className={cn(
          slide,
          orientation === "left"
            ? "group-hover/button:-translate-x-(--travel)"
            : "group-hover/button:translate-x-(--travel)"
        )}
        {...props}
      />
      <Icon
        aria-hidden
        className={cn(
          slide,
          "absolute inset-0 group-hover/button:translate-x-0",
          orientation === "left"
            ? "translate-x-(--travel)"
            : "-translate-x-(--travel)"
        )}
      />
    </span>
  )
}

type DropdownProps = {
  options?: { value: number; label: string; disabled: boolean }[]
  value?: string | number | readonly string[]
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  "aria-label"?: string
}

type HoverStyle = {
  variant: "filled" | "outline"
  transition: "slide" | "fade"
  duration: number
  /** Glide overshoot, 0–1. */
  bounce: number
}

const HoverStyleContext = React.createContext<HoverStyle>({
  variant: "filled",
  transition: "slide",
  duration: 0.25,
  bounce: 0.15,
})


function useHoverSquare(
  box: React.RefObject<HTMLElement | null>,
  { item, keepIn }: { item: string; keepIn: string },
  { transition, duration, bounce }: HoverStyle
) {
  const reduceMotion = usePrefersReducedMotion()
  const [square, animateSquare] = useAnimate<HTMLDivElement>()
  const shown = React.useRef(false)
  const current = React.useRef<HTMLElement | null>(null)

  const hide = () => {
    shown.current = false
    current.current = null
    if (square.current) {
      animateSquare(
        square.current,
        { opacity: 0 },
        { duration: reduceMotion ? 0 : 0.15 }
      )
    }
  }

  const onPointerOver = (event: React.PointerEvent) => {
    const hovered = event.target as HTMLElement
    const target = hovered.closest<HTMLElement>(item)
    const container = box.current
    const el = square.current
    if (!container || !el) return

    if (!target || target.matches(":disabled, [data-disabled]")) {
      if (target || !hovered.closest(keepIn)) hide()
      return
    }
    if (target === current.current) return
    current.current = target

    const from = container.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const position = {
      x: to.left - from.left - container.clientLeft + container.scrollLeft,
      y: to.top - from.top - container.clientTop + container.scrollTop,
      width: to.width,
      height: to.height,
    }
    if (shown.current && transition === "slide") {
      animateSquare(
        el,
        position,
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", visualDuration: duration, bounce }
      )
    } else if (shown.current) {
      animateSquare(el, position, { duration: 0 })
      animateSquare(
        el,
        { opacity: [0, 1] },
        { duration: reduceMotion ? 0 : duration }
      )
    } else {
      shown.current = true
      animateSquare(el, position, { duration: 0 })
      animateSquare(el, { opacity: 1 }, { duration: reduceMotion ? 0 : 0.15 })
    }
  }

  return [
    square,
    {
      onPointerOver,
      onPointerLeave: hide,
      hide,
      reset: () => {
        shown.current = false
        current.current = null
      },
    },
  ] as const
}

function HoverSquare({
  ref,
  variant,
}: {
  ref: React.Ref<HTMLDivElement>
  variant: HoverStyle["variant"]
}) {
  return (
    <div
      ref={ref}
      aria-hidden
      style={{ opacity: 0 }}
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-md",
        variant === "filled"
          ? "bg-foreground"
          : "border-2 border-foreground bg-transparent"
      )}
    />
  )
}

function AnimatedDropdown({
  options = [],
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const current = String(value)
  const list = React.useRef<HTMLDivElement>(null)
  const hoverStyle = React.useContext(HoverStyleContext)
  const [hoverSquare, hover] = useHoverSquare(
    list,
    {
      item: '[data-slot="select-item"]',
      keepIn: '[data-slot="select-content"]',
    },
    hoverStyle
  )
  const selectedIndex = Math.max(
    options.findIndex((option) => String(option.value) === current),
    0
  )

  return (
    <Select
      items={options.map((option) => ({
        value: String(option.value),
        label: option.label,
      }))}
      value={current}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) {
          hover.hide()
          return
        }
        requestAnimationFrame(() => {
          const box = list.current
          const selected = box?.querySelector<HTMLElement>("[data-selected]")
          if (!box || !selected) return
          box.scrollTop =
            selected.offsetTop -
            box.clientHeight / 2 +
            selected.offsetHeight / 2
        })
      }}
      onValueChange={(next) => {
        // react-day-picker only reads `event.target.value`.
        if (next !== null) {
          onChange?.({
            target: { value: next },
          } as React.ChangeEvent<HTMLSelectElement>)
        }
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-auto! gap-1 border-0 bg-transparent px-1.5 py-1 text-base font-medium shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent [&_svg]:transition-transform [&_svg]:duration-200 data-popup-open:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        ref={list}
        style={
          {
            "--hover-duration": `${hoverStyle.duration}s`,
          } as React.CSSProperties
        }
        onPointerOver={hover.onPointerOver}
        onPointerLeave={hover.onPointerLeave}
        alignItemWithTrigger={false}
        className="max-h-64 w-auto min-w-20 p-1.5 duration-200 ease-out data-open:zoom-in-100 data-closed:zoom-out-100 data-[side=bottom]:slide-in-from-top-2 data-closed:data-[side=bottom]:slide-out-to-top-2 data-closed:duration-150 motion-reduce:animate-none!"
      >
        <HoverSquare ref={hoverSquare} variant={hoverStyle.variant} />
        {options.map((option, index) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            style={{
              animationDelay: `${Math.min(Math.abs(index - selectedIndex), 8) * 25}ms`,
            }}
            className={cn(
              "animate-in fade-in-0 slide-in-from-top-1 animation-duration-200 ease-out fill-mode-backwards motion-reduce:animate-none!",
              "transition-colors duration-(--hover-duration) **:transition-colors **:duration-(--hover-duration) motion-reduce:transition-none motion-reduce:**:transition-none",
              "cursor-pointer focus:bg-transparent focus-visible:bg-accent",
              hoverStyle.variant === "filled" &&
                "hover:text-background! hover:**:text-background!"
            )}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const SLIDING_ARROWS = { Chevron: SlidingChevron, Dropdown: AnimatedDropdown }
const PLAIN_ARROWS = { Dropdown: AnimatedDropdown }

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  showIcon = true,
  rollingLabel = true,
  fromBehind = true,
  contentAnimation = "scale",
  contentScale = 0.9,
  captionLayout = "dropdown",
  yearsBefore = 10,
  yearsAfter = 10,
  monthTransition = "slide",
  monthSlideDistance = 40,
  slidingArrows = true,
  hoverVariant = "filled",
  hoverTransition = "slide",
  hoverDuration = 0.25,
  hoverBounce = 0.15,
  weekStartsOn = 0,
  onlyCurrentMonth = true,
  fixedWeeks = true,
  disablePast = false,
  highlightToday = false,
  closeOnSelect = true,
  className,
}: {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  dateFormat?: string
  showIcon?: boolean
  rollingLabel?: boolean
  fromBehind?: boolean
  contentAnimation?: "scale" | "fade"
  contentScale?: number
  captionLayout?: CalendarProps["captionLayout"]
  yearsBefore?: number
  yearsAfter?: number
  monthTransition?: "slide" | "fade" | "none"
  monthSlideDistance?: number
  slidingArrows?: boolean
  hoverVariant?: "filled" | "outline"
  hoverTransition?: "slide" | "fade"
  hoverDuration?: number
  hoverBounce?: number
  weekStartsOn?: CalendarProps["weekStartsOn"]
  onlyCurrentMonth?: boolean
  fixedWeeks?: boolean
  disablePast?: boolean
  highlightToday?: boolean
  closeOnSelect?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const icon = React.useRef<CalendarRangeIconHandle>(null)
  const reduceMotion = usePrefersReducedMotion()

  const calendarBox = React.useRef<HTMLDivElement>(null)
  const hoverStyle = React.useMemo<HoverStyle>(
    () => ({
      variant: hoverVariant,
      transition: hoverTransition,
      duration: hoverDuration,
      bounce: hoverBounce,
    }),
    [hoverVariant, hoverTransition, hoverDuration, hoverBounce]
  )
  const [dateHoverSquare, dateHover] = useHoverSquare(
    calendarBox,
    { item: "button[data-day]", keepIn: ".rdp-weeks" },
    hoverStyle
  )
  const label = value ? format(value, dateFormat) : placeholder

  const [month, setMonth] = React.useState(() => value ?? new Date())
  const pendingMonth = React.useRef<Date | null>(null)
  const enterDirection = React.useRef<1 | -1 | null>(null)

  const slideBy = (direction: number) =>
    monthTransition === "slide" ? `${direction * monthSlideDistance}%` : "0%"

  const monthParts = () =>
    calendarBox.current?.querySelectorAll(
      ".rdp-month_caption, .rdp-month_grid"
    ) ?? []

  const changeMonth = async (next: Date) => {
    const step = differenceInCalendarMonths(next, month)
    const alreadyAnimating = pendingMonth.current !== null
    const target = addMonths(pendingMonth.current ?? month, step)

    if (reduceMotion || monthTransition === "none") {
      setMonth(target)
      return
    }
    pendingMonth.current = target
    if (alreadyAnimating) return

    dateHover.hide()
    const direction = step > 0 ? 1 : -1
    await animate(
      [...monthParts()],
      { x: slideBy(-direction), opacity: 0 },
      { duration: 0.2, ease: "easeIn" }
    )
    const landing = pendingMonth.current
    pendingMonth.current = null
    enterDirection.current =
      differenceInCalendarMonths(landing, month) >= 0 ? 1 : -1
    setMonth(landing)
  }

  React.useLayoutEffect(() => {
    const direction = enterDirection.current
    if (direction === null) return
    enterDirection.current = null
    animate(
      [...monthParts()],
      { x: [slideBy(direction), "0%"], opacity: [0, 1] },
      { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const animateTrigger = () => {
    if (reduceMotion) return
    icon.current?.startAnimation()
  }

  return (
    <HoverStyleContext.Provider value={hoverStyle}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          dateHover.reset()
          if (next) {
            setMonth(value ?? new Date())
            animateTrigger()
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              data-empty={!value}
              onPointerEnter={animateTrigger}
              className={cn(
                "group/trigger h-11 w-[20rem] justify-start gap-2.5 px-3.5 text-left text-base font-normal data-[empty=true]:text-muted-foreground max-md:w-full",
                "hover:bg-background",
                fromBehind && "relative z-45",
                "dark:bg-background dark:hover:bg-background dark:bg-[linear-gradient(color-mix(in_oklch,var(--input)_30%,transparent),color-mix(in_oklch,var(--input)_30%,transparent))]",
                className
              )}
            />
          }
        >
          {showIcon && <CalendarRangeIcon ref={icon} size="1.25em" />}
          {rollingLabel ? (
            <span className="relative block overflow-hidden">
              <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/trigger:-translate-y-full motion-reduce:transition-none">
                {label}
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 top-full block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/trigger:-translate-y-full motion-reduce:transition-none"
              >
                {label}
              </span>
            </span>
          ) : (
            <span>{label}</span>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          positionerClassName={fromBehind ? "z-40" : undefined}
          className={cn(
            "w-(--anchor-width) p-0",
            "duration-300 ease-out data-open:zoom-in-100 data-closed:zoom-out-100 data-closed:delay-150 motion-reduce:animate-none!",
            fromBehind
              ? "data-[side=bottom]:slide-in-from-top-12 data-closed:data-[side=bottom]:slide-out-to-top-12"
              : "data-[side=bottom]:slide-in-from-top-4 data-closed:data-[side=bottom]:slide-out-to-top-4"
          )}
        >
          <div
            ref={calendarBox}
            className="relative overflow-hidden"
            style={
              { "--hover-duration": `${hoverDuration}s` } as React.CSSProperties
            }
            onPointerOver={dateHover.onPointerOver}
            onPointerLeave={dateHover.onPointerLeave}
          >
            <HoverSquare ref={dateHoverSquare} variant={hoverVariant} />
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange?.(date)
                if (closeOnSelect) setOpen(false)
              }}
              month={month}
              onMonthChange={changeMonth}
              captionLayout={captionLayout}
              startMonth={startOfYear(addYears(startOfToday(), -yearsBefore))}
              endMonth={endOfYear(addYears(startOfToday(), yearsAfter))}
              buttonVariant="outline"
              components={slidingArrows ? SLIDING_ARROWS : PLAIN_ARROWS}
              fixedWeeks={fixedWeeks}
              showOutsideDays={!onlyCurrentMonth}
              weekStartsOn={weekStartsOn}
              disabled={disablePast ? { before: startOfToday() } : undefined}
              autoFocus
              style={
                {
                  "--tw-enter-scale":
                    contentAnimation === "scale" ? contentScale : 1,
                } as React.CSSProperties
              }
              className={cn(
                "animate-in fade-in-0 zoom-in-90 duration-300 ease-out delay-150 fill-mode-backwards motion-reduce:animate-none!",
                "in-data-closed:animate-out in-data-closed:fade-out-0 in-data-closed:zoom-out-100 in-data-closed:duration-150 in-data-closed:delay-0 in-data-closed:fill-mode-forwards motion-reduce:in-data-closed:animate-none",
                String.raw`[&_.rdp-nav]:pointer-events-none [&_.rdp-nav]:z-10 [&_.rdp-button\_previous]:pointer-events-auto [&_.rdp-button\_next]:pointer-events-auto`,
                String.raw`[&_.rdp-button\_previous]:overflow-hidden [&_.rdp-button\_previous]:rounded-full [&_.rdp-button\_next]:overflow-hidden [&_.rdp-button\_next]:rounded-full`,
                String.raw`[&_.rdp-button\_previous]:hover:bg-background [&_.rdp-button\_next]:hover:bg-background dark:[&_.rdp-button\_previous]:hover:bg-input/30 dark:[&_.rdp-button\_next]:hover:bg-input/30`,
                "w-full! p-3 [&_.rdp-weekdays]:gap-1.5 [&_.rdp-week]:mt-1.5 [&_.rdp-week]:gap-1.5",
                !highlightToday && "[&_.rdp-today]:bg-transparent",
              highlightToday && "[&_.rdp-today]:hover:bg-transparent",
                "[&_button[data-day]]:ring-0! [&_button[data-day]:focus-visible]:ring-[3px]!",
                "[&_button[data-day]]:hover:bg-transparent dark:[&_button[data-day]]:hover:bg-transparent",
                hoverVariant === "filled" &&
                  "[&_button[data-day]]:hover:text-background",
                "[&_button[data-day]]:transition-colors [&_button[data-day]]:duration-(--hover-duration) [&_button[data-day]]:ease-out motion-reduce:[&_button[data-day]]:transition-none",
                hoverVariant === "outline" &&
                  "[&_button[data-selected-single=true]]:bg-transparent! [&_button[data-selected-single=true]]:text-foreground! [&_button[data-selected-single=true]]:shadow-[inset_0_0_0_2px_var(--foreground)]"
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
    </HoverStyleContext.Provider>
  )
}

export { DatePicker }
