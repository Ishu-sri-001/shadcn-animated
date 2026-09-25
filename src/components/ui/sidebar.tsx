"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "motion/react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

// Smooth ease-out (fast start, gentle stop, no overshoot) for opening and
// closing: widths, the page beside the sidebar, labels and badges all share it.
const SMOOTH_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
// A spring (slight overshoot, then settle) as a CSS easing, for springy tooltips.
const SPRING_EASE =
  "linear(0, 0.034 2.2%, 0.136 4.6%, 0.542 11.5%, 0.787 16.4%, 0.93 21.1%, 1.012 26.4%, 1.042 30.9%, 1.047 35.5%, 1.036 40.9%, 1.005 53.3%, 0.996 64%, 1)"
const spring = { type: "spring", visualDuration: 0.35, bounce: 0.2 } as const

// Drag-to-resize limits, in px. Dragging narrower than COLLAPSE_BELOW collapses to icons.
const MIN_WIDTH = 192
const MAX_WIDTH = 400
const COLLAPSE_BELOW = 150

/** Animation options, set on SidebarProvider. */
type SidebarOptions = {
  /** Drag the sidebar's edge to change its width; drag narrow enough to collapse. */
  resizable: boolean
  /**
   * The active item's background and indicator (bar or dot) glide from the old
   * item to the new one. Off, they switch to the new item instantly.
   */
  slidingHighlight: boolean
  /**
   * Marks the active item: "bar" (a thin bar on its left edge; in a sub-menu,
   * the guide line fills beside it), "dot" (a pulsing dot there instead) or
   * "none". Either slides to the newly active item.
   */
  activeIndicator: "bar" | "dot" | "none"
  /** Menu items shrink slightly while pressed. */
  pressSquish: boolean
  /** Collapsed-mode tooltips spring out from the icon instead of fading in. */
  springTooltips: boolean
  /** Numeric badges roll to their new value and pop when it changes. */
  rollingBadge: boolean
  /**
   * Hover and active backgrounds: "primary" (solid, with the item's text and
   * icon switching to the contrasting colour) or "muted" (soft grey).
   */
  highlightTone: "primary" | "muted"
  /** Corner rounding of menu items (and their hover and active backgrounds), in rem. 0 is square. */
  itemRadius: number
}

type SidebarContextProps = SidebarOptions & {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  /** Scopes shared layout ids (highlight, bar) to this sidebar. */
  id: string
  setWidth: (width: number | null) => void
  setResizing: (resizing: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  resizable = false,
  slidingHighlight = true,
  activeIndicator = "bar",
  pressSquish = false,
  springTooltips = false,
  rollingBadge = true,
  highlightTone = "primary",
  itemRadius = 0,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> &
  Partial<SidebarOptions> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) {
  const isMobile = useIsMobile()
  const id = React.useId()
  const [openMobile, setOpenMobile] = React.useState(false)
  // Width set by dragging the edge; null uses the default.
  const [width, setWidth] = React.useState<number | null>(null)
  const [resizing, setResizing] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      id,
      setWidth,
      setResizing,
      resizable,
      slidingHighlight,
      activeIndicator,
      pressSquish,
      springTooltips,
      rollingBadge,
      highlightTone,
      itemRadius,
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      id,
      resizable,
      slidingHighlight,
      activeIndicator,
      pressSquish,
      springTooltips,
      rollingBadge,
      highlightTone,
      itemRadius,
    ]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <MotionConfig reducedMotion="user">
        <div
          data-slot="sidebar-wrapper"
          data-resizing={resizing || undefined}
          style={
            {
              "--sidebar-width": width === null ? SIDEBAR_WIDTH : `${width}px`,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              "--sidebar-ease": SMOOTH_EASE,
              "--sidebar-item-radius": `${itemRadius}rem`,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
            // No transitions while dragging the edge, so the sidebar follows the pointer.
            "data-resizing:cursor-col-resize data-resizing:select-none data-resizing:**:transition-none!",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MotionConfig>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <MobileSidebar side={side} dir={dir}>
        {children}
      </MobileSidebar>
    )
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          // Springs to its new width; the page beside it eases along.
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-400 ease-(--sidebar-ease)",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-400 ease-(--sidebar-ease) data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * The sidebar on mobile: a panel that springs in from the edge, closes with a
 * swipe back (the backdrop fading as it goes), and opens with a swipe from the
 * screen edge.
 */
function MobileSidebar({
  side,
  dir,
  children,
}: {
  side: "left" | "right"
  dir?: string
  children: React.ReactNode
}) {
  const { openMobile, setOpenMobile } = useSidebar()
  const reduceMotion = useReducedMotion()
  const panel = React.useRef<HTMLDivElement>(null)
  const sign = side === "left" ? -1 : 1
  // Panel offset in px; the backdrop fades with it.
  const x = useMotionValue(0)
  const width = React.useRef(288)
  const backdrop = useTransform(x, (v) => 1 - Math.min(Math.abs(v) / width.current, 1))

  React.useEffect(() => {
    if (!openMobile) return
    const panelEl = panel.current
    width.current = panelEl?.offsetWidth ?? 288
    panelEl?.focus()
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpenMobile(false)
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openMobile, setOpenMobile])

  const closed = sign * 320

  return (
    <>
      {!openMobile && (
        // Swipe in from the screen edge to open.
        <motion.div
          aria-hidden
          className={cn(
            "fixed inset-y-0 z-40 w-5 touch-pan-y",
            side === "left" ? "left-0" : "right-0"
          )}
          onPanEnd={(_, info) => {
            if (info.offset.x * -sign > 40) setOpenMobile(true)
          }}
        />
      )}
      <AnimatePresence>
        {openMobile && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-70 bg-black/50"
              style={{ opacity: backdrop }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenMobile(false)}
            />
            <motion.div
              key="panel"
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Sidebar"
              tabIndex={-1}
              dir={dir}
              data-sidebar="sidebar"
              data-slot="sidebar"
              data-mobile="true"
              className={cn(
                "fixed inset-y-0 z-70 flex flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none",
                side === "left" ? "left-0" : "right-0"
              )}
              style={{ width: SIDEBAR_WIDTH_MOBILE, x }}
              initial={{ x: closed }}
              animate={{ x: 0 }}
              // A quick slide out; a spring's long settle would keep it "closing".
              exit={{ x: closed, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
              // Slides in on the same smooth curve as the desktop sidebar.
              transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              // Swipe it back to close.
              drag="x"
              dragDirectionLock
              // No coasting after release; it either closes or springs back.
              dragMomentum={false}
              dragConstraints={side === "left" ? { left: -400, right: 0 } : { left: 0, right: 400 }}
              dragElastic={side === "left" ? { left: 0, right: 0.05 } : { left: 0.05, right: 0 }}
              onDragEnd={(_, info) => {
                const swiped = info.offset.x * sign > width.current * 0.3 || info.velocity.x * sign > 500
                // Closing animates it out; otherwise spring back. (Not dragSnapToOrigin,
                // which would pull against the exit animation and stop it finishing.)
                if (swiped) setOpenMobile(false)
                else animate(x, 0, { type: "spring", visualDuration: 0.3, bounce: 0.2 })
              }}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/** Panel icon that turns into an arrow on hover, pointing the way the sidebar will move. */
function SidebarTriggerIcon({ hovered }: { hovered: boolean }) {
  const { state, isMobile, openMobile } = useSidebar()
  const opening = isMobile ? !openMobile : state === "collapsed"
  // Three points each, so Motion can morph between them.
  const d = !hovered ? "M9 3L9 12L9 21" : opening ? "M11 8L15 12L11 16" : "M14 8L10 12L14 16"
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      // Matches the sidebar's 20px icons (inline, to beat the Button's size-4).
      style={{ width: "1.25rem", height: "1.25rem" }}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <motion.path initial={false} animate={{ d }} transition={spring} />
    </svg>
  )
}

function SidebarTrigger({
  className,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()
  const [hovered, setHovered] = React.useState(false)

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        setHovered(true)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        setHovered(false)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        setHovered(true)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        setHovered(false)
      }}
      {...props}
    >
      <SidebarTriggerIcon hovered={hovered} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar, resizable, open, setOpen, setWidth, setResizing } = useSidebar()
  const drag = React.useRef<{ x: number; width: number; moved: boolean } | null>(null)

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={() => {
        // With `resizable`, a click (a press without a drag) toggles in onPointerUp.
        if (!resizable) toggleSidebar()
      }}
      onPointerDown={(event) => {
        if (!resizable || event.button !== 0) return
        const container = event.currentTarget.closest<HTMLElement>("[data-slot=sidebar-container]")
        drag.current = { x: event.clientX, width: container?.offsetWidth ?? 256, moved: false }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const d = drag.current
        if (!d) return
        const dx = event.clientX - d.x
        if (!d.moved && Math.abs(dx) < 3) return
        if (!d.moved) {
          d.moved = true
          setResizing(true)
        }
        const next = d.width + dx
        if (next < COLLAPSE_BELOW) {
          if (open) setOpen(false)
        } else {
          if (!open) setOpen(true)
          setWidth(Math.min(Math.max(next, MIN_WIDTH), MAX_WIDTH))
        }
      }}
      onPointerUp={(event) => {
        const d = drag.current
        drag.current = null
        if (!d) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        setResizing(false)
        if (!d.moved) toggleSidebar()
      }}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        resizable && "cursor-col-resize! hover:after:bg-sidebar-ring",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 origin-left items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          // Collapsed: shrinks and fades away while the space closes up (and
          // no longer catches the pointer, as it moves over the item above).
          "[transition:margin_400ms_var(--sidebar-ease),scale_400ms_var(--sidebar-ease),opacity_200ms_ease-out] group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:scale-75 group-data-[collapsible=icon]:opacity-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  })
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  })
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

// Each item's position in its menu, so labels can appear one after another.
const SidebarMenuIndexContext = React.createContext(0)

type Box = { top: number; left: number; width: number; height: number }

// Background of the hover glider and the active highlight, per tone.
const highlightBg = { primary: "bg-primary", muted: "bg-sidebar-accent" } as const
// With the primary tone, an item under the gliding hover background (marked
// data-glide), pressed or active switches its text and icon to the contrasting
// colour, easing with the background.
const primaryTone =
  "data-glide:text-primary-foreground active:bg-primary active:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"

/**
 * A background that glides to whichever item is hovered or keyboard-focused
 * within a container (like the date picker's hover square), marking that item
 * with data-glide. Items marked data-no-glide are skipped.
 */
function useGlide<T extends HTMLElement>(
  itemSelector: string,
  /** Extra check that an item belongs to this container (e.g. not a nested one). */
  owns?: (item: HTMLElement, container: T) => boolean
) {
  const container = React.useRef<T>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  const marked = React.useRef<HTMLElement | null>(null)
  // What placed the background, so losing focus only clears a focus one.
  const source = React.useRef<"pointer" | "focus" | null>(null)

  const mark = (item: HTMLElement | null) => {
    if (marked.current === item) return
    marked.current?.removeAttribute("data-glide")
    marked.current = item
    item?.setAttribute("data-glide", "")
  }

  const track = (target: EventTarget, from: "pointer" | "focus") => {
    const root = container.current
    const item = (target as Element).closest<HTMLElement>(itemSelector)
    if (!root || !item || !root.contains(item) || item.hasAttribute("data-no-glide")) return
    if (owns && !owns(item, root)) return
    const b = item.getBoundingClientRect()
    const o = root.getBoundingClientRect()
    mark(item)
    source.current = from
    setBox({ top: b.top - o.top, left: b.left - o.left, width: b.width, height: b.height })
  }

  const clear = () => {
    mark(null)
    source.current = null
    setBox(null)
  }

  const handlers = {
    onPointerOver: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") track(event.target, "pointer")
    },
    onPointerLeave: () => clear(),
    onFocus: (event: React.FocusEvent) => {
      if ((event.target as Element).matches(":focus-visible")) track(event.target, "focus")
    },
    onBlur: (event: React.FocusEvent) => {
      if (source.current === "focus" && !container.current?.contains(event.relatedTarget as Node)) clear()
    },
  }

  return { container, box, handlers }
}

/** The gliding background for useGlide; fades in and out as the pointer enters and leaves. */
function SidebarGlideHighlight({ box, as = "div", className }: { box: Box | null; as?: "div" | "li"; className?: string }) {
  const { highlightTone } = useSidebar()
  const Element = as === "li" ? motion.li : motion.div
  return (
    <AnimatePresence>
      {box && (
        <Element
          key="glide"
          role="presentation"
          aria-hidden
          className={cn(
            "pointer-events-none absolute -z-10 rounded-(--sidebar-item-radius)",
            highlightTone === "primary" ? "bg-primary" : "bg-sidebar-accent/70",
            className
          )}
          initial={{ ...box, opacity: 0 }}
          animate={{ ...box, opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={spring}
        />
      )}
    </AnimatePresence>
  )
}

function SidebarMenu({
  className,
  children,
  onPointerOver,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"ul">) {
  const { container, box, handlers } = useGlide<HTMLUListElement>(
    // data-sidebar survives wrappers that replace data-slot (e.g. a popover trigger).
    "[data-sidebar=menu-button], [data-sidebar=menu-sub-button]",
    // Only items of this menu, not of a menu nested further in.
    (item, menu) => item.closest("[data-slot=sidebar-menu]") === menu
  )

  return (
    <ul
      ref={container}
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("relative isolate flex w-full min-w-0 flex-col gap-1", className)}
      onPointerOver={(event) => {
        onPointerOver?.(event)
        handlers.onPointerOver(event)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        handlers.onPointerLeave()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        handlers.onFocus(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        handlers.onBlur(event)
      }}
      {...props}
    >
      <SidebarGlideHighlight box={box} as="li" />
      {React.Children.map(children, (child, index) => (
        <SidebarMenuIndexContext.Provider value={index}>{child}</SidebarMenuIndexContext.Provider>
      ))}
    </ul>
  )
}

function SidebarMenuItem({ className, style, ...props }: React.ComponentProps<"li">) {
  const index = React.useContext(SidebarMenuIndexContext)
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      style={{ "--sidebar-i": index, ...style } as React.CSSProperties}
      {...props}
    />
  )
}

// On expand, labels fade and slide in one after another (by --sidebar-i);
// on collapse they fade out first and together, so text is never cut mid-slide.
// Only text spans: icon holders (e.g. a logo box) and effect layers
// (data-sidebar-fx) stay visible in the icon strip.
const staggeredLabels =
  "[&>span:not([data-sidebar-fx]):not(:has(svg))]:transition-[opacity,translate] [&>span:not([data-sidebar-fx]):not(:has(svg))]:duration-300 [&>span:not([data-sidebar-fx]):not(:has(svg))]:ease-out [&>span:not([data-sidebar-fx]):not(:has(svg))]:delay-[calc(var(--sidebar-i,0)*40ms+150ms)] group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:-translate-x-2 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:opacity-0 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:delay-0 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:duration-100"

/** A dot with a ring that keeps pulsing outward. */
function PulsingDot({ className }: { className?: string }) {
  return (
    <span className={cn("pointer-events-none absolute size-1.5 rounded-full bg-sidebar-primary", className)}>
      {/* CSS, so the pulse keeps running while the dot glides between items. */}
      <span className="absolute inset-0 animate-ping rounded-full bg-inherit opacity-60 [animation-duration:1.6s] motion-reduce:hidden" />
    </span>
  )
}

/**
 * The active item's background and indicator (bar or pulsing dot), which glide
 * between items via shared layout ids. In a sub-menu the indicator sits on the
 * guide line: the bar fills the line's segment beside the item.
 */
function ActiveEffects({ isActive, sub = false }: { isActive: boolean; sub?: boolean }) {
  const { id, slidingHighlight, activeIndicator, highlightTone } = useSidebar()
  if (!isActive) return null
  const indicatorId = `${id}-${sub ? "sub-" : ""}${activeIndicator}`
  return (
    <>
      {slidingHighlight && (
        <motion.span
          data-sidebar-fx
          aria-hidden
          layoutId={`${id}-highlight`}
          transition={spring}
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-(--sidebar-item-radius)",
            highlightBg[highlightTone]
          )}
        />
      )}
      {activeIndicator === "bar" && (
        <motion.span
          data-sidebar-fx
          aria-hidden
          layoutId={slidingHighlight ? indicatorId : undefined}
          transition={spring}
          className={cn(
            "pointer-events-none absolute rounded-full",
            sub
              ? // Over the guide line (1px, 9px left of the item), covering the item's height.
                "inset-y-0 -left-2.5 w-0.5 bg-foreground"
              : cn(
                  // Inset from the item's edge; hidden in the icon strip (no room beside the icon).
                  "top-1/2 left-1.5 h-4 w-0.75 -translate-y-1/2 group-data-[collapsible=icon]:hidden",
                  // Sits on the highlight, so it takes the contrasting colour on primary.
                  highlightTone === "primary" ? "bg-primary-foreground" : "bg-sidebar-primary"
                )
          )}
        />
      )}
      {activeIndicator === "dot" && (
        <motion.span
          data-sidebar-fx
          aria-hidden
          layoutId={slidingHighlight ? indicatorId : undefined}
          transition={spring}
          className={cn(
            "pointer-events-none absolute top-1/2 size-1.5 -translate-y-1/2",
            // Centred on the guide line, or inset from the item's left edge
            // (hidden in the icon strip, where there's no room beside the icon).
            sub ? "-left-3" : "left-1.5 group-data-[collapsible=icon]:hidden"
          )}
        >
          <PulsingDot
            className={cn(
              "inset-0",
              // On the guide line, or on the item's highlight (contrasting on primary).
              sub ? "bg-foreground" : highlightTone === "primary" && "bg-primary-foreground"
            )}
          />
        </motion.span>
      )}
    </>
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button relative isolate flex w-full items-center gap-2 rounded-(--sidebar-item-radius) p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding,scale,color] duration-400 ease-(--sidebar-ease) group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:p-1.5! hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-5 [&_svg]:shrink-0 [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        // The hover background is the menu's gliding highlight.
        default: "hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  children,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state, slidingHighlight, pressSquish, springTooltips, highlightTone, activeIndicator } =
    useSidebar()
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          sidebarMenuButtonVariants({ variant, size }),
          staggeredLabels,
          variant === "default" && highlightTone === "primary" && primaryTone,
          // Room for the active bar or dot between the item's edge and its icon.
          activeIndicator !== "none" && "px-3.5",
          // The sliding highlight replaces the static active background.
          slidingHighlight && "data-active:bg-transparent",
          pressSquish && "active:scale-[0.96]",
          className
        ),
        children: (
          <>
            <ActiveEffects isActive={isActive} />
            {children}
          </>
        ),
      },
      props
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  })

  if (!tooltip) {
    return comp
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side="right"
        align="center"
        // Collapsed items end 8px inside the sidebar's border; this puts the
        // tooltip just past the border rather than beside the icon.
        sideOffset={12}
        hidden={state !== "collapsed" || isMobile}
        // Above the sidebar, which sits above the page (z-60).
        positionerClassName="z-70"
        {...(springTooltips && {
          className: "data-open:zoom-in-75 data-[side=right]:slide-in-from-left-3",
          style: { animationDuration: "450ms", animationTimingFunction: SPRING_EASE },
        })}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  })
}

/**
 * A count beside a menu item. Pops in and out when mounted or removed (wrap it
 * in AnimatePresence, with a key); with `rollingBadge`, a number rolls to its
 * new value and pops when it changes.
 */
function SidebarMenuBadge({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) {
  const { rollingBadge, highlightTone } = useSidebar()
  const reduceMotion = useReducedMotion()
  const content = React.useRef<HTMLSpanElement>(null)
  const count = typeof children === "number" ? children : null

  // Pop when the number changes (not on mount).
  const last = React.useRef(count)
  React.useEffect(() => {
    const changed = last.current !== count
    last.current = count
    if (!changed || !rollingBadge || reduceMotion || !content.current) return
    animate(content.current, { scale: [1, 1.35, 1] }, { duration: 0.35, ease: "easeOut" })
  }, [count, rollingBadge, reduceMotion])

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      // No bounce on the way out: a spring would overshoot past 0 and flip it.
      exit={{ scale: 0, transition: { duration: 0.15, ease: "easeIn" } }}
      transition={spring}
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        "transition-colors duration-300 group-data-[collapsible=icon]:hidden",
        highlightTone === "primary" &&
          "peer-data-glide/menu-button:text-primary-foreground peer-data-active/menu-button:text-primary-foreground",
        className
      )}
      {...props}
    >
      <span ref={content} className="inline-flex">
        {rollingBadge && count !== null ? <RollingNumber value={count} /> : children}
      </span>
    </motion.div>
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

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  })

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

// Opens by growing to its height; the items appear one after another and the
// guide line beside them draws downward. Closes in reverse.
const subMenuVariants: Variants = {
  closed: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { type: "spring", visualDuration: 0.25, bounce: 0 },
  },
  open: {
    height: "auto",
    opacity: 1,
    // Clipped only while it grows, so dots and bars on the guide line show in full.
    transitionEnd: { overflow: "visible" },
    transition: { ...spring, staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const subItemVariants: Variants = {
  closed: { opacity: 0, x: -6, transition: { duration: 0.15 } },
  open: { opacity: 1, x: 0, transition: spring },
}

const guideLineVariants: Variants = {
  closed: { scaleY: 0, transition: { duration: 0.15 } },
  open: { scaleY: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function SidebarMenuSub({
  className,
  open = true,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.ul>, "children"> & {
  /** Shown while true; opening and closing animate. */
  open?: boolean
  children?: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.ul
          key="sub"
          data-slot="sidebar-menu-sub"
          data-sidebar="menu-sub"
          variants={subMenuVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className={cn(
            "relative mx-3.5 flex min-w-0 translate-x-px flex-col gap-1.5 px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
            className
          )}
          {...props}
        >
          <motion.li
            role="presentation"
            aria-hidden
            variants={guideLineVariants}
            className="pointer-events-none absolute inset-y-0 left-0 w-px origin-top bg-sidebar-border"
          />
          {children}
        </motion.ul>
      )}
    </AnimatePresence>
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<typeof motion.li>) {
  return (
    <motion.li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      variants={subItemVariants}
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  children,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md"
    isActive?: boolean
  }) {
  const { slidingHighlight, pressSquish, highlightTone } = useSidebar()
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "relative isolate flex h-7 min-w-0 -translate-x-px items-center gap-2 rounded-(--sidebar-item-radius) px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-[scale,color] duration-300 group-data-[collapsible=icon]:hidden hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          highlightTone === "primary" && primaryTone,
          slidingHighlight && "data-active:bg-transparent",
          pressSquish && "active:scale-[0.96]",
          className
        ),
        children: (
          <>
            <ActiveEffects isActive={isActive} sub />
            {children}
          </>
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  })
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarGlideHighlight,
  useGlide,
  useSidebar,
}
