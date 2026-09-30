"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import {
  AnimatePresence,
  motion,
  MotionConfig,
  stagger,
  useReducedMotion,
  type HTMLMotionProps,
  type TargetAndTransition,
  type Variants,
} from "motion/react"

const smoothEase = [0.22, 1, 0.36, 1] as const
const easeOutCubic = [0.33, 1, 0.68, 1] as const
/** A long, gentle deceleration for panel movement. */
const glideEase = [0.32, 0.72, 0, 1] as const

/** Scale an item shrinks to while pressed. */
const ITEM_PRESS_SCALE = 0.99

/** How long the tick stays visible before the menu closes, with `delayCloseOnSelect`. */
const SELECT_CLOSE_DELAY_MS = 320

type Transition = NonNullable<HTMLMotionProps<"div">["transition"]>

type DropdownMenuAnimation = "collapse" | "scale" | "slide" | "reveal" | "morph"
type DropdownMenuIndicator = "check" | "dot" | "bar"
type DropdownMenuHighlight = "slide" | "fill" | "none"
type DropdownMenuHighlightColor = "primary" | "muted"

type MotionPreset = {
  enter: Transition
  exit: Transition
  item: Transition
  glide: Transition
  icon: Transition
  /** Length of one icon phase, in seconds. */
  iconDuration: number
  exitDuration: number
}

function buildPreset({
  duration,
  exitFast,
}: {
  duration: number
  exitFast: boolean
}): MotionPreset {
  const exitDuration = exitFast ? duration * 0.6 : duration
  return {
    enter: { duration, ease: smoothEase },
    exit: { duration: exitDuration, ease: smoothEase },
    item: { duration, ease: smoothEase },
    glide: { duration: duration * 0.6, ease: smoothEase },
    icon: { duration, ease: smoothEase },
    exitDuration,
    iconDuration: duration,
  }
}

type DropdownMenuContextValue = {
  id: string
  open: boolean
  close: () => void
  onExitComplete: () => void
  triggerRef: React.RefObject<HTMLElement | null>
  /** The morph panel while it is mounted; it shares the trigger's box, so presses scale it too. */
  morphPanelRef: React.RefObject<HTMLElement | null>
  preset: MotionPreset
  animation: DropdownMenuAnimation
  stagger: number
  delay: number
  exitFast: boolean
  itemHighlight: DropdownMenuHighlight
  itemHighlightColor: DropdownMenuHighlightColor
  selectionIndicator: DropdownMenuIndicator
  rollingText: boolean
  closeDelayOnSelect: boolean
  pressFeedback: boolean
  showDescriptions: boolean
  bold: boolean
  typeahead: boolean
  /**
   * The item the sliding highlight sits on. It moves when another item is highlighted and only
   * clears when the pointer leaves the panel or the menu closes, so crossing the gap between two
   * items (or a separator) doesn't drop the pill for a frame and pop it back.
   */
  activeItem: string | null
  setActiveItem: (item: string | null) => void
  /**
   * Clears the pill after a short grace period, cancelled if another item takes it first. The
   * pointer can briefly "leave" a panel without meaning to — Base UI lays an invisible hover
   * guard over it while a submenu is open — and an instant clear would flicker the pill.
   */
  releaseActiveItem: () => void
}

/** How long the pill waits after the pointer leaves before it goes, in ms. */
const PILL_RELEASE_MS = 150

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("Dropdown menu parts must be used within <DropdownMenu>.")
  return context
}

/** Whether the item the current element sits in is highlighted (hovered or focused). */
const ItemHighlightContext = React.createContext(false)

function DropdownMenu({
  duration = 0.35,
  stagger = 0.05,
  delay = 0.1,
  exitFast = false,
  animation = "collapse",
  itemHighlight = "slide",
  itemHighlightColor = "primary",
  selectionIndicator = "check",
  rollingText = false,
  closeDelayOnSelect = false,
  pressFeedback = true,
  showDescriptions = false,
  bold = false,
  typeahead = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: Omit<MenuPrimitive.Root.Props, "actionsRef"> & {
  /** Open duration, in seconds. */
  duration?: number
  /** Gap between items appearing, in seconds. */
  stagger?: number
  /** Wait before items start appearing, in seconds. */
  delay?: number
  /** Close in 60% of the open time, without staggering items out. */
  exitFast?: boolean
  /** How the panel opens and closes. */
  animation?: DropdownMenuAnimation
  /**
   * How the hovered item is highlighted: `slide` glides one highlight between items,
   * `fill` fills each item with the primary colour from the top down.
   */
  itemHighlight?: DropdownMenuHighlight
  /** The hovered item's fill: the primary colour, or the quieter muted one. */
  itemHighlightColor?: DropdownMenuHighlightColor
  /** How the chosen radio item is marked. */
  selectionIndicator?: DropdownMenuIndicator
  /** Item titles roll to a copy of themselves when highlighted. */
  rollingText?: boolean
  /** Show the tick for a moment after a pick before closing. */
  closeDelayOnSelect?: boolean
  /** The trigger and items scale down while pressed and spring back on release. */
  pressFeedback?: boolean
  /** Show each item's `DropdownMenuItemDescription`. */
  showDescriptions?: boolean
  /** Bold item titles and the trigger value. */
  bold?: boolean
  /** Typing a letter jumps to the matching item. */
  typeahead?: boolean
}) {
  const id = React.useId()
  const [openState, setOpenState] = React.useState(defaultOpen)
  const [activeItem, setActiveItemState] = React.useState<string | null>(null)
  const releaseTimer = React.useRef(0)
  const setActiveItem = React.useCallback((item: string | null) => {
    window.clearTimeout(releaseTimer.current)
    setActiveItemState(item)
  }, [])
  const releaseActiveItem = React.useCallback(() => {
    window.clearTimeout(releaseTimer.current)
    releaseTimer.current = window.setTimeout(() => setActiveItemState(null), PILL_RELEASE_MS)
  }, [])
  React.useEffect(() => () => window.clearTimeout(releaseTimer.current), [])
  const open = openProp ?? openState
  const actionsRef = React.useRef<MenuPrimitive.Root.Actions>(null)
  const triggerRef = React.useRef<HTMLElement>(null)
  const morphPanelRef = React.useRef<HTMLElement>(null)

  const preset = React.useMemo(
    () => buildPreset({ duration, exitFast }),
    [duration, exitFast]
  )

  const close = React.useCallback(() => actionsRef.current?.close(), [])
  const onExitComplete = React.useCallback(() => actionsRef.current?.unmount(), [])

  const context = React.useMemo<DropdownMenuContextValue>(
    () => ({
      id,
      open,
      close,
      onExitComplete,
      triggerRef,
      morphPanelRef,
      preset,
      animation,
      stagger,
      delay,
      exitFast,
      itemHighlight,
      itemHighlightColor,
      selectionIndicator,
      rollingText,
      closeDelayOnSelect,
      pressFeedback,
      showDescriptions,
      bold,
      typeahead,
      activeItem,
      setActiveItem,
      releaseActiveItem,
    }),
    [
      id,
      open,
      close,
      onExitComplete,
      preset,
      animation,
      stagger,
      delay,
      exitFast,
      itemHighlight,
      itemHighlightColor,
      selectionIndicator,
      rollingText,
      closeDelayOnSelect,
      pressFeedback,
      showDescriptions,
      bold,
      typeahead,
      activeItem,
      setActiveItem,
      releaseActiveItem,
    ]
  )

  return (
    <DropdownMenuContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <MenuPrimitive.Root
          data-hpx-slot="dropdown-menu"
          open={open}
          onOpenChange={(next, details) => {
            // Keep the popup mounted so Motion can play the exit, then unmount in `onExitComplete`.
            if (!next) {
              details.preventUnmountOnClose()
              setActiveItem(null)
            }
            setOpenState(next)
            onOpenChange?.(next, details)
          }}
          actionsRef={actionsRef}
          {...props}
        >
          {children}
        </MenuPrimitive.Root>
      </MotionConfig>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-hpx-slot="dropdown-menu-portal" {...props} />
}

const TriggerContext = React.createContext({ rollingValue: true })

type PressState = "rest" | "hover" | "press"

const TRIGGER_SCALE: Record<PressState, number> = { rest: 1, hover: 0.98, press: 0.96 }

const PRESS_TIMING: Record<PressState, KeyframeAnimationOptions> = {
  rest: { duration: 400, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  hover: { duration: 250, easing: "ease-out" },
  press: { duration: 120, easing: "ease-out" },
}

function DropdownMenuTrigger({
  rollingValue = true,
  ref,
  onPointerEnter,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: MenuPrimitive.Trigger.Props & {
  /** `DropdownMenuValue` rolls to the new value when it changes. */
  rollingValue?: boolean
}) {
  const { triggerRef, morphPanelRef, pressFeedback } = useDropdownMenu()
  const pressAnimations = React.useRef<Animation[]>([])
  const pressState = React.useRef<PressState>("rest")
  const hovered = React.useRef(false)

  // Hover eases the trigger down a little, a press takes it further, and leaving springs it back.
  // Runs whether the press opens the menu or closes it.
  // Web Animations rather than a class or inline style: the trigger's CSS `transition-all`
  // would otherwise smear every frame, and this picks up from wherever the last one left off.
  const setPress = (state: PressState) => {
    const trigger = triggerRef.current
    if (!pressFeedback || !trigger || state === pressState.current) return
    pressState.current = state
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // An open morph has grown the trigger around its items, drawn by the panel on top. Both
    // share one box and one centre, so the same scale keeps them lined up.
    const targets = [trigger, morphPanelRef.current].filter((el): el is HTMLElement => !!el)
    const froms = targets.map((el) => getComputedStyle(el).transform)
    pressAnimations.current.forEach((animation) => animation.cancel())
    pressAnimations.current = targets.map((el, i) => {
      const animation = el.animate(
        [
          { transform: froms[i] === "none" ? "scale(1)" : froms[i] },
          { transform: `scale(${TRIGGER_SCALE[state]})` },
        ],
        { ...PRESS_TIMING[state], fill: "forwards" }
      )
      if (state === "rest") animation.onfinish = () => animation.cancel()
      return animation
    })
  }
  const release = () => setPress(hovered.current ? "hover" : "rest")

  return (
    <TriggerContext.Provider value={{ rollingValue }}>
      <MenuPrimitive.Trigger
        data-hpx-slot="dropdown-menu-trigger"
        ref={(node: HTMLElement | null) => {
          triggerRef.current = node
          if (typeof ref === "function") ref(node as HTMLButtonElement)
          else if (ref) ref.current = node as HTMLButtonElement
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          if (event.pointerType !== "mouse") return
          hovered.current = true
          if (pressState.current === "rest") setPress("hover")
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (event.button === 0) setPress("press")
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          release()
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          hovered.current = false
          setPress("rest")
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event)
          release()
        }}
        {...props}
      />
    </TriggerContext.Provider>
  )
}


function MorphChevron({
  open,
  duration = 0.35,
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "children"> & { open: boolean; duration?: number }) {
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? "none" : `transform ${duration}s ease-in-out`
  const half = (d: string, angle: number) => (
    <path
      d={d}
      style={{
        transformBox: "view-box",
        transformOrigin: "50px 50px",
        transform: `rotate(${angle}deg)`,
        transition,
      }}
    />
  )

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={10}
      strokeLinecap="square"
      className={cn("pointer-events-none size-4 shrink-0", className)}
      style={{ transform: open ? "translateY(-25%)" : "translateY(0%)", transition }}
      {...props}
    >
      {half("M10 50H50", open ? -42 : 42)}
      {half("M90 50H50", open ? 42 : -42)}
    </svg>
  )
}

/** Plus ↔ minus: a quick turn, eased in and out. */
const plusSpin = { duration: 0.3, ease: "easeInOut" } as const

function MorphPlus({
  open,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.svg>, "children"> & { open: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none size-5 shrink-0", className)}
      initial={false}
      animate={{ rotate: open ? 180 : 0 }}
      transition={plusSpin}
      {...props}
    >
      {/* Into a minus: the whole icon turns 180° while the vertical line turns 90° to lie
          flat. Closing plays it back. */}
      <path d="M5 12h14" />
      <motion.path
        d="M5 12h14"
        initial={false}
        animate={{ rotate: open ? 0 : 90 }}
        transition={plusSpin}
      />
    </motion.svg>
  )
}

function DropdownMenuTriggerIcon({
  icon = "plus",
  className,
}: {
  icon?: "chevron" | "plus"
  className?: string
}) {
  const { open, preset } = useDropdownMenu()

  if (icon === "chevron") {
    return (
      <MorphChevron
        data-hpx-slot="dropdown-menu-trigger-icon"
        open={open}
        duration={preset.iconDuration}
        className={cn("size-4", className)}
      />
    )
  }

  return (
    <MorphPlus
      data-hpx-slot="dropdown-menu-trigger-icon"
      open={open}
      className={cn("size-5", className)}
    />
  )
}

/** The current value shown in the trigger. Rolls to the new value when it changes. */
function DropdownMenuValue({
  className,
  children,
}: {
  className?: string
  children: string | number
}) {
  const { rollingValue } = React.useContext(TriggerContext)
  const { preset, bold } = useDropdownMenu()
  const weight = bold ? "font-semibold" : "font-normal"

  if (!rollingValue) return <span className={cn(weight, className)}>{children}</span>

  return (
    <span className={cn("relative inline-grid overflow-hidden", weight, className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={children}
          className="block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={preset.item}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function panelVariants(context: DropdownMenuContextValue, side: string): Variants {
  const { animation, preset, exitFast } = context
  const vertical = side === "top" || side === "bottom"
  const away = side === "top" || side === "left" ? "0.5em" : "-0.5em"
  let open: TargetAndTransition
  let closed: TargetAndTransition
  let enter: Transition = preset.enter
  let exit: Transition = preset.exit

  switch (animation) {
    case "scale":
      open = { opacity: 1, scale: 1 }
      closed = { opacity: 0, scale: 0.95 }
      break
    case "reveal": {
      // The clip overhangs the panel by 16px so its ring and shadow aren't cut off.
      // Fully hidden is 100% plus that overhang, written as `- -16px` so both ends share a shape.
      const shown = "calc(0% - 16px)"
      const hidden = "calc(100% - -16px)"
      const clip = (top: string, bottom: string) => `inset(${top} -16px ${bottom} -16px)`
      open = { clipPath: clip(shown, shown) }
      closed = { clipPath: side === "top" ? clip(hidden, shown) : clip(shown, hidden) }
      break
    }
    case "collapse": {
      // Matches animate-ui's collapsible: height, fade and a 20px lift, eased in and out.
      const lift = side === "top" ? -20 : 20
      open = { height: "auto", opacity: 1, y: 0 }
      closed = { height: 0, opacity: 0, y: lift }
      enter = { duration: preset.iconDuration, ease: "easeInOut" }
      exit = { duration: preset.exitDuration, ease: "easeInOut" }
      break
    }
    default: {
      const d = preset.iconDuration
      open = { opacity: 1, x: 0, y: 0 }
      closed = { opacity: 0, [vertical ? "y" : "x"]: away }
      enter = { duration: d, ease: glideEase }
      enter = { ...enter, opacity: { duration: d * 0.6, ease: "easeOut" } }
      exit = {
        duration: preset.exitDuration,
        ease: glideEase,
        opacity: { duration: preset.exitDuration * 0.8, ease: "easeIn" },
      }
    }
  }

  return {
    open: {
      ...open,
      transition: {
        ...enter,
        delayChildren: stagger(context.stagger, { startDelay: context.delay }),
      },
    },
    closed: {
      ...closed,
      // Items leave in reverse alongside the panel, so closing takes as long as opening.
      // Exit fast drops the stagger along with the shorter duration.
      transition:
        exitFast || context.stagger === 0
          ? exit
          : { ...exit, delayChildren: stagger(context.stagger, { from: "last" }) },
    },
  }
}

function itemVariants(context: DropdownMenuContextValue): Variants {
  // Items only lift on their own when staggered; otherwise they would move against the panel.
  const lift = context.stagger > 0 ? "0.3em" : "0em"
  return {
    open: { opacity: 1, y: "0em", transition: context.preset.item },
    closed: {
      opacity: 0,
      y: lift,
      transition: { duration: context.preset.exitDuration, ease: smoothEase },
    },
  }
}

const isPrintableKey = (event: React.KeyboardEvent) =>
  event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey

/** An element's bounding box with its CSS scale undone, around its centre. */
function unscaledRect(el: Element) {
  const rect = el.getBoundingClientRect()
  const transform = getComputedStyle(el).transform
  if (!transform || transform === "none") return rect
  const { a: scaleX, d: scaleY } = new DOMMatrix(transform)
  if (!scaleX || !scaleY || (scaleX === 1 && scaleY === 1)) return rect
  const width = rect.width / scaleX
  const height = rect.height / scaleY
  return new DOMRect(
    rect.x + rect.width / 2 - width / 2,
    rect.y + rect.height / 2 - height / 2,
    width,
    height
  )
}

const MORPH_ITEMS = '[data-hpx-slot="dropdown-menu-label"], [data-hpx-slot$="-item"]'

/**
 * The morph panel, animated with GSAP. The trigger itself grows: its bottom padding tweens down
 * by the height of the items, so its own border and background stretch to hold them. This panel
 * is a see-through overlay pinned to the trigger's top, clipped to the same height, and fades the
 * items up one by one. Closing plays it back and hands the trigger its original padding.
 */
function MorphPanel({
  ref,
  children,
  contentClassName,
  ...props
}: React.ComponentProps<"div"> & { contentClassName?: string }) {
  const context = useDropdownMenu()
  const reduceMotion = useReducedMotion()
  const root = React.useRef<HTMLDivElement>(null)
  const header = React.useRef<HTMLDivElement>(null)
  const timeline = React.useRef<gsap.core.Timeline | null>(null)
  /** The trigger's height and bottom padding before it grew. */
  const collapsed = React.useRef<{ height: number; padding: number } | null>(null)
  const { triggerRef, morphPanelRef } = context

  React.useLayoutEffect(
    () => () => {
      // Forget the timeline and measurements too: in development React remounts right away,
      // and the next mount must rebuild from the trigger's restored size.
      timeline.current?.kill()
      timeline.current = null
      collapsed.current = null
      if (triggerRef.current) gsap.set(triggerRef.current, { clearProps: "paddingBottom,transition" })
    },
    [triggerRef]
  )

  const play = React.useEffectEvent((open: boolean) => {
    const el = root.current
    const trigger = triggerRef.current
    if (!el || !header.current || !trigger) return
    const items = Array.from(el.querySelectorAll<HTMLElement>(MORPH_ITEMS))
    const speed = reduceMotion ? 0 : 1
    const duration = context.preset.iconDuration * speed
    // Morph always staggers its items; the Stagger setting overrides this default gap.
    const gap = (context.stagger > 0 ? context.stagger : 0.08) * speed

    if (!collapsed.current) {
      collapsed.current = {
        height: trigger.offsetHeight,
        padding: parseFloat(getComputedStyle(trigger).paddingBottom),
      }
      // The trigger's CSS `transition-all` would lag every padding frame GSAP writes.
      gsap.set(trigger, { transition: "none" })
      gsap.set(header.current, { height: collapsed.current.height })
      gsap.set(el, { height: collapsed.current.height })
      gsap.set(items, { opacity: 0, y: 8 })
    }
    const { height, padding } = collapsed.current

    // Closing plays the opening timeline backwards: the same moves in mirror order and the same
    // length, or 1 / 0.6 times faster with Exit fast.
    if (!timeline.current) {
      const grow = el.scrollHeight - height
      timeline.current = gsap
        .timeline({
          paused: true,
          onReverseComplete: () => {
            gsap.set(trigger, { clearProps: "paddingBottom,transition" })
            context.onExitComplete()
          },
        })
        .to(trigger, { paddingBottom: padding + grow, duration, ease: "none" }, 0)
        .to(el, { height: height + grow, duration, ease: "none" }, 0)
        .to(
          items,
          { opacity: 1, y: 0, duration: duration * 0.6, ease: "none", stagger: gap },
          // Items wait until the panel is mostly open, so they never land ahead of its edge.
          duration * 0.7 + context.delay * speed
        )
    }

    const tl = timeline.current
    if (open) {
      tl.timeScale(1).play()
    } else if (tl.progress() === 0) {
      tl.eventCallback("onReverseComplete")?.()
    } else {
      tl.timeScale(context.exitFast ? 1 / 0.6 : 1).reverse()
    }
  })

  React.useLayoutEffect(() => play(context.open), [context.open])

  return (
    <div
      {...props}
      ref={(node) => {
        root.current = node
        morphPanelRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
    >
      <div ref={header} aria-hidden />
      <div className={cn("pointer-events-auto mx-px border-t p-1", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  onKeyDown,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const context = useDropdownMenu()
  const morph = context.animation === "morph"
  const { triggerRef } = context
  // Position against the trigger's untransformed box, so its press scale doesn't shrink or
  // shift the panel (Floating UI measures with getBoundingClientRect, which includes transforms).
  const anchor = React.useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return null
    return { getBoundingClientRect: () => unscaledRect(trigger), contextElement: trigger }
  }, [triggerRef])
  const clipsHeight = context.animation === "collapse"

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        anchor={anchor}
        // Morph covers the trigger, so let clicks pass through to it (only the items catch them).
        className={cn("isolate z-50 outline-none", morph && "pointer-events-none")}
        align={align}
        alignOffset={alignOffset}
        side={side}
        // Morph sits on top of the trigger so the panel grows out of it.
        sideOffset={morph ? ({ anchor }) => -anchor.height : sideOffset}
      >
        <MenuPrimitive.Popup
          data-hpx-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-background p-1 text-foreground shadow-md ring-1 ring-foreground/10 outline-none",
            clipsHeight && "overflow-hidden",
            // Morph: the trigger is the container, so the popup is a bare see-through overlay.
            morph
              ? "pointer-events-none overflow-hidden rounded-none bg-transparent p-0 shadow-none ring-0"
              : className
          )}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (!context.typeahead && isPrintableKey(event)) event.preventBaseUIHandler()
          }}
          render={(popupProps, state) =>
            morph ? (
              <MorphPanel
                {...(popupProps as React.ComponentProps<"div">)}
                contentClassName={typeof className === "string" ? className : undefined}
              />
            ) : (
              <motion.div
                {...(popupProps as HTMLMotionProps<"div">)}
                initial="closed"
                animate={context.open ? "open" : "closed"}
                variants={panelVariants(context, state.side)}
                onPointerLeave={(event) => {
                  ;(popupProps as HTMLMotionProps<"div">).onPointerLeave?.(event)
                  context.releaseActiveItem()
                }}
                onAnimationComplete={(definition) => {
                  if (definition === "closed" && !context.open) context.onExitComplete()
                }}
              />
            )
          }
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-hpx-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  const context = useDropdownMenu()

  return (
    <MenuPrimitive.GroupLabel
      data-hpx-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-sm font-medium text-muted-foreground data-inset:pl-7",
        className
      )}
      render={<motion.div variants={itemVariants(context)} />}
      {...props}
    />
  )
}

/** Shared motion shell for menu items: stagger, press scale and the sliding highlight. */
function MotionItem({
  itemProps,
  highlighted,
  children,
}: {
  itemProps: React.HTMLAttributes<HTMLElement>
  highlighted: boolean
  children?: React.ReactNode
}) {
  const context = useDropdownMenu()
  const content = itemProps.children
  const itemId = React.useId()
  const { setActiveItem } = context
  // Highlighting an item (by pointer or keyboard) focuses it, so focus is where the pill moves.
  const pillHere = context.itemHighlight === "slide" && context.activeItem === itemId

  return (
    <motion.div
      {...(itemProps as HTMLMotionProps<"div">)}
      data-pill={pillHere || undefined}
      onFocus={(event) => {
        itemProps.onFocus?.(event)
        setActiveItem(itemId)
      }}
      variants={itemVariants(context)}
      // Press feedback also plays on hover: the hovered item eases down to the press scale.
      whileHover={context.pressFeedback ? { scale: ITEM_PRESS_SCALE } : undefined}
      whileTap={context.pressFeedback ? { scale: ITEM_PRESS_SCALE } : undefined}
    >
      {context.itemHighlight === "fill" && (
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            HIGHLIGHT_FILL[context.itemHighlightColor]
          )}
          style={{ originY: 0 }}
          initial={false}
          animate={{ scaleY: highlighted ? 1 : 0 }}
          transition={{ duration: 0.3, ease: easeOutCubic }}
        />
      )}
      {pillHere && (
        <motion.span
          aria-hidden
          layoutId={`${context.id}-highlight`}
          transition={context.preset.glide}
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            HIGHLIGHT_FILL[context.itemHighlightColor]
          )}
        />
      )}
      <ItemHighlightContext.Provider value={highlighted || pillHere}>
        {typeof content === "string" && context.rollingText ? <RollText>{content}</RollText> : content}
      </ItemHighlightContext.Provider>
      {children}
    </motion.div>
  )
}

const itemBase =
  "relative isolate flex cursor-default items-center gap-1.5 rounded-md text-base outline-hidden select-none hpx-disabled:pointer-events-none hpx-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** The hovered item is always primary; Motion draws the background for `slide` and `fill`. */
const HIGHLIGHT_FILL: Record<DropdownMenuHighlightColor, string> = {
  primary: "bg-primary",
  muted: "bg-muted",
}

/**
 * The hovered item's text, which has to stay readable on its fill. With `slide` it follows the
 * pill (`data-pill`) rather than focus, since the pill stays put while the pointer crosses a gap.
 */
const HIGHLIGHT_TEXT: Record<"slide" | "other", Record<DropdownMenuHighlightColor, string>> = {
  slide: {
    primary:
      "transition-colors duration-300 data-pill:text-primary-foreground data-pill:**:text-primary-foreground",
    muted: "transition-colors duration-300 data-pill:text-foreground data-pill:**:text-foreground",
  },
  other: {
    primary:
      "transition-colors duration-300 focus:text-primary-foreground focus:**:text-primary-foreground",
    muted: "transition-colors duration-300 focus:text-foreground focus:**:text-foreground",
  },
}

/** Motion draws the fill for `slide` and `fill`; `none` is a plain CSS background. */
function highlightClasses(itemHighlight: DropdownMenuHighlight, color: DropdownMenuHighlightColor) {
  return cn(
    HIGHLIGHT_TEXT[itemHighlight === "slide" ? "slide" : "other"][color],
    itemHighlight === "none"
      ? color === "primary"
        ? "focus:bg-primary"
        : "focus:bg-muted"
      : "focus:bg-transparent"
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  const { itemHighlight, itemHighlightColor } = useDropdownMenu()

  return (
    <MenuPrimitive.Item
      data-hpx-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        itemBase,
        "group/dropdown-menu-item px-1.5 py-1 data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:*:[svg]:text-destructive",
        highlightClasses(itemHighlight, itemHighlightColor),
        className
      )}
      render={(itemProps, state) => (
        <MotionItem itemProps={itemProps} highlighted={state.highlighted} />
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-hpx-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  const context = useDropdownMenu()

  return (
    <MenuPrimitive.SubmenuTrigger
      data-hpx-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        itemBase,
        "group/dropdown-menu-item px-1.5 py-1 text-sm data-inset:pl-7",
        // While its submenu is open and the pill has moved into it, keep a quiet mark here.
        "data-popup-open:not-data-pill:bg-muted",
        highlightClasses(context.itemHighlight, context.itemHighlightColor),
        className
      )}
      // Drawn by the same item as the rest, so the sliding pill glides onto it too.
      render={(itemProps, state) => (
        <MotionItem itemProps={itemProps} highlighted={state.highlighted}>
          {/* The same chevron as the menu names, turned to point at the submenu. It stays
              put: the submenu opening beside it is signal enough. */}
          <span aria-hidden className="ml-auto flex -rotate-90">
            <MorphChevron open={false} />
          </span>
        </MotionItem>
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-hpx-slot="dropdown-menu-sub-content"
          className={cn(
            "z-50 max-h-(--available-height) w-auto min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-background p-1 text-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 hpx-open:animate-in hpx-open:fade-in-0 hpx-open:zoom-in-95 hpx-closed:animate-out hpx-closed:fade-out-0 hpx-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/** A tick that draws itself in when checked and fades out when unchecked. */
function DrawnCheck({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M4 12.5 L9.5 18 L20 6.5"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={
          checked ? { duration: 0.3, ease: smoothEase } : { duration: 0.15, ease: "easeOut" }
        }
      />
    </svg>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  const context = useDropdownMenu()

  return (
    <MenuPrimitive.CheckboxItem
      data-hpx-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      data-indicator="check"
      className={cn(
        itemBase,
        // Room for the tick on the right; see the radio item for why it's keyed on an attribute.
        "py-1 pl-1.5 data-inset:pl-7 data-[indicator=check]:pr-8",
        highlightClasses(context.itemHighlight, context.itemHighlightColor),
        className
      )}
      render={(itemProps, state) => (
        <MotionItem itemProps={itemProps} highlighted={state.highlighted}>
          <span
            aria-hidden
            data-hpx-slot="dropdown-menu-checkbox-item-indicator"
            className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
          >
            <DrawnCheck checked={state.checked} />
          </span>
        </MotionItem>
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-hpx-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function RadioIndicator({ checked }: { checked: boolean }) {
  const { id, selectionIndicator, preset } = useDropdownMenu()

  if (selectionIndicator === "bar") {
    return checked ? (
      <motion.span
        aria-hidden
        layoutId={`${id}-bar`}
        transition={preset.glide}
        className="pointer-events-none absolute inset-y-2 left-2 w-0.5 rounded-full bg-current"
      />
    ) : null
  }

  return (
    <span
      aria-hidden
      data-hpx-slot="dropdown-menu-radio-item-indicator"
      className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
    >
      {selectionIndicator === "dot" ? (
        <motion.span
          className="size-1.5 rounded-full bg-current"
          initial={false}
          animate={{ scale: checked ? 1 : 0 }}
          transition={
            checked
              ? { type: "spring", visualDuration: 0.3, bounce: 0.5 }
              : { duration: 0.15, ease: "easeOut" }
          }
        />
      ) : (
        <DrawnCheck checked={checked} />
      )}
    </span>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  onClick,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  const context = useDropdownMenu()

  return (
    <MenuPrimitive.RadioItem
      data-hpx-slot="dropdown-menu-radio-item"
      data-inset={inset}
      data-indicator={context.selectionIndicator}
      closeOnClick={!context.closeDelayOnSelect}
      onClick={(event) => {
        onClick?.(event)
        if (context.closeDelayOnSelect) window.setTimeout(context.close, SELECT_CLOSE_DELAY_MS)
      }}
      className={cn(
        itemBase,
        "py-1 pl-1.5 data-inset:pl-7",
        // Room for the indicator, keyed on an attribute so it outranks a plain `px-*` passed in
        // (the menubar sizes its items that way): a bar on the left, a tick or dot on the right.
        "data-[indicator=bar]:pl-6 not-data-[indicator=bar]:pr-8",
        highlightClasses(context.itemHighlight, context.itemHighlightColor),
        className
      )}
      render={(itemProps, state) => (
        <MotionItem itemProps={itemProps} highlighted={state.highlighted}>
          <RadioIndicator checked={state.checked} />
        </MotionItem>
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.RadioItem>
  )
}

/** Text that rolls up to a copy of itself while its item is highlighted. */
function RollText({ className, children }: { className?: string; children: React.ReactNode }) {
  const highlighted = React.useContext(ItemHighlightContext)
  const transition = { duration: 0.4, ease: easeOutCubic }

  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <motion.span
        className="block"
        initial={false}
        animate={{ y: highlighted ? "-100%" : "0%" }}
        transition={transition}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 block"
        initial={false}
        animate={{ y: highlighted ? "0%" : "100%" }}
        transition={transition}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** An item's main line. Rolls on highlight when `textRoll` is on. */
function DropdownMenuItemTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { rollingText, bold } = useDropdownMenu()
  const weight = bold ? "font-medium" : "font-normal"

  if (rollingText) return <RollText className={cn(weight, className)}>{children}</RollText>
  return <span className={cn("block", weight, className)}>{children}</span>
}

/** A secondary line under an item's title. */
function DropdownMenuItemDescription({ className, ...props }: React.ComponentProps<"span">) {
  const { showDescriptions } = useDropdownMenu()
  if (!showDescriptions) return null

  return (
    <span
      data-hpx-slot="dropdown-menu-item-description"
      className={cn("block text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-hpx-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-hpx-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu as HpxDropdownMenu,
  DropdownMenuPortal as HpxDropdownMenuPortal,
  DropdownMenuTrigger as HpxDropdownMenuTrigger,
  DropdownMenuTriggerIcon as HpxDropdownMenuTriggerIcon,
  MorphChevron as HpxMorphChevron,
  MorphPlus as HpxMorphPlus,
  DrawnCheck as HpxDrawnCheck,
  DropdownMenuValue as HpxDropdownMenuValue,
  DropdownMenuContent as HpxDropdownMenuContent,
  DropdownMenuGroup as HpxDropdownMenuGroup,
  DropdownMenuLabel as HpxDropdownMenuLabel,
  DropdownMenuItem as HpxDropdownMenuItem,
  DropdownMenuItemTitle as HpxDropdownMenuItemTitle,
  DropdownMenuItemDescription as HpxDropdownMenuItemDescription,
  DropdownMenuCheckboxItem as HpxDropdownMenuCheckboxItem,
  DropdownMenuRadioGroup as HpxDropdownMenuRadioGroup,
  DropdownMenuRadioItem as HpxDropdownMenuRadioItem,
  DropdownMenuSeparator as HpxDropdownMenuSeparator,
  DropdownMenuShortcut as HpxDropdownMenuShortcut,
  DropdownMenuSub as HpxDropdownMenuSub,
  DropdownMenuSubTrigger as HpxDropdownMenuSubTrigger,
  DropdownMenuSubContent as HpxDropdownMenuSubContent,
  // For components built on the menu, like the menubar.
  useDropdownMenu as useHpxDropdownMenu,
  panelVariants as hpxPanelVariants,
  itemVariants as hpxItemVariants,
  unscaledRect as hpxUnscaledRect,
}
export type {
  DropdownMenuAnimation as HpxDropdownMenuAnimation,
  DropdownMenuHighlight as HpxDropdownMenuHighlight,
  DropdownMenuHighlightColor as HpxDropdownMenuHighlightColor,
  DropdownMenuIndicator as HpxDropdownMenuIndicator,
}
