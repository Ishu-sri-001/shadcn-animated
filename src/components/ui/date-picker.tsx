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

/**
 * Month arrows: on hovering the button, the arrow slides out the way it points
 * and an identical one slides in from the other side. The round button clips
 * them (see `rounded-full overflow-hidden` on the nav buttons), so each arrow
 * travels from the centre fully past the button's edge.
 * Defined once here: a new component each render would remount the calendar.
 */
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
    // --travel: half the button (--cell-size) + half the icon (0.5rem), i.e.
    // from the centre to just outside the button.
    <span
      className={cn(
        "relative flex size-4 [--travel:calc(var(--cell-size)/2+0.5rem)]",
        className
      )}
    >
      {/* `group/button` comes from shadcn's buttonVariants on the nav button. */}
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
  /** "slide": glides between items; "fade": fades in on each item. */
  transition: "slide" | "fade"
  /** Glide duration between items, in seconds. */
  duration: number
  /** Glide overshoot, 0–1. */
  bounce: number
}

// Lets the (module-level, stable) dropdown use the date picker's hover style.
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
    // pointerover also fires for the item's own children; same item, no-op.
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
      // Fade: jump to the new item and fade in there (explicit 0 → 1, since a
      // separate "set to 0" would be cancelled by this animation).
      animateSquare(el, position, { duration: 0 })
      animateSquare(
        el,
        { opacity: [0, 1] },
        { duration: reduceMotion ? 0 : duration }
      )
    } else {
      // First item entered: appear in place, no slide in from the corner.
      shown.current = true
      animateSquare(el, position, { duration: 0 })
      animateSquare(el, { opacity: 1 }, { duration: reduceMotion ? 0 : 0.15 })
    }
  }

  // Ref and handlers returned separately: the React Compiler treats an object
  // holding a ref as a ref, so its handlers couldn't be read during render.
  return [
    square,
    {
      onPointerOver,
      onPointerLeave: hide,
      hide,
      /** Call when the box remounts (e.g. its popup reopens). */
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

/**
 * Month / year dropdown in the calendar header ("Dec ⌄", "2026 ⌄"). Replaces
 * the native <select> (whose list can't be animated) with shadcn's Select:
 * the list slides down and fades in, its options fading in outward from the
 * selected one, and slides back up on close. The chevron flips while open.
 */
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
          // The list stays mounted while closed; start fresh next time.
          hover.hide()
          return
        }
        // Centre the selected option (e.g. this year in a 100-year list),
        // scrolling only the list, not the page.
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
            // Fan out from the selected option (capped, so a long year list
            // doesn't keep far options waiting).
            style={{
              animationDelay: `${Math.min(Math.abs(index - selectedIndex), 8) * 25}ms`,
            }}
            className={cn(
              // animation-duration (not duration-*) so it doesn't clash with the
              // colour transition's duration below.
              "animate-in fade-in-0 slide-in-from-top-1 animation-duration-200 ease-out fill-mode-backwards motion-reduce:animate-none!",
              // Text colour (option and its inner text) eases in with the
              // square's glide.
              "transition-colors duration-(--hover-duration) **:transition-colors **:duration-(--hover-duration) motion-reduce:transition-none motion-reduce:**:transition-none",
              // The sliding square replaces the option's own highlight for the
              // pointer; keyboard focus keeps it.
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

// Stable objects: a new `components` value would remount the calendar.
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
  /** date-fns format string for the button label, e.g. "PPP" → "September 23rd, 2026". */
  dateFormat?: string
  /** Shows the animated calendar icon in the trigger. */
  showIcon?: boolean
  /** On hover, the label rolls up and an identical copy rolls in from below. */
  rollingLabel?: boolean
  /** The popup opens and closes from behind the trigger instead of over it. */
  fromBehind?: boolean
  /** How the calendar content appears when the popup opens: fade + scale up, or fade only. */
  contentAnimation?: "scale" | "fade"
  /** Scale the content grows from with `contentAnimation="scale"` (0–1). */
  contentScale?: number
  /** Header: month + year dropdowns, one of them, or a plain "September 2026" label. */
  captionLayout?: CalendarProps["captionLayout"]
  /** How many years before this one the calendar (and year dropdown) goes back. */
  yearsBefore?: number
  /** How many years after this one the calendar (and year dropdown) goes forward. */
  yearsAfter?: number
  /** How the month title and grid change months. */
  monthTransition?: "slide" | "fade" | "none"
  /** How far the month slides, in % of its width (with `monthTransition="slide"`). */
  monthSlideDistance?: number
  /** Month arrows slide out and back in on hover. */
  slidingArrows?: boolean
  /** Hover square: "filled" (solid, light text) or "outline" (border only). */
  hoverVariant?: "filled" | "outline"
  /** Hover square between dates and dropdown options: glide ("slide") or fade in on each ("fade"). */
  hoverTransition?: "slide" | "fade"
  /** How long the hover square takes to glide between dates, in seconds. */
  hoverDuration?: number
  /** Overshoot of the hover square's glide, 0–1. */
  hoverBounce?: number
  /** First day of the week: 0 = Sunday, 1 = Monday, … */
  weekStartsOn?: CalendarProps["weekStartsOn"]
  /** Shows only this month's days, hiding the greyed-out ones from the months either side. */
  onlyCurrentMonth?: boolean
  /** Always 6 week rows, so the popup keeps one height across months. */
  fixedWeeks?: boolean
  /** Stops dates before today from being picked. */
  disablePast?: boolean
  /** Gives today's date a light background. */
  highlightToday?: boolean
  /** Closes the popup once a date is picked. */
  closeOnSelect?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const icon = React.useRef<CalendarRangeIconHandle>(null)
  const reduceMotion = usePrefersReducedMotion()

  // One hover square behind the grid slides to whichever date is under the
  // pointer, instead of each date lighting up on its own.
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

  // Month changes animate the old month out (slide: next → left, previous →
  // right), swap it, then animate the new one in from the other side.
  const [month, setMonth] = React.useState(() => value ?? new Date())
  // Month the running exit animation will land on, so rapid clicks add up.
  const pendingMonth = React.useRef<Date | null>(null)
  // Set when a swap happened and the new month should animate in (+1 / -1).
  const enterDirection = React.useRef<1 | -1 | null>(null)

  const slideBy = (direction: number) =>
    monthTransition === "slide" ? `${direction * monthSlideDistance}%` : "0%"

  const monthParts = () =>
    calendarBox.current?.querySelectorAll(
      ".rdp-month_caption, .rdp-month_grid"
    ) ?? []

  const changeMonth = async (next: Date) => {
    // `next` is relative to the month still on screen; mid-animation, apply
    // the same step to the month we're already heading to.
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

  // After the new month renders (still hidden from the exit), animate it in
  // from the side it's arriving from.
  React.useLayoutEffect(() => {
    const direction = enterDirection.current
    if (direction === null) return
    enterDirection.current = null
    animate(
      [...monthParts()],
      { x: [slideBy(direction), "0%"], opacity: [0, 1] },
      { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    )
    // Only a month change should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // Redraws the icon on hover and when the calendar opens.
  const animateTrigger = () => {
    // No redraw with "reduce motion" on: the icon just stays as it is.
    if (reduceMotion) return
    icon.current?.startAnimation()
  }

  return (
    <HoverStyleContext.Provider value={hoverStyle}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          // The popover (and its hover square) remounts on each open.
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
              // Animates on hovering the whole button, not only the icon.
              onPointerEnter={animateTrigger}
              className={cn(
                "group/trigger h-11 w-[20rem] justify-start gap-2.5 px-3.5 text-left text-base font-normal data-[empty=true]:text-muted-foreground max-md:w-full",
                // Keep the resting background on hover (outline variant tints it).
                "hover:bg-background",
                // Above the popup (z-40), so it opens and closes from behind the
                // button; still below the navbar (z-50).
                fromBehind && "relative z-45",
                // Opaque version of the dark outline background (input/30 is
                // see-through): solid background + the same tint layered on top,
                // so the popup can't show through the button.
                "dark:bg-background dark:hover:bg-background dark:bg-[linear-gradient(color-mix(in_oklch,var(--input)_30%,transparent),color-mix(in_oklch,var(--input)_30%,transparent))]",
                className
              )}
            />
          }
        >
          {/* em: scales with the button's text size. */}
          {showIcon && <CalendarRangeIcon ref={icon} size="1.25em" />}
          {rollingLabel ? (
            // Rolling label: on hover the text slides up out of the clipped box
            // while an identical copy (absolute, just below) slides in from the bottom.
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
            // As wide as the trigger button.
            "w-(--anchor-width) p-0",
            // Slides down while fading in; reverses on close, after the content
            // inside has faded out (delay-150). From behind: starts ~the
            // trigger's height + gap up, hidden under it.
            "duration-300 ease-out data-open:zoom-in-100 data-closed:zoom-out-100 data-closed:delay-150 motion-reduce:animate-none!",
            fromBehind
              ? "data-[side=bottom]:slide-in-from-top-12 data-closed:data-[side=bottom]:slide-out-to-top-12"
              : "data-[side=bottom]:slide-in-from-top-4 data-closed:data-[side=bottom]:slide-out-to-top-4"
          )}
        >
          <div
            ref={calendarBox}
            // overflow-hidden clips the month slide to the calendar.
            className="relative overflow-hidden"
            // Text colour on hover eases over the square's glide time.
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
              // Range of the year dropdown; the arrows stop at its ends too.
              startMonth={startOfYear(addYears(startOfToday(), -yearsBefore))}
              endMonth={endOfYear(addYears(startOfToday(), yearsAfter))}
              buttonVariant="outline"
              components={slidingArrows ? SLIDING_ARROWS : PLAIN_ARROWS}
              fixedWeeks={fixedWeeks}
              showOutsideDays={!onlyCurrentMonth}
              weekStartsOn={weekStartsOn}
              disabled={disablePast ? { before: startOfToday() } : undefined}
              autoFocus
              // Starting scale of the fade-in below (overrides zoom-in-90); 1 = fade only.
              style={
                {
                  "--tw-enter-scale":
                    contentAnimation === "scale" ? contentScale : 1,
                } as React.CSSProperties
              }
              className={cn(
                // Fades and scales up (contentScale → 1) halfway through the
                // popover's 300ms slide; `fill-mode-backwards` keeps it hidden
                // during the delay.
                "animate-in fade-in-0 zoom-in-90 duration-300 ease-out delay-150 fill-mode-backwards motion-reduce:animate-none!",
                // On close, fades out first (the popover waits 150ms for it) and
                // stays hidden until the popover is gone.
                "in-data-closed:animate-out in-data-closed:fade-out-0 in-data-closed:zoom-out-100 in-data-closed:duration-150 in-data-closed:delay-0 in-data-closed:fill-mode-forwards motion-reduce:in-data-closed:animate-none",
                // Arrows stay above the month title: while the title slides it
                // would otherwise cover them, dropping hover (the arrow icon would
                // replay on click) and hiding the arrows. The nav row spans the
                // title, so only the buttons take pointer events.
                String.raw`[&_.rdp-nav]:pointer-events-none [&_.rdp-nav]:z-10 [&_.rdp-button\_previous]:pointer-events-auto [&_.rdp-button\_next]:pointer-events-auto`,
                // Round month arrows that clip their sliding icons…
                String.raw`[&_.rdp-button\_previous]:overflow-hidden [&_.rdp-button\_previous]:rounded-full [&_.rdp-button\_next]:overflow-hidden [&_.rdp-button\_next]:rounded-full`,
                // …and keep their resting background on hover (outline tints it).
                String.raw`[&_.rdp-button\_previous]:hover:bg-background [&_.rdp-button\_next]:hover:bg-background dark:[&_.rdp-button\_previous]:hover:bg-input/30 dark:[&_.rdp-button\_next]:hover:bg-input/30`,
                // Fill the popover (shadcn sets w-fit) and space the days apart.
                "w-full! p-3 [&_.rdp-weekdays]:gap-1.5 [&_.rdp-week]:mt-1.5 [&_.rdp-week]:gap-1.5",
                // shadcn tints today's cell (bg-muted); clear it unless wanted.
                !highlightToday && "[&_.rdp-today]:bg-transparent",
              // Highlighted today sits above the hover square (which is behind
              // the cells): clear it while hovered so the square shows through.
              highlightToday && "[&_.rdp-today]:hover:bg-transparent",
                // No grey ring on the last-clicked / auto-focused date; keep it
                // for keyboard focus only.
                "[&_button[data-day]]:ring-0! [&_button[data-day]:focus-visible]:ring-[3px]!",
                // The sliding square replaces each date's own hover background.
                "[&_button[data-day]]:hover:bg-transparent dark:[&_button[data-day]]:hover:bg-transparent",
                // Filled: the hovered date's text turns light to sit on it.
                hoverVariant === "filled" &&
                  "[&_button[data-day]]:hover:text-background",
                // Hovered date's text colour eases in with the square's glide
                // instead of switching before the square arrives.
                "[&_button[data-day]]:transition-colors [&_button[data-day]]:duration-(--hover-duration) [&_button[data-day]]:ease-out motion-reduce:[&_button[data-day]]:transition-none",
                // Outline: the selected date matches the hover square — a 2px
                // border (inset shadow, since rings are off above), no fill.
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
