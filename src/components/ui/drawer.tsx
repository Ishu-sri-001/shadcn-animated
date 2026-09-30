"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "cn"

import { useTriggerHover } from "@/components/ui/hover-effects"
import { staggerIn } from "@/lib/stagger-in"

type DrawerMotion = {
  /** Spring instead of an eased slide. */
  springy: boolean
  /** Seconds. */
  duration: number
  /** Spring overshoot, 0–0.9. */
  bounce: number
  /** Gap between items fading in. */
  stagger: number
  /** Tilts a little while swiped. */
  swipeTilt: boolean
  /** Trigger text rolls up on hover. */
  textRoll: boolean
  /** Trigger fills from pointer on hover. */
  fillOnHover: boolean
  /** Slide in, or fade in place. */
  openAnimation: DrawerOpenAnimation
}

type DrawerOpenAnimation = "slide" | "fade"

type DrawerContextProps = DrawerMotion & {
  hasSnapPoints: boolean
  modal: DrawerPrimitive.Root.Props["modal"]
  showSwipeHandle: boolean
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>
}

/** A spring as CSS linear() easing. */
function springEasing(bounce: number) {
  const zeta = 1 - Math.min(Math.max(bounce, 0), 0.9)
  const omega = 7 / zeta
  const steps = 40
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    if (i === steps) return 1
    if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t)
    const damped = omega * Math.sqrt(1 - zeta ** 2)
    return (
      1 -
      Math.exp(-zeta * omega * t) *
        (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))
    )
  })
  return `linear(${points.map((p) => +p.toFixed(4)).join(", ")})`
}

/** Titles and any element marked data-drawer-item stagger in, boxes included. */
const STAGGER_ITEMS =
  '[data-slot="drawer-title"], [data-slot="drawer-description"], [data-drawer-item]'

const DrawerContext = React.createContext<DrawerContextProps | null>(null)

function useDrawer() {
  const context = React.useContext(DrawerContext)

  if (!context) {
    throw new Error("useDrawer must be used within a Drawer.")
  }

  return context
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  springy = true,
  duration = 0.5,
  bounce = 0.2,
  stagger = 0.04,
  swipeTilt = false,
  textRoll = true,
  fillOnHover = false,
  openAnimation = "slide",
  ...props
}: DrawerPrimitive.Root.Props &
  Partial<DrawerMotion> & {
    showSwipeHandle?: boolean
  }) {
  // Base UI only snaps bottom sheets.
  const snaps = swipeDirection === "down" ? snapPoints : undefined
  const hasSnapPoints = snaps != null && snaps.length > 0
  const contextValue = React.useMemo(
    () => ({
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection,
      springy,
      duration,
      bounce,
      stagger,
      swipeTilt,
      textRoll,
      fillOnHover,
      openAnimation,
    }),
    [
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection,
      springy,
      duration,
      bounce,
      stagger,
      swipeTilt,
      textRoll,
      fillOnHover,
      openAnimation,
    ]
  )

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snaps}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  )
}

function DrawerTrigger({
  onPointerEnter,
  onPointerLeave,
  className,
  children,
  ...props
}: DrawerPrimitive.Trigger.Props) {
  const hover = useTriggerHover(useDrawer())
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        hover.onPointerEnter(event)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        hover.onPointerLeave(event)
      }}
      className={(state) =>
        cn(hover.className, typeof className === "function" ? className(state) : className)
      }
      {...props}
    >
      {hover.content(children)}
    </DrawerPrimitive.Trigger>
  )
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/10 opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] select-none data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-snap-points:[--drawer-overlay-min-opacity:0.5] data-starting-style:opacity-0 data-swiping:duration-0 supports-backdrop-filter:backdrop-blur-xs supports-[-webkit-touch-callout:none]:absolute",
        className
      )}
      {...props}
    />
  )
}

function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 flex shrink-0 cursor-grab transition-opacity duration-200 group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-[swipe-axis=x]/drawer-popup:h-full group-data-[swipe-axis=x]/drawer-popup:w-3 group-data-[swipe-axis=x]/drawer-popup:items-center group-data-[swipe-axis=y]/drawer-popup:h-3 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=y]/drawer-popup:justify-center group-data-[swipe-direction=down]/drawer-popup:items-end group-data-[swipe-direction=left]/drawer-popup:order-last group-data-[swipe-direction=left]/drawer-popup:justify-start group-data-[swipe-direction=right]/drawer-popup:justify-end group-data-[swipe-direction=up]/drawer-popup:order-last group-data-[swipe-direction=up]/drawer-popup:items-start after:block after:shrink-0 after:rounded-full after:bg-muted group-data-[swipe-axis=x]/drawer-popup:after:h-24 group-data-[swipe-axis=x]/drawer-popup:after:w-1 group-data-[swipe-axis=y]/drawer-popup:after:h-1 group-data-[swipe-axis=y]/drawer-popup:after:w-24 active:cursor-grabbing",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  const {
    hasSnapPoints,
    modal,
    showSwipeHandle,
    swipeDirection,
    springy,
    duration,
    bounce,
    stagger,
    swipeTilt,
    openAnimation,
  } = useDrawer()
  const fade = openAnimation === "fade"
  const swipeAxis =
    swipeDirection === "down" || swipeDirection === "up" ? "y" : "x"
  const ease = React.useMemo(
    () => (springy && !fade ? springEasing(bounce) : "cubic-bezier(0.22,1,0.36,1)"),
    [springy, bounce, fade]
  )
  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const delay = duration * 0.3
      // Fade content in, stagger its items.
      const content = node.querySelector<HTMLElement>('[data-slot="drawer-content"]')
      if (content && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        content.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 350,
          delay: delay * 1000,
          easing: "ease-out",
          fill: "backwards",
        })
      }
      staggerIn(node, STAGGER_ITEMS, { gap: stagger, delay })
    },
    [stagger, duration]
  )

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          ref={attach}
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? "" : undefined}
          style={
            {
              "--drawer-duration": `${duration}s`,
              "--drawer-ease": ease,
              // Fade: close in place.
              ...(fade && {
                "--closed-transform":
                  "translate3d(var(--translate-x,0px),var(--translate-y,0px),0) scale(var(--stack-scale))",
              }),
            } as React.CSSProperties
          }
          className={cn(
            // Base.
            "group/drawer-popup pointer-events-auto fixed z-50 m-(--drawer-inset,0px) flex h-(--drawer-content-height) max-h-(--drawer-content-max-height,none) min-h-0 w-(--drawer-content-width,auto) transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] flex-col bg-popover text-sm text-popover-foreground transition-[transform,height,opacity,filter,rotate] duration-(--drawer-duration) ease-(--drawer-ease) will-change-transform outline-none select-none [interpolate-size:allow-keywords] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=left]:rounded-r-xl data-[swipe-direction=left]:border-r data-[swipe-direction=right]:rounded-l-xl data-[swipe-direction=right]:border-l data-[swipe-direction=up]:rounded-b-xl data-[swipe-direction=up]:border-b",
            // Nested.
            "data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95",
            // Bleed.
            "after:pointer-events-none after:absolute after:bg-(--drawer-bleed-background,var(--color-popover)) data-[swipe-axis=x]:after:inset-y-0 data-[swipe-axis=x]:after:w-(--bleed) data-[swipe-axis=y]:after:inset-x-0 data-[swipe-axis=y]:after:h-(--bleed) data-[swipe-direction=down]:after:top-full data-[swipe-direction=left]:after:right-full data-[swipe-direction=right]:after:left-full data-[swipe-direction=up]:after:bottom-full",
            // Sizing.
            "[--drawer-content-height:var(--drawer-height,auto)] data-[swipe-axis=x]:[--drawer-content-width:75%] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem)] data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh] data-[swipe-axis=x]:sm:[--drawer-content-width:32rem]",
            // Stack.
            "[--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]",
            // Transitions.
            "data-ending-style:transform-(--closed-transform) data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-(--closed-transform) data-swiping:duration-0 data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            // Top/bottom drawers: centred column.
            "data-[swipe-axis=y]:inset-x-0 data-[swipe-axis=y]:min-h-[45vh] data-[swipe-axis=y]:w-auto data-[swipe-axis=y]:data-nested-drawer-open:h-(--stack-height)",
            // Axis: x.
            "data-[swipe-axis=x]:inset-y-0 data-[swipe-axis=x]:flex-row",
            // Direction: down.
            "data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:origin-bottom data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]",
            // Direction: up.
            "data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:origin-top data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))]",
            // Direction: left.
            "data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))]",
            // Direction: right.
            "data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]",
            // Tilt with the drag.
            swipeTilt &&
              "data-[swipe-axis=x]:rotate-[atan2(var(--drawer-swipe-movement-x,0px),3000px)] data-[swipe-axis=y]:rotate-[atan2(var(--drawer-swipe-movement-y,0px),3000px)]",
            fade && "data-ending-style:opacity-0 data-starting-style:opacity-0",
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] select-text group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-swiping/drawer-popup:select-none"
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

/** Wraps the page behind drawers. */
function DrawerProvider({ ...props }: DrawerPrimitive.Provider.Props) {
  return <DrawerPrimitive.Provider {...props} />
}

/** Optional colour behind the indented page. */
function DrawerIndentBackground({
  className,
  ...props
}: DrawerPrimitive.IndentBackground.Props) {
  return (
    <DrawerPrimitive.IndentBackground
      data-slot="drawer-indent-background"
      className={cn("absolute inset-0 -z-10 rounded-[inherit]", className)}
      {...props}
    />
  )
}

/** Page behind: shrinks while drawer opens. */
function DrawerIndent({
  className,
  scale = true,
  ...props
}: DrawerPrimitive.Indent.Props & {
  /** Shrink and round while open. */
  scale?: boolean
}) {
  return (
    <DrawerPrimitive.Indent
      data-slot="drawer-indent"
      className={cn(
        "origin-top transition-[scale,border-radius,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        scale &&
          "data-active:translate-y-[2vh] data-active:scale-[0.94] data-active:overflow-hidden data-active:rounded-2xl",
        className
      )}
      {...props}
    />
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 flex-col gap-1 px-6 py-4 group-data-[swipe-axis=y]/drawer-popup:text-center md:gap-0.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2 px-6 py-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-balance text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerProvider,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
export type { DrawerOpenAnimation }
