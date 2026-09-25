"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "cn"
import gsap from "gsap"
import { ChevronRightIcon, CheckIcon } from "lucide-react"
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
const easeInOutSine = [0.37, 0, 0.63, 1] as const
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
    glide: { duration: 0.3, ease: smoothEase },
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
  highlight: DropdownMenuHighlight
  indicator: DropdownMenuIndicator
  textRoll: boolean
  delayCloseOnSelect: boolean
  pressFeedback: boolean
  descriptions: boolean
  bold: boolean
  typeahead: boolean
}

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
  highlight = "slide",
  indicator = "check",
  textRoll = false,
  delayCloseOnSelect = false,
  pressFeedback = true,
  descriptions = false,
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
  highlight?: DropdownMenuHighlight
  /** How the chosen radio item is marked. */
  indicator?: DropdownMenuIndicator
  /** Item titles roll to a copy of themselves when highlighted. */
  textRoll?: boolean
  /** Show the tick for a moment after a pick before closing. */
  delayCloseOnSelect?: boolean
  /** The trigger and items scale down while pressed and spring back on release. */
  pressFeedback?: boolean
  /** Show each item's `DropdownMenuItemDescription`. */
  descriptions?: boolean
  /** Bold item titles and the trigger value. */
  bold?: boolean
  /** Typing a letter jumps to the matching item. */
  typeahead?: boolean
}) {
  const id = React.useId()
  const [openState, setOpenState] = React.useState(defaultOpen)
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
      highlight,
      indicator,
      textRoll,
      delayCloseOnSelect,
      pressFeedback,
      descriptions,
      bold,
      typeahead,
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
      highlight,
      indicator,
      textRoll,
      delayCloseOnSelect,
      pressFeedback,
      descriptions,
      bold,
      typeahead,
    ]
  )

  return (
    <DropdownMenuContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <MenuPrimitive.Root
          data-slot="dropdown-menu"
          open={open}
          onOpenChange={(next, details) => {
            // Keep the popup mounted so Motion can play the exit, then unmount in `onExitComplete`.
            if (!next) details.preventUnmountOnClose()
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
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

const TriggerContext = React.createContext({ animateValue: true })

function DropdownMenuTrigger({
  animateValue = true,
  ref,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: MenuPrimitive.Trigger.Props & {
  /** `DropdownMenuValue` rolls to the new value when it changes. */
  animateValue?: boolean
}) {
  const { triggerRef, morphPanelRef, pressFeedback } = useDropdownMenu()
  const pressAnimations = React.useRef<Animation[]>([])
  const pressed = React.useRef(false)

  // Runs on every press and release, whether the press opens the menu or closes it.
  // Web Animations rather than a class or inline style: the trigger's CSS `transition-all`
  // would otherwise smear every frame, and this picks up from wherever the last press left off.
  const press = (down: boolean) => {
    const trigger = triggerRef.current
    if (!pressFeedback || !trigger || down === pressed.current) return
    pressed.current = down
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
          { transform: down ? "scale(0.96)" : "scale(1)" },
        ],
        down
          ? { duration: 120, easing: "ease-out", fill: "forwards" }
          : { duration: 400, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "forwards" }
      )
      if (!down) animation.onfinish = () => animation.cancel()
      return animation
    })
  }

  return (
    <TriggerContext.Provider value={{ animateValue }}>
      <MenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        ref={(node: HTMLElement | null) => {
          triggerRef.current = node
          if (typeof ref === "function") ref(node as HTMLButtonElement)
          else if (ref) ref.current = node as HTMLButtonElement
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (event.button === 0) press(true)
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          press(false)
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          press(false)
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event)
          press(false)
        }}
        {...props}
      />
    </TriggerContext.Provider>
  )
}

const chevronPaths = {
  closed: ["M7 9 L12 4 L17 9", "M7 15 L12 20 L17 15"],
  open: ["M7 4 L12 9 L17 4", "M7 20 L12 15 L17 20"],
}

function DropdownMenuTriggerIcon({
  icon = "plus",
  className,
}: {
  icon?: "chevrons" | "chevron" | "plus"
  className?: string
}) {
  const { open, preset } = useDropdownMenu()
  const paths = open ? chevronPaths.open : chevronPaths.closed
  // A full turn needs more time than the panel to read smoothly, with a soft sine-like in-out.
  const spin = { duration: Math.max(preset.iconDuration * 1.6, 0.5), ease: easeInOutSine }

  return (
    <motion.svg
      data-slot="dropdown-menu-trigger-icon"
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none size-5 shrink-0", className)}
      initial={false}
      animate={{ rotate: icon === "chevron" && open ? 180 : 0 }}
      transition={preset.icon}
    >
      {icon === "chevrons" &&
        paths.map((d, i) => (
          <motion.path key={i} initial={false} animate={{ d }} transition={preset.icon} />
        ))}
      {icon === "chevron" && <path d="M6 9 L12 15 L18 9" />}
      {icon === "plus" && (
        <>
          {/* Together into a minus: the horizontal line spins a full turn while the vertical
              one turns a quarter to lie flat. Closing plays it back. */}
          <motion.path
            d="M5 12h14"
            initial={false}
            animate={{ rotate: open ? 360 : 0 }}
            transition={spin}
          />
          <motion.path
            d="M5 12h14"
            initial={false}
            animate={{ rotate: open ? 180 : 90 }}
            transition={spin}
          />
        </>
      )}
    </motion.svg>
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
  const { animateValue } = React.useContext(TriggerContext)
  const { preset, bold } = useDropdownMenu()
  const weight = bold ? "font-semibold" : "font-normal"

  if (!animateValue) return <span className={cn(weight, className)}>{children}</span>

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

const MORPH_ITEMS = '[data-slot="dropdown-menu-label"], [data-slot$="-item"]'

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
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none",
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
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
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
      data-slot="dropdown-menu-label"
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

  return (
    <motion.div
      {...(itemProps as HTMLMotionProps<"div">)}
      variants={itemVariants(context)}
      whileTap={context.pressFeedback ? { scale: ITEM_PRESS_SCALE } : undefined}
    >
      {context.highlight === "fill" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-primary"
          style={{ originY: 0 }}
          initial={false}
          animate={{ scaleY: highlighted ? 1 : 0 }}
          transition={{ duration: 0.3, ease: easeOutCubic }}
        />
      )}
      {context.highlight === "slide" && highlighted && (
        <motion.span
          aria-hidden
          layoutId={`${context.id}-highlight`}
          transition={context.preset.glide}
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-primary"
        />
      )}
      <ItemHighlightContext.Provider value={highlighted}>
        {typeof content === "string" && context.textRoll ? <RollText>{content}</RollText> : content}
      </ItemHighlightContext.Provider>
      {children}
    </motion.div>
  )
}

const itemBase =
  "relative isolate flex cursor-default items-center gap-1.5 rounded-md text-base outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** The hovered item is always primary; Motion draws the background for `slide` and `fill`. */
const primaryText =
  "transition-colors duration-300 focus:text-primary-foreground focus:**:text-primary-foreground"

const highlightClasses: Record<DropdownMenuHighlight, string> = {
  slide: cn(primaryText, "focus:bg-transparent"),
  fill: cn(primaryText, "focus:bg-transparent"),
  none: cn(primaryText, "focus:bg-primary"),
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
  const { highlight } = useDropdownMenu()

  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        itemBase,
        "group/dropdown-menu-item px-1.5 py-1 focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:*:[svg]:text-destructive",
        highlightClasses[highlight],
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
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
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
          data-slot="dropdown-menu-sub-content"
          className={cn(
            "z-50 max-h-(--available-height) w-auto min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function RadioIndicator({ checked }: { checked: boolean }) {
  const { id, indicator, preset } = useDropdownMenu()

  if (indicator === "bar") {
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
      data-slot="dropdown-menu-radio-item-indicator"
      className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
    >
      {indicator === "dot" ? (
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
              checked
                ? { duration: 0.3, ease: smoothEase }
                : { duration: 0.15, ease: "easeOut" }
            }
          />
        </svg>
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
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      closeOnClick={!context.delayCloseOnSelect}
      onClick={(event) => {
        onClick?.(event)
        if (context.delayCloseOnSelect) window.setTimeout(context.close, SELECT_CLOSE_DELAY_MS)
      }}
      className={cn(
        itemBase,
        "py-1 pr-8 pl-1.5 focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7",
        context.indicator === "bar" && "px-4",
        highlightClasses[context.highlight],
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
  const { textRoll, bold } = useDropdownMenu()
  const weight = bold ? "font-medium" : "font-normal"

  if (textRoll) return <RollText className={cn(weight, className)}>{children}</RollText>
  return <span className={cn("block", weight, className)}>{children}</span>
}

/** A secondary line under an item's title. */
function DropdownMenuItemDescription({ className, ...props }: React.ComponentProps<"span">) {
  const { descriptions } = useDropdownMenu()
  if (!descriptions) return null

  return (
    <span
      data-slot="dropdown-menu-item-description"
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
      data-slot="dropdown-menu-separator"
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
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuTriggerIcon,
  DropdownMenuValue,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuItemDescription,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
