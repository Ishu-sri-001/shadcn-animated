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

const SMOOTH_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const SPRING_EASE =
  "linear(0, 0.034 2.2%, 0.136 4.6%, 0.542 11.5%, 0.787 16.4%, 0.93 21.1%, 1.012 26.4%, 1.042 30.9%, 1.047 35.5%, 1.036 40.9%, 1.005 53.3%, 0.996 64%, 1)"
const spring = { type: "spring", visualDuration: 0.35, bounce: 0.2 } as const

const MIN_WIDTH = 192
const MAX_WIDTH = 400
const COLLAPSE_BELOW = 150

/** Animation options, set on SidebarProvider. */
type SidebarOptions = {
  resizable: boolean
  slidingHighlight: boolean
  activeIndicator: "bar" | "dot" | "none"
  pressSquish: boolean
  spinTrigger: boolean
  textRoll: boolean
  springTooltips: boolean
  rollingBadge: boolean
  highlightTone: "primary" | "muted"
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
  spinTrigger = false,
  textRoll = false,
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
  const [width, setWidth] = React.useState<number | null>(null)
  const [resizing, setResizing] = React.useState(false)

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

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

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
      spinTrigger,
      textRoll,
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
      spinTrigger,
      textRoll,
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
              "--sidebar-item-radius": `${itemRadius}vw`,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
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
      <div
        data-slot="sidebar-gap"
        className={cn(
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
              exit={{ x: closed, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              // Swipe it back to close.
              drag="x"
              dragDirectionLock
              dragMomentum={false}
              dragConstraints={side === "left" ? { left: -400, right: 0 } : { left: 0, right: 400 }}
              dragElastic={side === "left" ? { left: 0, right: 0.05 } : { left: 0.05, right: 0 }}
              onDragEnd={(_, info) => {
                const swiped = info.offset.x * sign > width.current * 0.3 || info.velocity.x * sign > 500
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

function SidebarTriggerIcon({ hovered }: { hovered: boolean }) {
  const { state, isMobile, openMobile, spinTrigger } = useSidebar()
  const opening = isMobile ? !openMobile : state === "collapsed"
  const arrow = spinTrigger
    ? opening
      ? "M13 8L9 12L13 16"
      : "M10 8L14 12L10 16"
    : opening
      ? "M11 8L15 12L11 16"
      : "M14 8L10 12L14 16"
  const d = hovered ? arrow : "M9 3L9 12L9 21"
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ width: "1.25rem", height: "1.25rem" }}
      initial={false}
      animate={{ rotate: spinTrigger && hovered ? 180 : 0 }}
      transition={spring}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <motion.path initial={false} animate={{ d }} transition={spring} />
    </motion.svg>
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

function SidebarContent({
  className,
  children,
  onPointerOver,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"div">) {
  const { container, box, handlers } = useGlide<HTMLDivElement>(
    "[data-sidebar=menu-button], [data-sidebar=menu-sub-button]"
  )

  return (
    <div
      ref={container}
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar relative isolate flex min-h-0 flex-1 flex-col gap-1 overflow-auto py-2 group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
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
      <SidebarGlideHighlight box={box} />
      <SidebarGlideScopeContext.Provider value={true}>{children}</SidebarGlideScopeContext.Provider>
    </div>
  )
}

function SidebarGroup({
  className,
  label,
  ...props
}: React.ComponentProps<"div"> & {
  label?: string
}) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("relative flex w-full min-w-0 flex-col px-2", className)}
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

const SidebarGlideScopeContext = React.createContext(false)

const SidebarMenuIndexContext = React.createContext(0)

type Box = { top: number; left: number; width: number; height: number }

const highlightBg = { primary: "bg-primary", muted: "bg-sidebar-accent" } as const
const primaryTone =
  "data-glide:text-primary-foreground active:bg-primary active:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"

function useGlide<T extends HTMLElement>(
  itemSelector: string,
  owns?: (item: HTMLElement, container: T) => boolean
) {
  const container = React.useRef<T>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  const marked = React.useRef<HTMLElement | null>(null)
  const source = React.useRef<"pointer" | "focus" | null>(null)
  const clearTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(clearTimer.current), [])

  const mark = (item: HTMLElement | null) => {
    if (marked.current === item) return
    marked.current?.removeAttribute("data-glide")
    marked.current = item
    item?.setAttribute("data-glide", "")
  }

  const track = (target: EventTarget, from: "pointer" | "focus") => {
    const root = container.current
    const item = (target as Element).closest<HTMLElement>(itemSelector)
    if (!root || !item || !root.contains(item) || item.hasAttribute("data-no-glide")) return false
    if (owns && !owns(item, root)) return false
    window.clearTimeout(clearTimer.current)
    const b = item.getBoundingClientRect()
    const o = root.getBoundingClientRect()
    mark(item)
    source.current = from
    setBox({
      top: b.top - o.top + root.scrollTop,
      left: b.left - o.left + root.scrollLeft,
      width: b.width,
      height: b.height,
    })
    return true
  }

  const clear = () => {
    window.clearTimeout(clearTimer.current)
    mark(null)
    source.current = null
    setBox(null)
  }

  const handlers = {
    onPointerOver: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse" || track(event.target, "pointer")) return
      if (source.current === "pointer") {
        window.clearTimeout(clearTimer.current)
        clearTimer.current = window.setTimeout(clear, 120)
      }
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
    "[data-sidebar=menu-button], [data-sidebar=menu-sub-button]",
    (item, menu) => item.closest("[data-slot=sidebar-menu]") === menu
  )
  const scoped = React.useContext(SidebarGlideScopeContext)

  return (
    <ul
      ref={container}
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("relative isolate flex w-full min-w-0 flex-col gap-1", className)}
      onPointerOver={(event) => {
        onPointerOver?.(event)
        if (!scoped) handlers.onPointerOver(event)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (!scoped) handlers.onPointerLeave()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (!scoped) handlers.onFocus(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (!scoped) handlers.onBlur(event)
      }}
      {...props}
    >
      {!scoped && <SidebarGlideHighlight box={box} as="li" />}
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

const staggeredLabels =
  "[&>span:not([data-sidebar-fx]):not(:has(svg))]:transition-[opacity,translate] [&>span:not([data-sidebar-fx]):not(:has(svg))]:duration-300 [&>span:not([data-sidebar-fx]):not(:has(svg))]:ease-out [&>span:not([data-sidebar-fx]):not(:has(svg))]:delay-[calc(var(--sidebar-i,0)*40ms+150ms)] group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:-translate-x-2 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:opacity-0 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:delay-0 group-data-[collapsible=icon]:[&>span:not([data-sidebar-fx]):not(:has(svg))]:duration-100"

function PulsingDot({ className }: { className?: string }) {
  return (
    <span className={cn("pointer-events-none absolute size-1.5 rounded-full bg-sidebar-primary", className)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-inherit opacity-60 [animation-duration:1.6s] motion-reduce:hidden" />
    </span>
  )
}

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
              ?
                "inset-y-0 -left-2.5 w-0.5 bg-foreground"
              : cn(
                  "top-1/2 left-1.5 h-4 w-0.75 -translate-y-1/2 group-data-[collapsible=icon]:hidden",
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
            sub ? "-left-3" : "left-2 group-data-[collapsible=icon]:hidden"
          )}
        >
          <PulsingDot
            className={cn(
              "inset-0",
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
  const {
    isMobile,
    state,
    slidingHighlight,
    pressSquish,
    textRoll,
    springTooltips,
    highlightTone,
    activeIndicator,
  } = useSidebar()
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          sidebarMenuButtonVariants({ variant, size }),
          staggeredLabels,
          variant === "default" && highlightTone === "primary" && primaryTone,
          activeIndicator === "bar" && "px-3.5",
          activeIndicator === "dot" && "px-5.5",
          slidingHighlight && "data-active:bg-transparent",
          pressSquish && "active:scale-[0.96]",
          className
        ),
        children: (
          <>
            <ActiveEffects isActive={isActive} />
            {textRoll ? rollLabels(children) : children}
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
        sideOffset={12}
        hidden={state !== "collapsed" || isMobile}
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

function rollLabels(children: React.ReactNode) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ className?: string; children?: React.ReactNode }>(child)) return child
    const text = child.props.children
    if (child.type !== "span" || (typeof text !== "string" && typeof text !== "number")) return child
    return <RollLabel className={child.props.className}>{text}</RollLabel>
  })
}

const power2Out = (t: number) => 1 - (1 - t) ** 3

function RollLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  const root = React.useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  React.useEffect(() => {
    const el = root.current
    const item = el?.closest<HTMLElement>("[data-sidebar=menu-button], [data-sidebar=menu-sub-button]")
    const [text, copy] = el ? Array.from(el.children) : []
    if (!item || !text || !copy || reduceMotion) return
    animate(copy, { y: "100%" }, { duration: 0 })
    let over = false
    const sync = () => {
      const next = item.hasAttribute("data-glide")
      if (next === over) return
      over = next
      const tween = { duration: 0.4, ease: power2Out }
      animate(text, { y: over ? "-100%" : "0%" }, tween)
      animate(copy, { y: over ? "0%" : "100%" }, tween)
    }
    const observer = new MutationObserver(sync)
    observer.observe(item, { attributes: true, attributeFilter: ["data-glide"] })
    return () => observer.disconnect()
  }, [reduceMotion])

  return (
    <span ref={root} className={cn("relative block overflow-hidden", className)}>
      <span className="block truncate">{children}</span>
      <span aria-hidden className="absolute inset-x-0 top-0 block truncate">
        {children}
      </span>
    </span>
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

function SidebarMenuBadge({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) {
  const { rollingBadge, highlightTone } = useSidebar()
  const reduceMotion = useReducedMotion()
  const content = React.useRef<HTMLSpanElement>(null)
  const count = typeof children === "number" ? children : null

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

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
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
            "relative mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 px-2.5 py-1 group-data-[collapsible=icon]:hidden",
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
  const { slidingHighlight, pressSquish, textRoll, highlightTone } = useSidebar()
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "relative isolate flex h-8 min-w-0 -translate-x-px items-center gap-2 rounded-(--sidebar-item-radius) px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-[scale,color] duration-300 group-data-[collapsible=icon]:hidden hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          highlightTone === "primary" && primaryTone,
          slidingHighlight && "data-active:bg-transparent",
          pressSquish && "active:scale-[0.96]",
          className
        ),
        children: (
          <>
            <ActiveEffects isActive={isActive} sub />
            {textRoll ? rollLabels(children) : children}
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
