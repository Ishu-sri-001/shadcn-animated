"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ClockIcon, ReplyIcon, RotateCwIcon } from "lucide-react"
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

const spring = { type: "spring", visualDuration: 0.4, bounce: 0.3 } as const
const bouncy = { type: "spring", visualDuration: 0.35, bounce: 0.5 } as const

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

// Set by BubbleThread: bubbles and groups ease into place when a new message
// pushes them up.
const BubbleThreadContext = React.createContext({ makeRoom: false })

/**
 * Scrolling conversation. Messages sit at the bottom and it follows new ones
 * while the reader is near the bottom.
 */
function BubbleThread({
  className,
  makeRoom = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** Earlier messages slide up smoothly when a new one arrives, instead of jumping. */
  makeRoom?: boolean
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const content = React.useRef<HTMLDivElement>(null)
  const context = React.useMemo(() => ({ makeRoom }), [makeRoom])

  React.useEffect(() => {
    const el = scroller.current
    const inner = content.current
    if (!el || !inner) return
    let lastHeight = inner.offsetHeight
    const observer = new ResizeObserver(() => {
      const grewBy = inner.offsetHeight - lastHeight
      lastHeight = inner.offsetHeight
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight - grewBy
      if (grewBy > 0 && distanceFromBottom < 120) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      }
    })
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <BubbleThreadContext.Provider value={context}>
        <motion.div
          ref={scroller}
          // Lets Motion measure layout correctly inside the scrolling area.
          layoutScroll
          data-slot="bubble-thread"
          className={cn("overflow-y-auto overscroll-contain", className)}
          {...(props as HTMLMotionProps<"div">)}
        >
          <div ref={content} className="flex min-h-full flex-col justify-end gap-4">
            {children}
          </div>
        </motion.div>
      </BubbleThreadContext.Provider>
    </MotionConfig>
  )
}

// Flattens the corners where consecutive bubbles from one sender meet.
const joinedCorners = cn(
  "gap-0.5 [&_[data-slot=bubble-content]]:transition-[border-radius] [&_[data-slot=bubble-content]]:duration-300",
  "[&>[data-align=start]:not(:first-child)>[data-slot=bubble-content]]:rounded-tl-sm",
  "[&>[data-align=start]:not(:last-child)>[data-slot=bubble-content]]:rounded-bl-sm",
  "[&>[data-align=end]:not(:first-child)>[data-slot=bubble-content]]:rounded-tr-sm",
  "[&>[data-align=end]:not(:last-child)>[data-slot=bubble-content]]:rounded-br-sm"
)

function BubbleGroup({
  className,
  joined = false,
  ...props
}: React.ComponentProps<"div"> & {
  /** Consecutive bubbles get flatter corners where they meet, easing as messages join. */
  joined?: boolean
}) {
  const { makeRoom } = React.useContext(BubbleThreadContext)

  return (
    <motion.div
      data-slot="bubble-group"
      layout={makeRoom ? "position" : undefined}
      transition={{ layout: spring }}
      className={cn("flex min-w-0 flex-col gap-2", joined && joinedCorners, className)}
      {...(props as HTMLMotionProps<"div">)}
    />
  )
}

const bubbleVariants = cva(
  "group/bubble relative isolate flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80",
        secondary:
          "*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        muted:
          "*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
        tinted:
          "*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] *:data-[slot=bubble-content]:text-foreground dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]",
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50",
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Pops up from the corner nearest the sender; `custom` is the delay.
const enterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 12 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...spring, delay },
  }),
}

const DEFAULT_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"]
// Hover (mouse) or press (touch) this long before the reaction picker opens.
const PICKER_DELAY_MS = 450
// How far (px) a bubble has to move sideways to count as a swipe to reply.
const SWIPE_THRESHOLD = 40

function Bubble({
  variant = "default",
  align = "start",
  className,
  enter = true,
  enterDelay = 0,
  enterFrom,
  shake = true,
  lift = false,
  time,
  revealTime = false,
  swipeToReply = true,
  onReply,
  onReact,
  doubleClickReact = true,
  picker = true,
  magnify = false,
  reactions = DEFAULT_REACTIONS,
  ref,
  style,
  children,
  onDoubleClick,
  onMouseDown,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end"
    /** Pops in from the sender's side when mounted. */
    enter?: boolean
    /** Wait before popping in, in seconds; stagger a batch by passing index × gap. */
    enterDelay?: number
    /** Rect (e.g. the message input's) the text flies from into the bubble when mounted. */
    enterFrom?: { x: number; y: number; width: number; height: number }
    /** Shakes sideways when the variant changes to "destructive" (e.g. a failed send). */
    shake?: boolean
    /** Lifts slightly on hover and squishes when pressed. */
    lift?: boolean
    /** Time the message was sent, e.g. "9:41". */
    time?: string
    /** Slides `time` out beside the bubble on hover. */
    revealTime?: boolean
    /** Drag the bubble sideways to reply; calls `onReply`. */
    swipeToReply?: boolean
    onReply?: () => void
    /** Called with an emoji from a double-click or the reaction picker. */
    onReact?: (emoji: string) => void
    /** Double-click reacts with ❤️ and bursts hearts from the pointer. Needs `onReact`. */
    doubleClickReact?: boolean
    /** Hover (or long-press on touch) opens a row of emojis that magnify under the pointer. Needs `onReact`. */
    picker?: boolean
    /** Picker emojis grow and lift under the pointer, like the macOS Dock. */
    magnify?: boolean
    /** Emojis offered by the picker. */
    reactions?: string[]
  }) {
  const reduceMotion = useReducedMotion()
  const { makeRoom } = React.useContext(BubbleThreadContext)
  const node = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [bursts, setBursts] = React.useState<{ id: number; x: number; y: number }[]>([])
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const pickerTimer = React.useRef<number | undefined>(undefined)

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el
      assignRef(ref, el)
    },
    [ref]
  )

  const canSwipe = swipeToReply && onReply !== undefined
  const canPick = picker && onReact !== undefined

  // Fly in: a copy of the text travels from the input into the bubble. It
  // re-reads the bubble's position every frame, so it lands correctly even
  // while the thread scrolls or makes room.
  const flyFrom = React.useRef(enterFrom)
  React.useLayoutEffect(() => {
    const from = flyFrom.current
    const content = node.current?.querySelector<HTMLElement>(":scope > [data-slot=bubble-content]")
    if (!from || !content || reduceMotion) return
    const rect = content.getBoundingClientRect()
    const computed = getComputedStyle(content)
    const ghost = content.cloneNode(true) as HTMLElement
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${from.x}px`,
      top: `${from.y + (from.height - rect.height) / 2}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "50",
      pointerEvents: "none",
      transform: "none",
      // Colours come from the Bubble's selectors, which don't reach the copy.
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
    })
    document.body.append(ghost)
    content.style.visibility = "hidden"
    const start = { x: from.x, y: from.y + (from.height - rect.height) / 2 }
    const flight = animate(0, 1, {
      type: "spring",
      visualDuration: 0.5,
      bounce: 0.15,
      onUpdate: (p) => {
        const target = content.getBoundingClientRect()
        ghost.style.left = `${start.x + (target.left - start.x) * p}px`
        ghost.style.top = `${start.y + (target.top - start.y) * p}px`
        ghost.style.opacity = String(0.4 + 0.6 * Math.min(p, 1))
      },
    })
    const land = () => {
      ghost.remove()
      content.style.visibility = ""
    }
    flight.then(land)
    return () => {
      flight.stop()
      land()
    }
    // Plays once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Shake when a send fails.
  const lastVariant = React.useRef(variant)
  React.useEffect(() => {
    const was = lastVariant.current
    lastVariant.current = variant
    if (!shake || reduceMotion || variant !== "destructive" || was === "destructive") return
    animate(x, [0, -8, 8, -5, 5, -2, 0], { duration: 0.45, ease: "easeOut" })
  }, [variant, shake, reduceMotion, x])

  React.useEffect(() => () => window.clearTimeout(pickerTimer.current), [])

  // Reply arrow stays put while the bubble slides away from it.
  const arrowX = useTransform(x, (v) => -v)
  const arrowProgress = useTransform(x, (v) => Math.min(Math.abs(v) / SWIPE_THRESHOLD, 1))
  const arrowScale = useTransform(arrowProgress, [0, 1], [0.4, 1])

  const flying = enterFrom !== undefined

  return (
    <motion.div
      ref={setRef}
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(
        bubbleVariants({ variant }),
        // Above the next bubble, which the reaction badge overlaps; higher
        // still while the picker or a heart burst is showing.
        "has-data-[slot=bubble-reactions]:z-10",
        (pickerOpen || bursts.length > 0) && "z-20",
        lift &&
          "*:data-[slot=bubble-content]:transition-shadow *:data-[slot=bubble-content]:duration-300 hover:*:data-[slot=bubble-content]:shadow-md",
        className
      )}
      style={{ ...style, x, originX: align === "end" ? 1 : 0, originY: 1 }}
      custom={enterDelay}
      variants={enterVariants}
      initial={enter && !flying ? "hidden" : false}
      animate="visible"
      layout={makeRoom ? "position" : undefined}
      transition={{ layout: spring }}
      whileHover={lift ? { y: -2 } : undefined}
      whileTap={lift ? { scale: 0.98 } : undefined}
      drag={canSwipe ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      // Only toward the middle of the thread.
      dragElastic={align === "end" ? { left: 0.5, right: 0 } : { left: 0, right: 0.5 }}
      dragDirectionLock
      onDragStart={() => {
        window.clearTimeout(pickerTimer.current)
        setPickerOpen(false)
      }}
      onDragEnd={() => {
        if (Math.abs(x.get()) >= SWIPE_THRESHOLD) onReply?.()
      }}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        // Stop a double-click from selecting a word.
        if (doubleClickReact && onReact && event.detail > 1) event.preventDefault()
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (!doubleClickReact || !onReact) return
        onReact("❤️")
        if (reduceMotion || !node.current) return
        const box = node.current.getBoundingClientRect()
        const burst = { id: event.timeStamp, x: event.clientX - box.left, y: event.clientY - box.top }
        setBursts((current) => [...current, burst])
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (!canPick || event.pointerType !== "mouse") return
        window.clearTimeout(pickerTimer.current)
        pickerTimer.current = window.setTimeout(() => setPickerOpen(true), PICKER_DELAY_MS)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        window.clearTimeout(pickerTimer.current)
        if (event.pointerType === "mouse") {
          pickerTimer.current = window.setTimeout(() => setPickerOpen(false), 150)
        }
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        // Long-press on touch.
        if (!canPick || event.pointerType === "mouse") return
        window.clearTimeout(pickerTimer.current)
        pickerTimer.current = window.setTimeout(() => setPickerOpen(true), PICKER_DELAY_MS)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        if (event.pointerType !== "mouse") window.clearTimeout(pickerTimer.current)
      }}
      {...(props as HTMLMotionProps<"div">)}
    >
      {canSwipe && (
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 -z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground",
            align === "end" ? "right-0" : "left-0"
          )}
          style={{ x: arrowX, opacity: arrowProgress, scale: arrowScale }}
        >
          <ReplyIcon className={cn("size-4", align === "end" && "-scale-x-100")} />
        </motion.span>
      )}
      {children}
      {revealTime && time && (
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 px-2 text-xs whitespace-nowrap text-muted-foreground opacity-0 transition-[opacity,translate] duration-300 ease-out group-hover/bubble:translate-x-0 group-hover/bubble:opacity-100",
            align === "end" ? "right-full translate-x-2" : "left-full -translate-x-2"
          )}
        >
          {time}
        </span>
      )}
      <AnimatePresence>
        {canPick && pickerOpen && (
          <ReactionPicker
            key="picker"
            align={align}
            reactions={reactions}
            magnify={magnify}
            onPick={(emoji) => {
              setPickerOpen(false)
              onReact?.(emoji)
            }}
          />
        )}
      </AnimatePresence>
      {bursts.map((burst) => (
        <HeartBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          onDone={() => setBursts((current) => current.filter((b) => b.id !== burst.id))}
        />
      ))}
    </motion.div>
  )
}

/** Row of emojis above a bubble; with `magnify`, they grow under the pointer. */
function ReactionPicker({
  align,
  reactions,
  magnify,
  onPick,
}: {
  align: "start" | "end"
  reactions: string[]
  magnify: boolean
  onPick: (emoji: string) => void
}) {
  const scaleUnderPointer = (row: HTMLElement, pointerX: number | null) => {
    if (!magnify) return
    for (const button of row.querySelectorAll<HTMLElement>("[data-emoji]")) {
      const box = button.getBoundingClientRect()
      const distance = pointerX === null ? Infinity : Math.abs(pointerX - (box.left + box.width / 2))
      const scale = 1 + 0.6 * Math.max(0, 1 - distance / 64)
      animate(button, { scale, y: (1 - scale) * 10 }, { type: "spring", stiffness: 400, damping: 25 })
    }
  }

  return (
    <motion.div
      className={cn(
        // Padding (not margin) bridges the gap, so the pointer can reach it.
        "absolute bottom-full z-20 py-2",
        align === "end" ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
      )}
      initial={{ opacity: 0, y: 8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.8, transition: { duration: 0.15 } }}
      transition={bouncy}
    >
      <div
        role="toolbar"
        aria-label="React"
        className="flex items-end gap-2.5 rounded-full border bg-popover px-3 py-1.5 shadow-lg"
        onMouseMove={(event) => scaleUnderPointer(event.currentTarget, event.clientX)}
        onMouseLeave={(event) => scaleUnderPointer(event.currentTarget, null)}
      >
        {reactions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            data-emoji
            aria-label={`React with ${emoji}`}
            onClick={() => onPick(emoji)}
            className="origin-bottom rounded-full text-xl leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/** Hearts bursting out from a double-click. */
function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const hearts = 7
  return (
    <span aria-hidden className="pointer-events-none absolute z-30" style={{ left: x, top: y }}>
      {Array.from({ length: hearts }, (_, i) => {
        const angle = (i / hearts) * Math.PI * 2 - Math.PI / 2
        const distance = 26 + (i % 2) * 12
        return (
          <motion.span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-xs"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance - 8,
              scale: 1,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            ❤️
          </motion.span>
        )
      })}
      <motion.span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1.4, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.4, 1] }}
        onAnimationComplete={onDone}
      >
        ❤️
      </motion.span>
    </span>
  )
}

function BubbleContent({
  className,
  render,
  typing = false,
  layoutId,
  children,
  ...props
}: useRender.ComponentProps<"div"> & {
  /** Shows bouncing dots; when it turns false, the bubble grows to fit the message. */
  typing?: boolean
  /** Shared layout id, e.g. to morph a BubbleSuggestion into this message. */
  layoutId?: string
}) {
  return useRender({
    defaultTagName: "div",
    // A Motion element by default, so size changes (typing → message,
    // streaming text) ease instead of jumping.
    render: render ?? (
      <motion.div layout layoutId={layoutId} transition={{ layout: spring }} />
    ),
    props: mergeProps<"div">(
      {
        className: cn(
          "relative w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50",
          className
        ),
        children: render ? (
          children
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={typing ? "typing" : "message"}
              // Keeps the text undistorted while the bubble resizes.
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {typing ? <TypingDots /> : children}
            </motion.div>
          </AnimatePresence>
        ),
      },
      props
    ),
    state: {
      slot: "bubble-content",
    },
  })
}

function TypingDots() {
  return (
    <span role="status" aria-label="Typing" className="flex h-lh items-center gap-1 px-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-current"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  )
}

/**
 * Message text. Words added after mount (streaming) fade in; long text
 * collapses behind "Show more".
 */
function BubbleText({
  className,
  text,
  fade = true,
  collapsible = true,
  lines = 6,
}: {
  className?: string
  text: string
  /** Words added after mount fade in one by one, e.g. while a reply streams in. */
  fade?: boolean
  /** Text over `lines` lines collapses with a fade and a "Show more" button. */
  collapsible?: boolean
  lines?: number
}) {
  const words = text.split(/(\s+)/)
  // Words present on mount show at once; only later ones fade in.
  const [initialWords] = React.useState(words.length)
  const [expanded, setExpanded] = React.useState(false)
  const [overflowing, setOverflowing] = React.useState(false)
  const inner = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = inner.current
    if (!el || !collapsible) return
    const observer = new ResizeObserver(() => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
      setOverflowing(el.offsetHeight > lineHeight * lines + 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [collapsible, lines])

  const canCollapse = collapsible && overflowing
  const collapsed = canCollapse && !expanded

  return (
    <div data-slot="bubble-text" className={cn("flex flex-col gap-1", className)}>
      <motion.div
        initial={false}
        // Line height is 1.625 (leading-relaxed), so this is `lines` lines.
        animate={{ height: collapsed ? `${lines * 1.625}em` : "auto" }}
        transition={spring}
        className={cn(
          "overflow-hidden",
          collapsed && "mask-[linear-gradient(to_bottom,black_55%,transparent)]"
        )}
      >
        <div ref={inner}>
          {words.map((word, i) =>
            fade && i >= initialWords ? (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.35 }}
              >
                {word}
              </motion.span>
            ) : (
              <React.Fragment key={i}>{word}</React.Fragment>
            )
          )}
        </div>
      </motion.div>
      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "relative self-start text-xs font-medium opacity-80 outline-none",
            // Underline draws in from the left on hover and retracts to the right.
            "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
            "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
          )}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
)

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  pop = true,
  count,
  rolling = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end"
  side?: "top" | "bottom"
  /** Springs in from nothing, and the emoji wiggles each time `count` changes. */
  pop?: boolean
  /** Total reactions, shown after the emoji. */
  count?: number
  /** The count rolls digit by digit to its new value. */
  rolling?: boolean
}) {
  // Wiggle only on changes, not on mount.
  const [initialCount] = React.useState(count)
  const changed = count !== initialCount

  return (
    <motion.div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      initial={pop ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={pop ? { scale: 0, opacity: 0 } : undefined}
      transition={bouncy}
      {...(props as HTMLMotionProps<"div">)}
    >
      <motion.span
        key={pop && changed ? count : "still"}
        className="flex gap-0.5"
        initial={false}
        animate={pop && changed ? { rotate: [0, -18, 14, -8, 0], scale: [1, 1.3, 1] } : undefined}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.span>
      {count !== undefined && <RollingNumber value={count} rolling={rolling} />}
    </motion.div>
  )
}

function RollingNumber({ value, rolling }: { value: number; rolling: boolean }) {
  const text = String(value)
  if (!rolling) return <span className="tabular-nums">{text}</span>
  const digits = text.split("")
  return (
    <span className="tabular-nums">
      <span className="sr-only">{text}</span>
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

type BubbleStatusValue = "sending" | "sent" | "delivered" | "read" | "failed"

const statusLabels: Record<BubbleStatusValue, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not delivered",
}

/** Delivery status under a message: ✓ sent, ✓✓ delivered, coloured ✓✓ read, or retry. */
function BubbleStatus({
  className,
  status,
  animated = true,
  onRetry,
}: {
  className?: string
  status: BubbleStatusValue
  /** Ticks draw themselves in; the retry icon spins when clicked. */
  animated?: boolean
  onRetry?: () => void
}) {
  const [turns, setTurns] = React.useState(0)
  const draw = animated ? { pathLength: 0 } : false

  return (
    <div
      data-slot="bubble-status"
      className={cn(
        "flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground group-data-[align=end]/bubble:justify-end",
        // As wide as the bubble but never widening it (e.g. "Not delivered ·
        // Retry" under a short message), so the bubble doesn't jump sideways;
        // longer text spills past the bubble's outer edge.
        "w-0 min-w-full",
        status === "failed" && "text-destructive",
        className
      )}
    >
      {status === "failed" ? (
        <>
          <span>{statusLabels.failed} ·</span>
          <button
            type="button"
            onClick={() => {
              setTurns((t) => t + 1)
              onRetry?.()
            }}
            className="flex items-center gap-1 font-medium outline-none hover:underline focus-visible:underline"
          >
            <motion.span
              className="flex"
              animate={{ rotate: animated ? turns * 360 : 0 }}
              transition={{ type: "spring", visualDuration: 0.6, bounce: 0.2 }}
            >
              <RotateCwIcon className="size-3" />
            </motion.span>
            Retry
          </button>
        </>
      ) : (
        <>
          {status === "sending" ? (
            <ClockIcon className="size-3" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={cn(
                "size-3.5 transition-colors duration-500",
                status === "read" && "text-sky-500"
              )}
            >
              <motion.path
                d="M18 6 7 17l-5-5"
                initial={draw}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              {status !== "sent" && (
                <motion.path
                  d="m22 10-7.5 7.5L13 16"
                  initial={draw}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
            </svg>
          )}
          <span>{statusLabels[status]}</span>
        </>
      )}
    </div>
  )
}

/** Suggested replies that appear one after another. */
function BubbleSuggestions({
  className,
  stagger = true,
  ...props
}: React.ComponentProps<"div"> & {
  /** Suggestions pop in one after another instead of together. */
  stagger?: boolean
}) {
  return (
    <motion.div
      data-slot="bubble-suggestions"
      className={cn("flex flex-wrap justify-end gap-2", className)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
        visible: { transition: { staggerChildren: stagger ? 0.07 : 0, delayChildren: 0.1 } },
      }}
      {...(props as HTMLMotionProps<"div">)}
    />
  )
}

/**
 * One suggested reply. Give it a `layoutId` and the same one to the sent
 * message's BubbleContent, and it moves across and turns into that message.
 */
function BubbleSuggestion({ className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      type="button"
      data-slot="bubble-suggestion"
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ layout: spring }}
      className={cn(
        "w-fit rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export {
  BubbleThread,
  BubbleGroup,
  Bubble,
  BubbleContent,
  BubbleText,
  BubbleReactions,
  BubbleStatus,
  BubbleSuggestions,
  BubbleSuggestion,
  type BubbleStatusValue,
}
