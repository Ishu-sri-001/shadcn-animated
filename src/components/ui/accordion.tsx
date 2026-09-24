"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { cn } from "cn"
import { ChevronRightIcon } from "lucide-react"
import {
  motion,
  MotionConfig,
  useAnimate,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

const MotionChevronRightIcon = motion.create(ChevronRightIcon)

const smoothEase = [0.22, 1, 0.36, 1] as const
const fillEase = [0.215, 0.61, 0.355, 1] as const

type Transition = NonNullable<HTMLMotionProps<"div">["transition"]>

type MotionPreset = {
  panelOpen: Transition
  panelClose: Transition
  fillOpen: Transition
  fillClose: Transition
  /** Sideways squash of the fill while closed; 1 = none. */
  fillClosedScaleX: number
  plus: Transition
  chevron: Transition
  lineDraw: Transition
  lineRetract: Transition
  contentY: Transition
  /** Wait before the first paragraph animates in, in seconds. */
  delay: number
  /** Gap between paragraphs, in seconds. */
  stagger: number
}

type MotionOptions = {
  gooey: boolean
  duration: number
  bounce: number
  delay: number
  stagger: number
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)

function buildPreset({
  gooey,
  duration,
  bounce,
  delay,
  stagger,
}: MotionOptions): MotionPreset {
  if (!gooey) {
    const smooth = { duration, ease: smoothEase }
    const fill = { duration, ease: fillEase }
    const quick = { duration: duration * 0.6, ease: "easeOut" } as const
    return {
      panelOpen: smooth,
      panelClose: smooth,
      fillOpen: fill,
      fillClose: fill,
      fillClosedScaleX: 1,
      plus: fill,
      chevron: quick,
      lineDraw: { duration, ease: "easeOut" },
      lineRetract: { duration, ease: "easeOut" },
      contentY: quick,
      delay,
      stagger,
    }
  }

  // Gooey feel: springs that overshoot a little on the way in and settle.
  // Closing uses no bounce, so nothing jiggles past zero (e.g. negative height).
  const spring = (b: number, d = duration) =>
    ({ type: "spring", visualDuration: d, bounce: clamp01(b) }) as const
  const settle = spring(0, Math.max(duration - 0.1, 0.1))
  const icon = spring(bounce + 0.2, Math.max(duration - 0.1, 0.1))
  return {
    panelOpen: spring(bounce - 0.05),
    panelClose: settle,
    fillOpen: spring(bounce),
    fillClose: settle,
    // The slight squash makes the fill read as liquid as it springs open.
    fillClosedScaleX: 0.94,
    plus: icon,
    chevron: icon,
    lineDraw: spring(bounce - 0.1),
    lineRetract: settle,
    contentY: spring(bounce + 0.1),
    delay,
    stagger,
  }
}

// Set when `openOnHover` is on: items call it with their value as the mouse moves over them.
const AccordionHoverContext = React.createContext<
  ((value: unknown) => void) | null
>(null)

// Wait before a hover opens an item, so sweeping across items doesn't open each one.
const HOVER_INTENT_MS = 100

const AccordionMotionContext = React.createContext<MotionPreset>(
  buildPreset({
    gooey: false,
    duration: 0.5,
    bounce: 0.3,
    delay: 0.2,
    stagger: 0.05,
  })
)

function contentVariants(preset: MotionPreset): Variants {
  return {
    open: {
      transition: {
        delayChildren: preset.delay,
        staggerChildren: preset.stagger,
      },
    },
    closed: {},
  }
}

function contentItemVariants(preset: MotionPreset): Variants {
  return {
    open: {
      opacity: 1,
      y: "0em",
      transition: {
        y: preset.contentY,
        opacity: { duration: 0.3, ease: "easeOut" },
      },
    },
    closed: {
      opacity: 0,
      y: "0.5em",
      transition: { duration: 0.2, ease: "easeOut" },
    },
  }
}

function Accordion({
  className,
  bordered = false,
  gooey = false,
  duration = 0.5,
  bounce = 0.3,
  delay = 0.2,
  stagger = 0.05,
  openOnHover = false,
  value: valueProp,
  defaultValue,
  onValueChange,
  onPointerLeave,
  ...props
}: AccordionPrimitive.Root.Props & {
  /** Draws a rounded border around the whole accordion. */
  bordered?: boolean
  /** Springy, overshooting motion for opening, closing, icons and lines. */
  gooey?: boolean
  /** Base animation length in seconds (height, fill, icon, line). */
  duration?: number
  /** Spring overshoot when `gooey` is on, 0–1. */
  bounce?: number
  /** Wait before the content starts animating in, in seconds. */
  delay?: number
  /** Gap between each paragraph of content animating in, in seconds. */
  stagger?: number
  /**
   * Opens an item when the mouse rests on it (clicking still works) and closes
   * everything when the mouse leaves. Items need a `value`. Ignored when `value`
   * is controlled.
   */
  openOnHover?: boolean
}) {
  const preset = React.useMemo(
    () => buildPreset({ gooey, duration, bounce, delay, stagger }),
    [gooey, duration, bounce, delay, stagger]
  )

  // Open items are kept here (unless controlled) so hover can change them too.
  const [openValue, setOpenValue] = React.useState<unknown[]>(
    defaultValue ?? []
  )
  const hoverTimer = React.useRef<number | undefined>(undefined)
  const hoverEnabled = openOnHover && valueProp === undefined

  React.useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const openFromHover = React.useCallback((itemValue: unknown) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => {
      setOpenValue((prev) =>
        prev.length === 1 && prev[0] === itemValue ? prev : [itemValue]
      )
    }, HOVER_INTENT_MS)
  }, [])

  return (
    // "user" skips transform animations (slide, rotate, line draw) when the
    // OS "reduce motion" setting is on; AccordionContent also makes height instant.
    <AccordionMotionContext.Provider value={preset}>
      <AccordionHoverContext.Provider
        value={hoverEnabled ? openFromHover : null}
      >
        <MotionConfig reducedMotion="user">
          <AccordionPrimitive.Root
            data-slot="accordion"
            className={cn(
              "flex w-full flex-col gap-3",
              bordered && "rounded-lg border p-[2vw] max-md:p-[4vw]",
              className
            )}
            value={valueProp ?? openValue}
            onValueChange={(next, details) => {
              setOpenValue(next)
              onValueChange?.(next, details)
            }}
            onPointerLeave={(event) => {
              onPointerLeave?.(event)
              if (hoverEnabled && event.pointerType === "mouse") {
                window.clearTimeout(hoverTimer.current)
                setOpenValue([])
              }
            }}
            {...props}
          />
        </MotionConfig>
      </AccordionHoverContext.Provider>
    </AccordionMotionContext.Provider>
  )
}

function AccordionItem({
  className,
  fill,
  rounded = "rounded-none",
  line = false,
  onPointerMove,
  ...props
}: AccordionPrimitive.Item.Props & {
  /** Background class that fills the item from the top while open, e.g. "bg-black". */
  fill?: string
  /** Tailwind radius class for the fill's corners, e.g. "rounded-xl". */
  rounded?: string
  /** Draws a foreground-colored line over the divider on hover and while open. */
  line?: boolean
}) {
  const preset = React.useContext(AccordionMotionContext)
  const openFromHover = React.useContext(AccordionHoverContext)
  const [hovered, setHovered] = React.useState(false)

  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      onPointerMove={(event) => {
        onPointerMove?.(event)
        // Only real mouse movement: items shifting under a still cursor (as
        // others open and close) must not open the next one.
        if (
          openFromHover &&
          props.value !== undefined &&
          event.pointerType === "mouse" &&
          (event.movementX !== 0 || event.movementY !== 0)
        ) {
          openFromHover(props.value)
        }
      }}
      className={cn(
        "group/accordion-item relative py-3",
        // Inset the text from the fill.
        fill && cn("isolate px-4 transition-colors duration-500", rounded),
        className
      )}
      render={(itemProps, state) => (
        <motion.div
          {...(itemProps as HTMLMotionProps<"div">)}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
        >
          {fill && (
            <motion.div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
                fill
              )}
              style={{ originY: 0 }}
              initial={false}
              animate={{
                scaleY: state.open ? 1 : 0,
                scaleX: state.open ? 1 : preset.fillClosedScaleX,
              }}
              transition={state.open ? preset.fillOpen : preset.fillClose}
            />
          )}
          {itemProps.children}
          {/* Straight divider (a border would curve with the rounded fill corners).
              With a fill, it hides around the open item. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border",
              fill &&
                "transition-opacity duration-300 group-data-open/accordion-item:opacity-0 group-has-[+[data-open]]/accordion-item:opacity-0"
            )}
          />
          {line && <AccordionItemLine drawn={hovered || state.open} />}
        </motion.div>
      )}
      {...props}
    />
  )
}

/**
 * Line over the divider. Draws in from the left while `drawn`, retracts to the
 * right after. Each draw or retract always plays to the end (a quick hover
 * still gets the full draw), then the line catches up with the latest `drawn`.
 */
function AccordionItemLine({ drawn }: { drawn: boolean }) {
  const preset = React.useContext(AccordionMotionContext)
  const reduceMotion = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const isDrawn = React.useRef(false)
  const running = React.useRef(false)
  const target = React.useRef(drawn)

  // Plays draw/retract until the line matches the latest `drawn`, never
  // cutting one short.
  const play = React.useEffectEvent(async () => {
    if (running.current) return
    running.current = true
    const snap = { originX: { duration: 0 } }
    while (scope.current && target.current !== isDrawn.current) {
      if (target.current) {
        const scaleX = reduceMotion ? { duration: 0 } : preset.lineDraw
        await animate(scope.current, { originX: 0, scaleX: 1 }, { ...snap, scaleX })
      } else {
        const scaleX = reduceMotion ? { duration: 0 } : preset.lineRetract
        await animate(scope.current, { originX: 1, scaleX: 0 }, { ...snap, scaleX })
      }
      isDrawn.current = !isDrawn.current
    }
    running.current = false
  })

  React.useEffect(() => {
    target.current = drawn
    play()
  }, [drawn])

  return (
    // Sits on top of the grey divider.
    <motion.div
      ref={scope}
      aria-hidden
      style={{ scaleX: 0 }}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-foreground"
    />
  )
}

function AccordionTrigger({
  className,
  children,
  icon = "chevron",
  ...props
}: AccordionPrimitive.Trigger.Props & {
  /** "chevron" rotates 90° on open; "plus" turns into a minus. */
  icon?: "chevron" | "plus"
}) {
  const preset = React.useContext(AccordionMotionContext)

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger px-2 relative flex flex-1 items-center justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-[border-color,box-shadow] outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        render={(triggerProps, state) => (
          <button {...triggerProps}>
            {triggerProps.children}
            {icon === "plus" ? (
              <svg
                data-slot="accordion-trigger-icon"
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="pointer-events-none shrink-0"
              >
                <path d="M5 12h14" />
                {/* Vertical while closed; rotates flat onto the other bar to form a minus. */}
                <motion.path
                  d="M5 12h14"
                  initial={false}
                  animate={{ rotate: state.open ? 0 : 90 }}
                  transition={preset.plus}
                />
              </svg>
            ) : (
              <MotionChevronRightIcon
                data-slot="accordion-trigger-icon"
                className="pointer-events-none shrink-0"
                initial={false}
                animate={{ rotate: state.open ? 90 : 0 }}
                transition={preset.chevron}
              />
            )}
          </button>
        )}
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  const reduceMotion = useReducedMotion()
  const preset = React.useContext(AccordionMotionContext)

  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm "
      keepMounted
      // Motion animates open/close, so the panel stays mounted and is never
      // hidden by Base UI; `inert` keeps closed content out of focus and a11y.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      render={({ hidden, children: _children, ...panelProps }, state) => (
        <motion.div
          {...(panelProps as HTMLMotionProps<"div">)}
          inert={!state.open}
          initial={false}
          animate={{ height: state.open ? "auto" : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : state.open
                ? preset.panelOpen
                : preset.panelClose
          }
        >
          <motion.div
            initial={false}
            animate={state.open ? "open" : "closed"}
            variants={contentVariants(preset)}
            className={cn(
              "flex max-w-[90%] flex-col gap-4 px-2 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
              typeof className === "function" ? className(state) : className
            )}
          >
            {/* Each top-level child (e.g. a paragraph) fades and slides up in turn. */}
            {React.Children.toArray(children).map((child, i) => (
              <motion.div key={i} variants={contentItemVariants(preset)}>
                {child}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
      {...props}
    />
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
