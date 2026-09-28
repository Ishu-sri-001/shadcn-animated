"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar"
import { cn } from "cn"
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
  type TargetAndTransition,
  type Variants,
} from "motion/react"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DrawnCheck,
  MorphChevron,
  itemVariants,
  panelVariants,
  unscaledRect,
  useDropdownMenu,
  type DropdownMenuHighlight,
  type DropdownMenuHighlightColor,
  type DropdownMenuIndicator,
} from "@/components/ui/dropdown-menu"


type MenubarAnimation = "collapse" | "scale" | "slide" | "reveal"
type MenubarSwitch = "glide" | "replay"
type MenubarTriggerHighlight = "pill" | "underline" | "none"
type MenubarRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl"

type MenubarMotion = {
  /** How a panel opens and closes. */
  animation: MenubarAnimation
  /**
   * What happens when you move to another menu while one is open: `glide` slides one panel
   * along to the new menu, resizing as it goes; `replay` plays the new menu's full opening, as
   * if it had been opened from closed.
   */
  switchAnimation: MenubarSwitch
  /** Open duration, in seconds. */
  duration: number
  /** Gap between items appearing, in seconds. */
  stagger: number
  /** Wait before items start appearing, in seconds. */
  delay: number
  /** Close in 60% of the open time, without staggering items out. */
  exitFast: boolean
  /** The marker on the open or hovered menu name, which glides between names. */
  triggerHighlight: MenubarTriggerHighlight
  /** The fill behind the open or hovered menu name. */
  triggerHighlightColor: DropdownMenuHighlightColor
  /** How the hovered item is highlighted inside a panel. */
  itemHighlight: DropdownMenuHighlight
  /** The fill behind the hovered item inside a panel. */
  itemHighlightColor: DropdownMenuHighlightColor
  /** How the chosen radio item is marked. */
  indicator: DropdownMenuIndicator
  /** Item titles roll to a copy of themselves when highlighted. */
  textRoll: boolean
  /** Menu names roll to a copy of themselves when hovered or open. */
  triggerTextRoll: boolean
  /** Menu names and items scale down while pressed. */
  pressFeedback: boolean
  /**
   * How a menu's contents come in when you move over from another menu: `slide` shifts them in
   * from the side you came from as they fade in, `fade` only fades them in, `none` shows them at once.
   */
  contentSwitch: MenubarContentSwitch
  /** How far contents slide: sm = 24px, md = 48px, lg = 75px (default). */
  contentShift: MenubarContentShift
  /** Show a chevron on each menu name that turns as its menu opens. */
  chevrons: boolean
  /** Show each item's icon. */
  icons: boolean
  /** Show each item's `MenubarItemDescription`. */
  descriptions: boolean
  /** How big the bar and its panels are. */
  size: MenubarSize
  rounded: MenubarRounded
}

type MenubarSize = "sm" | "md" | "lg"
type MenubarContentSwitch = "slide" | "fade" | "none"
type MenubarContentShift = "sm" | "md" | "lg"

const CONTENT_SHIFT: Record<MenubarContentShift, number> = {
  sm: 24,
  md: 48,
  lg: 75,
}

/** No fixed height: the padding alone sets the gap, so it matches on all four sides. */
const BAR_SIZE: Record<MenubarSize, string> = {
  sm: "gap-0.5 p-1",
  md: "gap-1 p-1.5",
  lg: "gap-1.5 p-2",
}

const TRIGGER_SIZE: Record<MenubarSize, string> = {
  sm: "px-2.5 py-1 text-sm",
  md: "px-3.5 py-1.5 text-base",
  lg: "px-4 py-2 text-lg",
}

const PANEL_SIZE: Record<MenubarSize, string> = {
  sm: "min-w-48 p-1",
  md: "min-w-56 p-1.5",
  lg: "min-w-64 p-2",
}

const PANEL_ITEM_SIZE: Record<MenubarSize, string> = {
  sm: "px-1.5 py-1 text-sm",
  md: "px-2 py-1.5 text-base",
  lg: "px-2.5 py-2 text-base",
}

const BAR_ROUNDED: Record<MenubarRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
}

/** Menu names and items sit one step inside the bar and panel, so the corners nest. */
const INNER_ROUNDED: Record<MenubarRounded, string> = {
  none: "rounded-none",
  sm: "rounded-xs",
  md: "rounded-sm",
  lg: "rounded-md",
  xl: "rounded-lg",
  "2xl": "rounded-xl",
}

const ITEM_ROUNDED: Record<MenubarRounded, string> = {
  none: "**:data-[slot$=-item]:rounded-none",
  sm: "**:data-[slot$=-item]:rounded-xs",
  md: "**:data-[slot$=-item]:rounded-sm",
  lg: "**:data-[slot$=-item]:rounded-md",
  xl: "**:data-[slot$=-item]:rounded-lg",
  "2xl": "**:data-[slot$=-item]:rounded-xl",
}

/** A panel's size and where its left edge sits on screen. */
type PanelBox = { width: number; height: number; left: number; el: HTMLElement }

type MenubarContextValue = {
  id: string
  motion: MenubarMotion
  /** The open menu, if any. */
  active: string | null
  /** Which way the last switch went: -1 left, 1 right. */
  direction: number
  /** The open menu was reached by moving over from another one. */
  switched: boolean
  /** The menu name the trigger highlight sits on; it stays put (hidden) when nothing is lit. */
  highlightOn: string | null
  highlightVisible: boolean
  setHovered: (menu: string | null) => void
  onMenuOpenChange: (menu: string, open: boolean) => void
  /**
   * The direction a menu was reached from, set synchronously as it opens. A panel's first
   * render happens before `direction` state has landed, so its entrance reads this instead.
   */
  entryDirection: React.RefObject<Map<string, number>>
  /**
   * Measures the current panel where it is right now — mid-glide included — so the next one
   * starts exactly there. A size recorded when a panel opened would be stale by the time you
   * sweep on to the next menu, and the box would jump.
   */
  getPanelBox: () => PanelBox | null
  /** Registers the panel surface currently showing, or clears it if it is still this one. */
  setPanelSurface: (el: HTMLElement | null, current?: HTMLElement) => void
}

const MenubarContext = React.createContext<MenubarContextValue | null>(null)

function useMenubar() {
  const context = React.useContext(MenubarContext)
  if (!context) throw new Error("Menubar parts must be used inside <Menubar>.")
  return context
}

/** The id of the menu a part sits in. */
const MenubarMenuContext = React.createContext("")

/** A close followed this soon by an open counts as moving from one menu to the next. */
const SWITCH_WINDOW_MS = 100

function Menubar({
  animation = "collapse",
  switchAnimation = "glide",
  duration = 0.3,
  stagger = 0.03,
  delay = 0.05,
  exitFast = true,
  triggerHighlight = "pill",
  triggerHighlightColor = "primary",
  itemHighlight = "slide",
  itemHighlightColor = "primary",
  indicator = "check",
  textRoll = false,
  triggerTextRoll = true,
  pressFeedback = true,
  contentSwitch = "slide",
  contentShift = "lg",
  chevrons = true,
  icons = true,
  descriptions = false,
  size = "md",
  rounded = "lg",
  className,
  children,
  ...props
}: MenubarPrimitive.Props & Partial<MenubarMotion>) {
  const id = React.useId()
  const root = React.useRef<HTMLDivElement>(null)
  const activeRef = React.useRef<string | null>(null)
  const lastClosed = React.useRef<{ menu: string; at: number } | null>(null)
  const entryDirection = React.useRef(new Map<string, number>())
  const panelSurface = React.useRef<HTMLElement | null>(null)
  const getPanelBox = React.useCallback((): PanelBox | null => {
    const el = panelSurface.current
    if (!el?.isConnected) return null
    const r = el.getBoundingClientRect()
    return { width: r.width, height: r.height, left: r.left, el }
  }, [])
  const setPanelSurface = React.useCallback((el: HTMLElement | null, current?: HTMLElement) => {
    // A closing panel only clears the record if a newer one hasn't already taken it.
    if (el === null && current && panelSurface.current !== current) return
    panelSurface.current = el
  }, [])
  const [open, setOpen] = React.useState({ active: null as string | null, direction: 0, switched: false })
  const [hovered, setHovered] = React.useState<string | null>(null)

  // Where the trigger highlight sits. It stays on the last lit name while hidden, so the next
  // one glides over from there instead of popping in.
  const lit = open.active ?? hovered
  const [highlightOn, setHighlightOn] = React.useState<string | null>(null)
  if (lit && lit !== highlightOn) setHighlightOn(lit)

  const onMenuOpenChange = React.useCallback((menu: string, isOpen: boolean) => {
    if (!isOpen) {
      lastClosed.current = { menu, at: performance.now() }
      if (activeRef.current === menu) {
        activeRef.current = null
        setOpen((prev) => ({ ...prev, active: null }))
      }
      return
    }

    // Base UI may close the old menu before or after opening the new one.
    const recent = lastClosed.current
    const from =
      activeRef.current ??
      (recent && performance.now() - recent.at < SWITCH_WINDOW_MS ? recent.menu : null)
    activeRef.current = menu

    const menus = Array.from(root.current?.querySelectorAll("[data-menubar-menu]") ?? []).map(
      (el) => el.getAttribute("data-menubar-menu")
    )
    const direction = from && from !== menu ? Math.sign(menus.indexOf(menu) - menus.indexOf(from)) : 0
    // Recorded before the state update, so the panel mounting this same tick can read it.
    entryDirection.current.set(menu, direction)
    setOpen({ active: menu, direction, switched: direction !== 0 })
  }, [])

  const context = React.useMemo<MenubarContextValue>(
    () => ({
      id,
      active: open.active,
      direction: open.direction,
      switched: open.switched,
      highlightOn,
      highlightVisible: lit !== null,
      setHovered,
      onMenuOpenChange,
      entryDirection,
      getPanelBox,
      setPanelSurface,
      motion: {
        animation,
        switchAnimation,
        duration,
        stagger,
        delay,
        exitFast,
        triggerHighlight,
        triggerHighlightColor,
        itemHighlight,
        itemHighlightColor,
        indicator,
        textRoll,
        triggerTextRoll,
        pressFeedback,
        contentSwitch,
        contentShift,
        chevrons,
        icons,
        descriptions,
        size,
        rounded,
      },
    }),
    [
      id,
      open,
      highlightOn,
      lit,
      onMenuOpenChange,
      getPanelBox,
      setPanelSurface,
      animation,
      switchAnimation,
      duration,
      stagger,
      delay,
      exitFast,
      triggerHighlight,
      triggerHighlightColor,
      itemHighlight,
      itemHighlightColor,
      indicator,
      textRoll,
      triggerTextRoll,
      pressFeedback,
      contentSwitch,
      contentShift,
      chevrons,
      icons,
      descriptions,
      size,
      rounded,
    ]
  )

  return (
    <MenubarContext.Provider value={context}>
      <MenubarPrimitive
        ref={root}
        data-slot="menubar"
        className={cn(
          // The bar is for desktop; tablets and phones get the hamburger below instead.
          "flex items-center border bg-background max-[1025px]:hidden",
          BAR_SIZE[size],
          BAR_ROUNDED[rounded],
          className
        )}
        {...props}
      >
        {children as React.ReactNode}
      </MenubarPrimitive>
      <MobileMenubar>{children as React.ReactNode}</MobileMenubar>
    </MenubarContext.Provider>
  )
}

function DesktopMenubarMenu({ onOpenChange, ...props }: React.ComponentProps<typeof DropdownMenu>) {
  const { motion: options, onMenuOpenChange } = useMenubar()
  const menu = React.useId()

  return (
    <MenubarMenuContext.Provider value={menu}>
      <DropdownMenu
        data-slot="menubar-menu"
        animation={options.animation}
        duration={options.duration}
        stagger={options.stagger}
        delay={options.delay}
        exitFast={options.exitFast}
        highlight={options.itemHighlight}
        highlightColor={options.itemHighlightColor}
        indicator={options.indicator}
        textRoll={options.textRoll}
        pressFeedback={options.pressFeedback}
        onOpenChange={(open, details) => {
          onMenuOpenChange(menu, open)
          onOpenChange?.(open, details)
        }}
        {...props}
      />
    </MenubarMenuContext.Provider>
  )
}

function DesktopMenubarGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />
}

const TRIGGER_FILL: Record<DropdownMenuHighlightColor, string> = {
  primary: "bg-primary",
  muted: "bg-muted",
}

/** A menu name that rolls up to a copy of itself while its menu is lit. */
function TriggerRollText({ lit, children }: { lit: boolean; children: React.ReactNode }) {
  const transition = { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const }

  return (
    <span className="relative block overflow-hidden">
      <motion.span
        className="block"
        initial={false}
        animate={{ y: lit ? "-100%" : "0%" }}
        transition={transition}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 block"
        initial={false}
        animate={{ y: lit ? "0%" : "100%" }}
        transition={transition}
      >
        {children}
      </motion.span>
    </span>
  )
}

function DesktopMenubarTrigger({
  className,
  children,
  chevron,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger> & {
  /** Show a chevron that turns as the menu opens. Defaults to the bar's `chevrons` setting. */
  chevron?: boolean
}) {
  const { id, motion: options, active, highlightOn, highlightVisible, setHovered } = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const marker = options.triggerHighlight
  const leave = () => setHovered(null)
  const showChevron = chevron ?? options.chevrons
  const open = active === menu
  const lit = highlightOn === menu && highlightVisible

  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      data-menubar-menu={menu}
      className={cn(
        "relative isolate flex items-center font-medium transition-colors outline-hidden select-none",
        TRIGGER_SIZE[options.size],
        INNER_ROUNDED[options.rounded],
        // A primary pill is dark, so the name and its chevron invert while it sits underneath.
        marker === "pill" &&
          options.triggerHighlightColor === "primary" &&
          lit &&
          "text-primary-foreground **:data-[slot=menubar-trigger-icon]:text-primary-foreground/70",
        className
      )}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.pointerType === "mouse") setHovered(menu)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        leave()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (event.currentTarget.matches(":focus-visible")) setHovered(menu)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        leave()
      }}
      {...props}
    >
      {options.triggerTextRoll && typeof children === "string" ? (
        <TriggerRollText lit={lit}>{children}</TriggerRollText>
      ) : (
        children
      )}
      {showChevron && (
        // The same morphing chevron the dropdown trigger uses: its two halves swing to point
        // the other way as the menu opens.
        <MorphChevron
          data-slot="menubar-trigger-icon"
          open={open}
          duration={options.duration}
          className="ml-1 size-3 text-muted-foreground"
        />
      )}
      {marker !== "none" && highlightOn === menu && (
        <motion.span
          aria-hidden
          layoutId={`${id}-trigger-highlight`}
          className={cn(
            "pointer-events-none absolute -z-10",
            marker === "pill"
              ? cn("inset-0 rounded-[inherit]", TRIGGER_FILL[options.triggerHighlightColor])
              : cn(
                  // Hangs a little below the name so the line doesn't crowd the letters.
                  "inset-x-2.5 -bottom-1.5 h-0.5 rounded-full",
                  // A muted underline would all but vanish, so it takes the muted text colour.
                  options.triggerHighlightColor === "primary"
                    ? "bg-primary"
                    : "bg-muted-foreground"
                )
          )}
          initial={false}
          animate={{ opacity: highlightVisible ? 1 : 0 }}
          transition={{
            layout: { type: "spring", visualDuration: 0.3, bounce: 0.15 },
            opacity: { duration: 0.2, ease: "easeOut" },
          }}
        />
      )}
    </DropdownMenuTrigger>
  )
}

/** Drops `transition` from a variant, leaving just its values. */
function targetOf(variant: Variants[string]) {
  if (typeof variant !== "object") return {}
  const target = { ...(variant as TargetAndTransition) }
  delete target.transition
  return target
}

/**
 * The panel's contents. Its height tweens between menus, so a tall menu shrinking to a short
 * one glides instead of snapping, and the items shift in the direction you moved.
 */
function MenubarPanelBody({
  surface,
  restLeft,
  children,
}: {
  /** The panel's background, ring, shadow and padding, worn by the box that travels. */
  surface: string
  /** Where the panel's left edge rests on screen. */
  restLeft: () => number
  children: React.ReactNode
}) {
  const { motion: options, entryDirection } = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const reduceMotion = useReducedMotion()
  // Read once on mount, from the ref rather than state: the panel's first render happens
  // before the direction state has landed, so the state would still hold the old value.
  const [from] = React.useState(() => entryDirection.current.get(menu) ?? 0)

  if (reduceMotion) return <>{children}</>

  // Only contents reached from a neighbouring menu animate; a menu opened from closed plays
  // the panel's own opening instead.
  const entrance =
    from === 0 || options.switchAnimation !== "glide" || options.contentSwitch === "none"
      ? false
      : options.contentSwitch === "slide"
        ? // Offset the way you came from, sliding to rest, so the contents read as shifting
          // across inside one panel.
          { opacity: 0, x: from * CONTENT_SHIFT[options.contentShift] }
        : { opacity: 0, x: 0 }

  const body = (
    <motion.div
      initial={entrance}
      animate={{ opacity: 1, x: 0 }}
      // The same tween as the box and the outgoing contents, so all three move as one.
      transition={GLIDE}
    >
      {children}
    </motion.div>
  )

  // Only a travelling panel gets the moving box; otherwise the popup is the surface.
  if (!surface) return body

  return (
    <MorphBox surface={surface} restLeft={restLeft}>
      {body}
    </MorphBox>
  )
}

/**
 * The panel surface that travels between menus. Separate menus render separate popups in their
 * own portals, so Motion's shared-layout morph can't reach across them. Instead, a panel reached
 * from a neighbour starts exactly where and how big the last one was, then glides sideways under
 * its own menu name while it resizes, so the two read as one box moving along the bar.
 */
function MorphBox({
  surface,
  restLeft,
  children,
}: {
  surface: string
  restLeft: () => number
  children: React.ReactNode
}) {
  const { getPanelBox, setPanelSurface, entryDirection, motion: options } = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const node = React.useRef<HTMLDivElement>(null)
  /** Captured once per mount; see the effect. */
  const start = React.useRef<PanelBox | null | undefined>(undefined)

  React.useLayoutEffect(() => {
    const el = node.current
    if (!el) return
    // Captured once per mount: React's development double-run would otherwise measure this
    // panel itself as the "previous" one. Only a panel reached by moving over from a neighbour
    // glides; one opened from closed keeps its own entrance.
    if (start.current === undefined) {
      start.current = (entryDirection.current.get(menu) ?? 0) !== 0 ? getPanelBox() : null
    }
    const from = start.current
    // How big this panel rests, measured before anything moves it. Its left edge comes from its
    // menu name: when this runs, the popup hasn't been positioned yet and still sits at 0.
    const rest = el.getBoundingClientRect()
    const left = restLeft()
    setPanelSurface(el)

    if (!from) return () => setPanelSurface(null, el)

    const dx = from.left - left
    const clear = () => {
      el.style.width = ""
      el.style.height = ""
      el.style.transform = ""
    }
    // One spring value drives width, height and position together, written straight to the
    // element on every frame. Handing them to Motion's element animation let it paint its own
    // first frame over this start, which flashed the box at its destination for a frame.
    const apply = (t: number) => {
      el.style.width = `${from.width + (rest.width - from.width) * t}px`
      el.style.height = `${from.height + (rest.height - from.height) * t}px`
      el.style.transform = `translateX(${dx * (1 - t)}px)`
    }
    // In place before the first paint, where and as big as the last panel was.
    apply(0)
    const ghost = slideOutPrevious(el, from.el, entryDirection.current.get(menu) ?? 0, options)
    const animation = animate(0, 1, { ...GLIDE, onUpdate: apply })
    // Hand the box back to the layout once it lands, so later content can resize it.
    animation.then(clear)
    return () => {
      animation.stop()
      ghost?.remove()
      // Back to its natural box, so a re-run (React's development double-run) measures where
      // the panel really rests rather than the start it was just given.
      clear()
      setPanelSurface(null, el)
    }
    // Settings are read as the panel mounts, like the rest of the glide; a change applies to the
    // next switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPanelBox, setPanelSurface, entryDirection, menu, restLeft])

  return (
    <div
      ref={node}
      data-slot="menubar-surface"
      className={cn("relative max-h-(--available-height) overflow-hidden", surface)}
    >
      {/* Stretches to the box while it resizes, so right-aligned ticks and shortcuts ride
          the moving edge instead of bunching up against the text. */}
      <div data-slot="menubar-surface-content" className="w-max min-w-full">
        {children}
      </div>
    </div>
  )
}

/**
 * The glide between menus, matched to directional-menu (hyperiux-pro-components): short
 * `power2.out` tweens rather than a spring. The box, the incoming contents and the outgoing
 * contents all share it, so they move as one. `[0.25, 0.46, 0.45, 0.94]` is power2.out
 * (ease-out quad) as a cubic-bezier.
 */
const GLIDE = { duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] } as const

/**
 * Copies the outgoing panel's contents into the incoming box and slides them out the opposite
 * way while the new contents slide in, as directional-menu does. It keeps both in one container;
 * here each menu is its own popup, so the old contents are copied across rather than moved.
 * The copy is visual only: hidden from assistive tech, inert, and removed when it finishes.
 */
function slideOutPrevious(
  box: HTMLElement,
  previous: HTMLElement,
  direction: number,
  options: Pick<MenubarMotion, "contentSwitch" | "contentShift">
) {
  if (options.contentSwitch === "none" || direction === 0) return null
  const source = previous.querySelector<HTMLElement>(":scope > [data-slot=menubar-surface-content]")
  if (!source) return null

  // Pinned where the contents sat inside the old box, measured from its padding edge.
  const boxRect = previous.getBoundingClientRect()
  const sourceRect = source.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLElement
  ghost.removeAttribute("data-slot")
  ghost.setAttribute("aria-hidden", "true")
  ghost.inert = true
  Object.assign(ghost.style, {
    position: "absolute",
    top: `${sourceRect.top - boxRect.top}px`,
    left: `${sourceRect.left - boxRect.left}px`,
    width: `${sourceRect.width}px`,
    pointerEvents: "none",
  })
  box.prepend(ghost)

  const x = options.contentSwitch === "slide" ? -direction * CONTENT_SHIFT[options.contentShift] : 0
  const animation = animate(ghost, { x: [0, x], opacity: [1, 0] }, GLIDE)
  animation.then(() => ghost.remove())
  return ghost
}

/** How far the collapse clip reaches past the panel, so its ring and shadow stay whole. */
const CLIP_OVERHANG = "16px"

/**
 * Collapse, for a travelling panel. The usual collapse animates the popup's height behind
 * `overflow: hidden`, but here the ring and shadow sit on the surface inside the popup, and a
 * ring draws just outside its element, so that clip would cut it on every side. This keeps the
 * same lift and fade, and reveals the panel with a `clip-path` that overhangs its edges instead.
 */
function clipCollapse(base: Variants, side: string): Variants {
  const o = CLIP_OVERHANG
  // Written as `calc`s of one shape at both ends, so Motion can interpolate between them.
  const shown = `calc(0% - ${o})`
  const hidden = `calc(100% + ${o})`
  const clip = (top: string, bottom: string) => `inset(${top} -${o} ${bottom} -${o})`
  const swap = (variant: Variants[string], clipPath: string) => {
    const next = { ...(variant as TargetAndTransition), clipPath }
    delete next.height
    return next
  }
  return {
    open: swap(base.open, clip(shown, shown)),
    // Closes toward the menu name: up into the bar below it, down into the bar above it.
    closed: swap(base.closed, side === "top" ? clip(hidden, shown) : clip(shown, hidden)),
  }
}

function DesktopMenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  side = "bottom",
  sideOffset = 8,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const dropdown = useDropdownMenu()
  const menubar = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const { triggerRef } = dropdown
  const options = menubar.motion

  // Position against the trigger's unscaled box, so its press scale doesn't shift the panel.
  const anchor = React.useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return null
    return { getBoundingClientRect: () => unscaledRect(trigger), contextElement: trigger }
  }, [triggerRef])
  // Aligned to the start of its menu name, so that is where the panel's left edge rests.
  const restLeft = React.useCallback(() => {
    const trigger = triggerRef.current
    const offset = typeof alignOffset === "number" ? alignOffset : 0
    return trigger ? unscaledRect(trigger).left + offset : 0
  }, [triggerRef, alignOffset])

  // Glide: the box itself travels between menus, and the outgoing panel gets out of the way.
  // Replay: every menu plays its full opening, as if opened from closed.
  const glide = options.switchAnimation === "glide"
  // Arrived from a neighbouring menu, or leaving for one.
  const switchedIn = glide && menubar.switched && menubar.active === menu
  const switchedOut =
    glide && menubar.switched && menubar.active !== null && menubar.active !== menu
  const surface = cn(
    "bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
    PANEL_SIZE[options.size],
    BAR_ROUNDED[options.rounded]
  )

  const variantsFor = (panelSide: string): Variants => {
    const base = panelVariants(dropdown, panelSide)
    if (!glide) return base
    const panel = options.animation === "collapse" ? clipCollapse(base, panelSide) : base
    return {
      open: panel.open,
      // Gone at once: the incoming panel starts in this one's place and size, so it reads as
      // this box moving on rather than two panels crossing.
      closed: switchedOut ? { opacity: 0, transition: { duration: 0 } } : panel.closed,
    }
  }

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        anchor={anchor}
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menubar-content"
          className={cn(
            "z-50 w-max origin-(--transform-origin) outline-none",
            // Gliding, the surface lives on the box inside; otherwise on the popup itself.
            !glide &&
              cn(
                "max-h-(--available-height) overflow-x-hidden overflow-y-auto",
                surface
              ),
            // A little air between items, so they read as separate rows.
            "**:data-[slot=menubar-group]:flex **:data-[slot=menubar-group]:flex-col **:data-[slot=menubar-group]:gap-0.5",
            // Travelling, collapse clips with `clip-path` instead (see `clipCollapse`).
            options.animation === "collapse" && !glide && "overflow-hidden",
            ITEM_ROUNDED[options.rounded],
            className
          )}
          render={(popupProps, state) => {
            const variants = variantsFor(state.side)
            const { children: popupChildren, ...rest } = popupProps as HTMLMotionProps<"div">
            return (
              <motion.div
                {...rest}
                // Arriving from a neighbour: start where the panel will rest, shifted back the
                // way you came, with the items already in place.
                // Arriving from a neighbour: already open, in the last panel's place; the box
                // does the moving.
                initial={switchedIn ? targetOf(variants.open) : "closed"}
                animate={dropdown.open ? "open" : "closed"}
                variants={variants}
                onPointerLeave={(event) => {
                  rest.onPointerLeave?.(event)
                  // Off the panel: the sliding pill can go.
                  dropdown.releaseActiveItem()
                }}
                onAnimationComplete={(definition) => {
                  if (definition === "closed" && !dropdown.open) dropdown.onExitComplete()
                }}
              >
                {/* The panel is the container; its contents slide and resize inside it, so
                    moving between menus reads as one surface rather than two panels. */}
                <MenubarPanelBody surface={glide ? surface : ""} restLeft={restLeft}>
                  {popupChildren as React.ReactNode}
                </MenubarPanelBody>
              </motion.div>
            )
          }}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/**
 * Lays a panel's groups out side by side, with a gap between the columns. Each child is one
 * column, usually a `MenubarGroup`.
 */
function MenubarColumns({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="menubar-columns"
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-6 max-[1025px]:grid-flow-row max-[1025px]:gap-0.5",
        className
      )}
      {...props}
    />
  )
}

function DesktopMenubarItem({
  className,
  icon,
  description,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & {
  /** Shown before the title, centred against the whole item. */
  icon?: React.ReactNode
  /** A second line under the title. */
  description?: React.ReactNode
}) {
  const { motion: options } = useMenubar()
  const showIcon = options.icons && icon
  const showDescription = options.descriptions && description
  // Only the heading's words roll on hover; a shortcut beside them and the description below
  // stay put.
  const heading = React.Children.map(children, (child) =>
    typeof child === "string" && child.trim() ? (
      <DropdownMenuItemTitle>{child.trim()}</DropdownMenuItemTitle>
    ) : (
      child
    )
  )

  return (
    <DropdownMenuItem
      data-slot="menubar-item"
      className={cn(
        "group/menubar-item cursor-pointer gap-2.5",
        PANEL_ITEM_SIZE[options.size],
        className
      )}
      {...props}
    >
      {showIcon && (
        // `items-center` on the row centres this against the title and description together.
        <span
          data-slot="menubar-item-icon"
          className="flex shrink-0 items-center justify-center text-muted-foreground group-focus/menubar-item:text-current group-data-pill/menubar-item:text-current [&_svg:not([class*='size-'])]:size-4"
        >
          {icon}
        </span>
      )}
      {showDescription ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="inline-flex items-baseline gap-1.5">{heading}</span>
          <span
            data-slot="menubar-item-description"
            className="block text-xs text-muted-foreground group-focus/menubar-item:text-current/70 group-data-pill/menubar-item:text-current/70"
          >
            {description}
          </span>
        </span>
      ) : (
        heading
      )}
    </DropdownMenuItem>
  )
}

function DesktopMenubarCheckboxItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItem>) {
  const { motion: options } = useMenubar()

  return (
    <DropdownMenuCheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn("cursor-pointer", PANEL_ITEM_SIZE[options.size], className)}
      {...props}
    />
  )
}

function DesktopMenubarRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
}

function DesktopMenubarRadioItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioItem>) {
  const { motion: options } = useMenubar()

  return (
    <DropdownMenuRadioItem
      data-slot="menubar-radio-item"
      className={cn("cursor-pointer", PANEL_ITEM_SIZE[options.size], className)}
      {...props}
    />
  )
}

function DesktopMenubarLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return (
    <DropdownMenuLabel
      data-slot="menubar-label"
      className={cn("px-1.5 py-1 text-xs font-medium", className)}
      {...props}
    />
  )
}

function DesktopMenubarSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  const dropdown = useDropdownMenu()

  return (
    <MenuPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      // Staggers in with the items around it.
      render={<motion.div variants={itemVariants(dropdown)} />}
      {...props}
    />
  )
}

function DesktopMenubarShortcut({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return (
    <DropdownMenuShortcut
      data-slot="menubar-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

function DesktopMenubarSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />
}

function DesktopMenubarSubTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger>) {
  const { motion: options } = useMenubar()

  return (
    <DropdownMenuSubTrigger
      data-slot="menubar-sub-trigger"
      className={cn("cursor-pointer", PANEL_ITEM_SIZE[options.size], className)}
      {...props}
    />
  )
}

function DesktopMenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return (
    <DropdownMenuSubContent
      data-slot="menubar-sub-content"
      className={cn("min-w-40", className)}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------
 * Tablet and phone: a hamburger that opens a fixed-height, scrollable panel. Each menu becomes a
 * collapsible section (and each submenu one inside it). The same Menubar markup renders both
 * versions; CSS shows the right one, and every part below picks its touch version when it finds
 * itself inside the panel.
 * -----------------------------------------------------------------------------------------*/

/** Present inside the tablet/phone panel. */
const MobileMenubarContext = React.createContext<{ close: () => void } | null>(null)

/** The collapsible section (a menu, or a submenu inside one) a part belongs to. */
const MobileSectionContext = React.createContext<{
  open: boolean
  toggle: () => void
  id: string
} | null>(null)

/** The radio group a touch radio item belongs to. */
const MobileRadioContext = React.createContext<{
  value: unknown
  onValueChange?: (value: unknown, details: never) => void
} | null>(null)

/** Same easing as the desktop glide (power2.out). */
const MOBILE_EASE = [0.25, 0.46, 0.45, 0.94] as const

/** Three lines that fold into a cross. */
function HamburgerIcon({ open }: { open: boolean }) {
  const transition = { duration: 0.26, ease: MOBILE_EASE }
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="size-5"
    >
      <motion.path
        initial={false}
        animate={{ d: open ? "M6 6 L18 18" : "M4 7 L20 7" }}
        transition={transition}
      />
      <motion.path
        d="M4 12 L20 12"
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.12 }}
      />
      <motion.path
        initial={false}
        animate={{ d: open ? "M6 18 L18 6" : "M4 17 L20 17" }}
        transition={transition}
      />
    </svg>
  )
}

function MobileMenubar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const root = React.useRef<HTMLDivElement>(null)
  const close = React.useCallback(() => setOpen(false), [])
  const value = React.useMemo(() => ({ close }), [close])

  // A tap outside or Escape closes it.
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} data-slot="menubar-mobile" className="relative hidden max-[1025px]:block">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((was) => !was)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-base font-medium transition-transform active:scale-95"
        >
          <HamburgerIcon open={open} />
          Menu
        </button>
        <AnimatePresence>
          {open && (
            <motion.nav
              id={id}
              aria-label="Menu"
              data-slot="menubar-mobile-panel"
              // Fixed height, scrolling inside; about half the screen wide on a tablet, nearly
              // all of it on a phone.
              className="absolute top-full left-1/2 z-50 my-2 flex h-[60vh] w-[45vw] -translate-x-1/2 flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-xl bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10 max-md:w-[90vw]"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.26, ease: MOBILE_EASE, staggerChildren: 0.04 },
                },
                closed: { opacity: 0, y: -8, transition: { duration: 0.18, ease: MOBILE_EASE } },
              }}
            >
              <MobileMenubarContext.Provider value={value}>{children}</MobileMenubarContext.Provider>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

/** A menu, or a submenu, as a collapsible section. */
function MobileSection({ nested, children }: { nested?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const value = React.useMemo(
    () => ({ open, toggle: () => setOpen((was) => !was), id }),
    [open, id]
  )
  return (
    <MobileSectionContext.Provider value={value}>
      {/* Menus stagger in as the panel opens. A submenu doesn't: inside a section body there's
          no panel animation to carry it, so it would be left at its hidden start. */}
      <motion.div
        data-slot="menubar-mobile-section"
        className="flex flex-col"
        variants={nested ? undefined : { open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: 6 } }}
      >
        {children}
      </motion.div>
    </MobileSectionContext.Provider>
  )
}

/** A section's header: tapping it opens or closes the section. */
function MobileSectionTrigger({ nested, children }: { nested?: boolean; children?: React.ReactNode }) {
  const section = React.useContext(MobileSectionContext)
  const open = section?.open ?? false
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={section?.id}
      onClick={section?.toggle}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left transition-colors hover:bg-muted active:bg-muted",
        nested ? "px-3 py-2 text-sm" : "px-3 py-3 text-base font-medium"
      )}
    >
      {children}
      <MorphChevron open={open} className="size-3 text-muted-foreground" />
    </button>
  )
}

/** A section's body, sliding open and closed. */
function MobileSectionBody({ nested, children }: { nested?: boolean; children?: React.ReactNode }) {
  const section = React.useContext(MobileSectionContext)
  return (
    <AnimatePresence initial={false}>
      {section?.open && (
        <motion.div
          id={section.id}
          key="body"
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.26, ease: MOBILE_EASE }}
        >
          <div className={cn("flex flex-col gap-0.5 py-1", nested ? "px-3" : "px-1")}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const MOBILE_ROW =
  "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-[background-color,scale] hover:bg-muted active:scale-[0.99] active:bg-muted disabled:pointer-events-none disabled:opacity-50"

function MobileMenubarItem({
  className,
  icon,
  description,
  children,
  ...props
}: React.ComponentProps<typeof DesktopMenubarItem>) {
  const { motion: options } = useMenubar()
  const mobile = React.useContext(MobileMenubarContext)
  const { variant, disabled, onClick } = props as {
    variant?: "default" | "destructive"
    disabled?: boolean
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  }
  const showDescription = options.descriptions && description
  return (
    <button
      type="button"
      data-slot="menubar-item"
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event)
        // An action is done once tapped, like on desktop: the panel closes.
        mobile?.close()
      }}
      className={cn(
        MOBILE_ROW,
        variant === "destructive" && "text-destructive",
        typeof className === "string" && className
      )}
    >
      {options.icons && icon && (
        <span className="flex shrink-0 items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{children}</span>
        {showDescription && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </button>
  )
}

function MobileMenubarCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DesktopMenubarCheckboxItem>) {
  const { checked, onCheckedChange, disabled } = props as {
    checked?: boolean
    onCheckedChange?: (checked: boolean, details: never) => void
    disabled?: boolean
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      data-slot="menubar-checkbox-item"
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked, undefined as never)}
      className={cn(MOBILE_ROW, typeof className === "string" && className)}
    >
      {children}
      <span aria-hidden className="ml-auto flex size-4 shrink-0 items-center justify-center">
        <DrawnCheck checked={!!checked} />
      </span>
    </button>
  )
}

function MobileMenubarRadioGroup({
  children,
  ...props
}: React.ComponentProps<typeof DesktopMenubarRadioGroup>) {
  const { value, onValueChange } = props as {
    value?: unknown
    onValueChange?: (value: unknown, details: never) => void
  }
  const context = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  return (
    <MobileRadioContext.Provider value={context}>
      <div role="radiogroup" className="flex flex-col gap-0.5">
        {children as React.ReactNode}
      </div>
    </MobileRadioContext.Provider>
  )
}

function MobileMenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DesktopMenubarRadioItem>) {
  const group = React.useContext(MobileRadioContext)
  const { value, disabled } = props as { value?: unknown; disabled?: boolean }
  const checked = group?.value === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-slot="menubar-radio-item"
      disabled={disabled}
      onClick={() => group?.onValueChange?.(value, undefined as never)}
      className={cn(MOBILE_ROW, typeof className === "string" && className)}
    >
      {children}
      <span aria-hidden className="ml-auto flex size-4 shrink-0 items-center justify-center">
        <DrawnCheck checked={checked} />
      </span>
    </button>
  )
}

/** Renders a part's desktop version, or its touch version inside the tablet/phone panel. */
function responsive<P extends object>(
  Desktop: React.ComponentType<P>,
  Mobile: React.ComponentType<P>,
  name: string
) {
  function Part(props: P) {
    return React.useContext(MobileMenubarContext) ? <Mobile {...props} /> : <Desktop {...props} />
  }
  Part.displayName = name
  return Part
}

type Props<T extends React.ElementType> = React.ComponentProps<T>

const MenubarMenu = responsive(
  DesktopMenubarMenu,
  ({ children }: Props<typeof DesktopMenubarMenu>) => (
    <MobileSection>{children as React.ReactNode}</MobileSection>
  ),
  "MenubarMenu"
)
const MenubarTrigger = responsive(
  DesktopMenubarTrigger,
  ({ children }: Props<typeof DesktopMenubarTrigger>) => (
    <MobileSectionTrigger>{children as React.ReactNode}</MobileSectionTrigger>
  ),
  "MenubarTrigger"
)
const MenubarContent = responsive(
  DesktopMenubarContent,
  ({ children }: Props<typeof DesktopMenubarContent>) => (
    <MobileSectionBody>{children as React.ReactNode}</MobileSectionBody>
  ),
  "MenubarContent"
)
const MenubarGroup = responsive(
  DesktopMenubarGroup,
  ({ children }: Props<typeof DesktopMenubarGroup>) => (
    <div className="flex flex-col gap-0.5">{children as React.ReactNode}</div>
  ),
  "MenubarGroup"
)
const MenubarItem = responsive(DesktopMenubarItem, MobileMenubarItem, "MenubarItem")
const MenubarCheckboxItem = responsive(
  DesktopMenubarCheckboxItem,
  MobileMenubarCheckboxItem,
  "MenubarCheckboxItem"
)
const MenubarRadioGroup = responsive(
  DesktopMenubarRadioGroup,
  MobileMenubarRadioGroup,
  "MenubarRadioGroup"
)
const MenubarRadioItem = responsive(DesktopMenubarRadioItem, MobileMenubarRadioItem, "MenubarRadioItem")
const MenubarLabel = responsive(
  DesktopMenubarLabel,
  ({ children }: Props<typeof DesktopMenubarLabel>) => (
    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
      {children as React.ReactNode}
    </div>
  ),
  "MenubarLabel"
)
const MenubarSeparator = responsive(
  DesktopMenubarSeparator,
  () => <div role="separator" className="my-1 h-px bg-border" />,
  "MenubarSeparator"
)
// Keyboard shortcuts mean nothing on a touch screen.
const MenubarShortcut = responsive(DesktopMenubarShortcut, () => null, "MenubarShortcut")
const MenubarSub = responsive(
  DesktopMenubarSub,
  ({ children }: Props<typeof DesktopMenubarSub>) => (
    <MobileSection nested>{children as React.ReactNode}</MobileSection>
  ),
  "MenubarSub"
)
const MenubarSubTrigger = responsive(
  DesktopMenubarSubTrigger,
  ({ children }: Props<typeof DesktopMenubarSubTrigger>) => (
    <MobileSectionTrigger nested>{children as React.ReactNode}</MobileSectionTrigger>
  ),
  "MenubarSubTrigger"
)
const MenubarSubContent = responsive(
  DesktopMenubarSubContent,
  ({ children }: Props<typeof DesktopMenubarSubContent>) => (
    <MobileSectionBody nested>{children as React.ReactNode}</MobileSectionBody>
  ),
  "MenubarSubContent"
)

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarColumns,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
export type {
  MenubarAnimation,
  MenubarSwitch,
  MenubarTriggerHighlight,
  MenubarRounded,
  MenubarSize,
  MenubarContentSwitch,
  MenubarContentShift,
}
