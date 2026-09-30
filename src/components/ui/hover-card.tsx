"use client"

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useReducedMotion, useSpring, type MotionValue } from "motion/react"


type HoverCardRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl"
type HoverCardAnimation = "scale" | "fade"

type HoverCardMotion = {
  contentAnimation: HoverCardAnimation
  /** Start scale, 0–1. */
  startScale: number
  /** Hover delay before opening, ms. */
  openDelay: number
  /** Delay before closing, ms. */
  closeDelay: number
  /** Card drifts with the pointer. */
  followCursor: boolean
  /** Content fades in after the card. */
  contentFade: boolean
  /** Link underline draws on hover. */
  underline: boolean
  rounded: HoverCardRounded
}

const ROUNDED: Record<HoverCardRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
}

/** Fades content in, no movement. */
function fadeInContent(card: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  for (const child of card.querySelectorAll<HTMLElement>(":scope > *")) {
    child.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 350,
      delay: 80,
      easing: "cubic-bezier(0.45, 0, 0.55, 1)",
      fill: "backwards",
    })
  }
}

/** Drift per pixel off centre. */
const FOLLOW_STRENGTH = 0.35

const HoverCardContext = React.createContext<{
  motion: HoverCardMotion
  follow: MotionValue<number>
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

function useHoverCard() {
  const context = React.useContext(HoverCardContext)
  if (!context) throw new Error("HoverCard parts must be used inside <HoverCard>.")
  return context
}

function HoverCard({
  contentAnimation = "scale",
  startScale = 0.9,
  openDelay = 400,
  closeDelay = 200,
  followCursor = false,
  contentFade = true,
  underline = true,
  rounded = "lg",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: PreviewCardPrimitive.Root.Props & Partial<HoverCardMotion>) {
  const follow = useMotionValue(0)
  // Controlled so taps can toggle it.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const context = React.useMemo(
    () => ({
      follow,
      open,
      setOpen: setUncontrolledOpen,
      motion: {
        contentAnimation,
        startScale,
        openDelay,
        closeDelay,
        followCursor,
        contentFade,
        underline,
        rounded,
      },
    }),
    [follow, open, contentAnimation, startScale, openDelay, closeDelay, followCursor, contentFade, underline, rounded]
  )
  return (
    <HoverCardContext.Provider value={context}>
      <PreviewCardPrimitive.Root
        data-hpx-slot="hover-card"
        open={open}
        onOpenChange={(next, details) => {
          setUncontrolledOpen(next)
          onOpenChange?.(next, details)
        }}
        {...props}
      />
    </HoverCardContext.Provider>
  )
}

function HoverCardTrigger({
  className,
  onPointerMove,
  onPointerDown,
  onClick,
  ...props
}: PreviewCardPrimitive.Trigger.Props) {
  const { motion: options, follow, open, setOpen } = useHoverCard()
  const pointerType = React.useRef("mouse")
  return (
    <PreviewCardPrimitive.Trigger
      data-hpx-slot="hover-card-trigger"
      delay={options.openDelay}
      closeDelay={options.closeDelay}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        pointerType.current = event.pointerType
      }}
      onClick={(event) => {
        onClick?.(event)
        // Touch: tap toggles instead of navigating.
        if (pointerType.current === "mouse") return
        event.preventDefault()
        setOpen(!open)
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (!options.followCursor) return
        const rect = event.currentTarget.getBoundingClientRect()
        follow.set((event.clientX - (rect.left + rect.width / 2)) * FOLLOW_STRENGTH)
      }}
      className={(state) =>
        cn(
          options.underline &&
            "relative after:absolute after:inset-x-0 after:bottom-[0.08em] after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-popup-open:after:scale-x-100",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const { motion: options, follow } = useHoverCard()
  const reduceMotion = useReducedMotion()
  const x = useSpring(follow, { stiffness: 260, damping: 26 })

  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      // Start centred under the link.
      follow.jump(0)
      x.jump(0)
      if (options.contentFade) fadeInContent(node)
    },
    [follow, x, options.contentFade]
  )

  const scale = options.contentAnimation === "scale" ? options.startScale : 1

  return (
    <PreviewCardPrimitive.Portal data-hpx-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
        style={{ "--hc-travel": "0.75rem", "--hc-scale": scale } as React.CSSProperties}
      >
        <PreviewCardPrimitive.Popup
          ref={attach}
          data-hpx-slot="hover-card-content"
          render={<motion.div style={{ x: options.followCursor && !reduceMotion ? x : 0 }} />}
          className={cn(
            "z-50 w-72 origin-(--transform-origin) bg-muted px-5 py-4 text-sm text-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
            "transition-[opacity,scale,translate] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:duration-150 data-ending-style:ease-in motion-reduce:transition-opacity",
            "data-starting-style:scale-(--hc-scale) data-starting-style:opacity-0 data-ending-style:scale-(--hc-scale) data-ending-style:opacity-0",
            "data-[side=bottom]:data-starting-style:-translate-y-(--hc-travel) data-[side=top]:data-starting-style:translate-y-(--hc-travel) data-[side=left]:data-starting-style:translate-x-(--hc-travel) data-[side=right]:data-starting-style:-translate-x-(--hc-travel)",
            "data-[side=bottom]:data-ending-style:-translate-y-(--hc-travel) data-[side=top]:data-ending-style:translate-y-(--hc-travel) data-[side=left]:data-ending-style:translate-x-(--hc-travel) data-[side=right]:data-ending-style:-translate-x-(--hc-travel)",
            ROUNDED[options.rounded],
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard as HpxHoverCard, HoverCardTrigger as HpxHoverCardTrigger, HoverCardContent as HpxHoverCardContent }
export type { HoverCardAnimation as HpxHoverCardAnimation, HoverCardRounded as HpxHoverCardRounded }
