"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react"

/** glide: a pill slides to the active tab. underline: its background and a bar slide there. fade: they fade in place. */
type TabsIndicator = "glide" | "underline" | "fade"
/** slide: content leaves one way and arrives from the other. fade: it fades out, then the next fades in. */
type TabsContentMotion = "slide" | "fade" | "none"
type TabsActiveColor = "primary" | "muted"
type TabsRounded = "none" | "sm" | "md" | "lg" | "xl" | "full"

type TabsMotion = {
  activeIndicator: TabsIndicator
  contentAnimation: TabsContentMotion
  /** Background of the active tab. */
  activeColor: TabsActiveColor
  /** How far the content slides, in px. */
  slideDistance: number
  /** Seconds. How long the indicator and a sliding panel take. */
  duration: number
  bounce: number
  /** Seconds each way, for the fade out and the fade in of the "fade" content. */
  fadeDuration: number
  /** The panel grows and shrinks to fit the content instead of jumping. */
  smoothHeight: boolean
  /** A soft highlight follows the pointer over the tabs. */
  hoverHighlight: boolean
  /** A line under the row of tabs, between the tabs and the content. */
  divider: boolean
  /** A box border around the row of tabs. */
  listBorder: boolean
  /** Border around the content panel. */
  panelBorder: boolean
  rounded: TabsRounded
}

const ROUNDED: Record<TabsRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const ACTIVE_BG: Record<TabsActiveColor, string> = {
  primary: "bg-primary",
  muted: "bg-muted ring-1 ring-foreground/10",
}

const ACTIVE_TEXT: Record<TabsActiveColor, string> = {
  primary: "text-primary-foreground",
  muted: "text-foreground",
}

// Slow at both ends, so the fade never looks like it starts or stops abruptly
const fadeEase = [0.45, 0, 0.25, 1] as const

type TabsContextValue = TabsMotion & {
  id: string
  value: string
  /** 1 when the new tab is further right, -1 when it is further left. */
  direction: number
  hovered: string | null
  setHovered: (value: string | null) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("Tabs parts must be used inside <Tabs>.")
  return context
}

// With reduced motion on, every move lands instantly. Otherwise the transition is unchanged.
function useMotionOk(transition: Transition): Transition {
  return useReducedMotion() ? { duration: 0 } : transition
}

function Tabs({
  activeIndicator = "glide",
  contentAnimation = "slide",
  activeColor = "primary",
  slideDistance = 40,
  duration = 0.35,
  bounce = 0.15,
  fadeDuration = 0.35,
  smoothHeight = true,
  hoverHighlight = false,
  divider = true,
  listBorder = false,
  panelBorder = false,
  rounded = "lg",
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  ...props
}: Omit<TabsPrimitive.Root.Props, "render"> & Partial<TabsMotion>) {
  const id = React.useId()
  const root = React.useRef<HTMLDivElement>(null)
  const [own, setOwn] = React.useState(String(defaultValue ?? ""))
  const value = valueProp === undefined ? own : String(valueProp)
  const [direction, setDirection] = React.useState(1)
  const [hovered, setHovered] = React.useState<string | null>(null)

  const context = React.useMemo(
    () => ({
      id,
      value,
      direction,
      hovered,
      setHovered,
      activeIndicator,
      contentAnimation,
      activeColor,
      slideDistance,
      duration,
      bounce,
      fadeDuration,
      smoothHeight,
      hoverHighlight,
      divider,
      listBorder,
      panelBorder,
      rounded,
    }),
    [
      id,
      value,
      direction,
      hovered,
      activeIndicator,
      contentAnimation,
      activeColor,
      slideDistance,
      duration,
      bounce,
      fadeDuration,
      smoothHeight,
      hoverHighlight,
      divider,
      listBorder,
      panelBorder,
      rounded,
    ]
  )

  return (
    <TabsContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <TabsPrimitive.Root
          ref={root}
          data-hpx-slot="tabs"
          value={value}
          onValueChange={(next, details) => {
            // Which way the content should travel, from where the two tabs sit in the row
            const values = [...(root.current?.querySelectorAll<HTMLElement>('[data-hpx-slot="tabs-trigger"]') ?? [])].map(
              (el) => el.dataset.value
            )
            setDirection(values.indexOf(String(next)) >= values.indexOf(value) ? 1 : -1)
            setOwn(String(next))
            onValueChange?.(next, details)
          }}
          className={cn("flex flex-col gap-4", className)}
          {...props}
        />
      </MotionConfig>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: Omit<TabsPrimitive.List.Props, "render">) {
  const { activeIndicator, rounded, listBorder, divider } = useTabs()
  const pill = activeIndicator === "glide"

  return (
    // The line sits right under the tabs; the pill row gets a little air above it
    <div data-hpx-slot="tabs-header" className={cn("flex min-w-0 flex-col", pill && "gap-3")}>
      {/* On a narrow screen the row scrolls sideways, with no scrollbar, and is clipped at its border */}
      <div
        data-hpx-slot="tabs-scroll"
        className={cn(
          "max-w-full overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden",
          pill && "w-fit",
          (pill || listBorder) && ROUNDED[rounded],
          listBorder && "border"
        )}
      >
        <TabsPrimitive.List
          data-hpx-slot="tabs-list"
          // Arrow keys move to the next tab and show its content straight away
          activateOnFocus
          className={cn(
            "relative flex w-max items-center",
            pill ? "gap-1 p-1" : "min-w-full gap-2",
            listBorder && !pill && "p-1",
            className
          )}
          {...props}
        />
      </div>
      {divider && <div aria-hidden data-hpx-slot="tabs-divider" className="h-px w-full bg-border" />}
    </div>
  )
}

function TabsTrigger({
  value,
  className,
  children,
  ...props
}: Omit<TabsPrimitive.Tab.Props, "render">) {
  const c = useTabs()
  const active = c.value === value
  const move = useMotionOk({ type: "spring", duration: c.duration * 0.6, bounce: c.bounce })
  const quick = useMotionOk({ duration: 0.25, ease: fadeEase })
  const bg = cn("absolute inset-0 z-0", ACTIVE_BG[c.activeColor], ROUNDED[c.rounded])
  // Inside the tab (not hanging below it), so the scrolling row never clips or scrolls vertically
  const bar = "absolute inset-x-3 bottom-0 z-0 h-0.5 rounded-full bg-primary"

  // When the row scrolls, bring the tab you switched to into view
  const tabRef = React.useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()
  const seen = React.useRef(false)
  React.useEffect(() => {
    if (!seen.current) {
      seen.current = true
      return
    }
    const el = tabRef.current
    const scroller = el?.closest<HTMLElement>('[data-hpx-slot="tabs-scroll"]')
    if (!active || !el || !scroller) return
    const left = el.offsetLeft
    const right = left + el.offsetWidth
    if (left >= scroller.scrollLeft && right <= scroller.scrollLeft + scroller.clientWidth) return
    scroller.scrollTo({
      left: left - (scroller.clientWidth - el.offsetWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    })
  }, [active, reduceMotion])

  return (
    <TabsPrimitive.Tab
      ref={tabRef}
      value={value}
      id={`${c.id}-tab-${value}`}
      data-hpx-slot="tabs-trigger"
      data-value={value}
      onPointerEnter={() => c.setHovered(value)}
      onPointerLeave={() => c.setHovered(null)}
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center justify-center px-4 py-2 text-lg font-medium whitespace-nowrap outline-none max-md:px-3",
        "transition-colors duration-200 motion-reduce:transition-none",
        // Inside the tab, so the scrolling row doesn't clip the focus ring
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        "hpx-disabled:cursor-not-allowed hpx-disabled:opacity-50",
        ROUNDED[c.rounded],
        // Only the glide pill has a fill behind the text; the underline modes are just the bar
        active
          ? c.activeIndicator === "glide"
            ? ACTIVE_TEXT[c.activeColor]
            : "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {c.hoverHighlight && c.hovered === value && !active && (
          <motion.span
            key="hover"
            aria-hidden
            layoutId={`${c.id}-hover`}
            className={cn("absolute inset-0 z-0 bg-foreground/8", ROUNDED[c.rounded])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={move}
          />
        )}
      </AnimatePresence>

      {c.activeIndicator === "glide" && active && (
        <motion.span aria-hidden layoutId={`${c.id}-pill`} className={bg} transition={move} />
      )}

      {c.activeIndicator === "underline" && active && (
        <motion.span aria-hidden layoutId={`${c.id}-line`} className={bar} transition={move} />
      )}

      {c.activeIndicator === "fade" && (
        <motion.span
          aria-hidden
          className={bar}
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={quick}
        />
      )}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Tab>
  )
}

// Measures the content so the panel can grow and shrink to fit it
function useHeight() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0].blockSize))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, height] as const
}

/** Holds the panels and plays the content motion as tabs change. Put the `TabsContent`s inside it. */
function TabsPanels({ className, children }: { className?: string; children: React.ReactNode }) {
  const c = useTabs()
  const [measure, height] = useHeight()
  const grow = useMotionOk({ type: "spring", duration: 0.4, bounce: 0 })

  const active = React.Children.toArray(children).find(
    (child) => React.isValidElement<{ value: string }>(child) && child.props.value === c.value
  )

  return (
    <div
      data-hpx-slot="tabs-panels"
      className={cn("overflow-hidden", c.panelBorder && "border", ROUNDED[c.rounded], className)}
    >
      <motion.div
        initial={false}
        animate={{ height: c.smoothHeight && height !== null ? height : "auto" }}
        transition={grow}
      >
        <div ref={measure}>
          <AnimatePresence mode="wait" initial={false} custom={c.direction}>
            {active}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const c = useTabs()
  const reduceMotion = useReducedMotion()
  const slide = c.contentAnimation === "slide" && !reduceMotion
  const still = c.contentAnimation === "none" || reduceMotion
  const fade = c.fadeDuration

  const variants: Variants = {
    enter: (d: number) => ({ opacity: still ? 1 : 0, x: slide ? d * c.slideDistance : 0 }),
    center: {
      opacity: 1,
      x: 0,
      transition: still
        ? { duration: 0 }
        : c.contentAnimation === "slide"
          ? { type: "spring", duration: c.duration, bounce: c.bounce }
          : { duration: fade, ease: fadeEase },
    },
    exit: (d: number) => ({
      opacity: still ? 1 : 0,
      x: slide ? -d * c.slideDistance : 0,
      // Sliding out is quick so the switch never feels slow; a fade uses its own duration each way
      transition: still
        ? { duration: 0 }
        : c.contentAnimation === "slide"
          ? { duration: c.duration * 0.5, ease: "easeIn" }
          : { duration: fade, ease: fadeEase },
    }),
  }

  return (
    <motion.div
      key={value}
      role="tabpanel"
      id={`${c.id}-panel-${value}`}
      aria-labelledby={`${c.id}-tab-${value}`}
      tabIndex={0}
      data-hpx-slot="tabs-content"
      custom={c.direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn(
        "flex flex-col gap-2 p-6 text-lg outline-none max-md:p-4 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export { Tabs as HpxTabs, TabsList as HpxTabsList, TabsTrigger as HpxTabsTrigger, TabsPanels as HpxTabsPanels, TabsContent as HpxTabsContent }
export type { TabsIndicator as HpxTabsIndicator, TabsContentMotion as HpxTabsContentMotion, TabsActiveColor as HpxTabsActiveColor, TabsRounded as HpxTabsRounded }
