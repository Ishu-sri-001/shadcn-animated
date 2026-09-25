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
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

const spring = { type: "spring", visualDuration: 0.4, bounce: 0.3 } as const
const bouncy = { type: "spring", visualDuration: 0.35, bounce: 0.5 } as const
const settle = { type: "spring", visualDuration: 0.3, bounce: 0 } as const

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

const BubbleThreadContext = React.createContext(false)

function BubbleThread({ className, children, ...props }: React.ComponentProps<"div">) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const content = React.useRef<HTMLDivElement>(null)

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

    let atBottom = true
    const onScroll = () => {
      atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8
    }
    const resize = new ResizeObserver(() => {
      if (atBottom) el.scrollTop = el.scrollHeight
    })
    el.addEventListener("scroll", onScroll, { passive: true })
    resize.observe(el)
    return () => {
      observer.disconnect()
      resize.disconnect()
      el.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <BubbleThreadContext.Provider value={true}>
        <motion.div
          ref={scroller}
          layoutScroll
          data-slot="bubble-thread"
          className={cn("overflow-y-auto overscroll-contain", className)}
          {...(props as HTMLMotionProps<"div">)}
        >
          <div ref={content} className="relative flex min-h-full flex-col justify-end gap-4">
            {children}
          </div>
        </motion.div>
      </BubbleThreadContext.Provider>
    </MotionConfig>
  )
}

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
  joined?: boolean
}) {
  const inThread = React.useContext(BubbleThreadContext)

  return (
    <motion.div
      data-slot="bubble-group"
      layout={inThread ? "position" : undefined}
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
const PICKER_DELAY_MS = 450
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
  selectable = true,
  time,
  revealTime = false,
  swipeToReply = true,
  onReply,
  onReact,
  onUnreact,
  reacted,
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
    enter?: boolean
    enterDelay?: number
    enterFrom?: { x: number; y: number; width: number; height: number }
    shake?: boolean
    lift?: boolean
    selectable?: boolean
    time?: string
    revealTime?: boolean
    swipeToReply?: boolean
    onReply?: () => void
    onReact?: (emoji: string) => void
    onUnreact?: (emoji: string) => void
    /** Emojis you've already reacted with. */
    reacted?: string[]
    doubleClickReact?: boolean
    picker?: boolean
    magnify?: boolean
    /** Emojis offered by the picker. */
    reactions?: string[]
  }) {
  const reduceMotion = useReducedMotion()
  const inThread = React.useContext(BubbleThreadContext)
  const node = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [bursts, setBursts] = React.useState<{ id: number; x: number; y: number }[]>([])
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerSide, setPickerSide] = React.useState<"top" | "bottom">("top")
  const dragControls = useDragControls()
  const pickerTimer = React.useRef<number | undefined>(undefined)

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el
      assignRef(ref, el)
    },
    [ref]
  )

  const canSwipe = swipeToReply && onReply !== undefined

  const openPicker = () => {
    const el = node.current
    const thread = el?.closest("[data-slot=bubble-thread]")
    if (el && thread) {
      const room = el.getBoundingClientRect().top - thread.getBoundingClientRect().top
      const needed = 3.25 * parseFloat(getComputedStyle(document.documentElement).fontSize)
      setPickerSide(room < needed ? "bottom" : "top")
    }
    setPickerOpen(true)
  }
  const canPick = picker && onReact !== undefined

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
      layout={inThread ? "position" : undefined}
      transition={{ layout: spring }}
      whileHover={lift ? { y: -2 } : undefined}
      whileTap={lift ? { scale: 0.98 } : undefined}
      drag={canSwipe ? "x" : false}
      dragListener={!selectable}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0 }}
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
        if (doubleClickReact && onReact && event.detail > 1) event.preventDefault()
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (!doubleClickReact || !onReact) return
        if (reacted?.includes("❤️") && onUnreact) {
          onUnreact("❤️")
          return
        }
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
        pickerTimer.current = window.setTimeout(openPicker, PICKER_DELAY_MS)
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
        if (canSwipe && selectable && (event.pointerType !== "mouse" || !isOverText(event))) {
          dragControls.start(event)
        }
        // Long-press on touch.
        if (!canPick || event.pointerType === "mouse") return
        window.clearTimeout(pickerTimer.current)
        pickerTimer.current = window.setTimeout(openPicker, PICKER_DELAY_MS)
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
            side={pickerSide}
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

function isOverText(event: React.PointerEvent<HTMLElement>) {
  const content = event.currentTarget.querySelector("[data-slot=bubble-content]")
  if (!content) return false
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        return true
      }
    }
  }
  return false
}

function ReactionPicker({
  align,
  side,
  reactions,
  magnify,
  onPick,
}: {
  align: "start" | "end"
  side: "top" | "bottom"
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
        "absolute z-20 py-2",
        side === "top" ? "bottom-full" : "top-full",
        align === "end" ? "right-0" : "left-0",
        side === "top"
          ? align === "end" ? "origin-bottom-right" : "origin-bottom-left"
          : align === "end" ? "origin-top-right" : "origin-top-left"
      )}
      initial={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.8, transition: { duration: 0.15 } }}
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
  grow = false,
  layoutId,
  children,
  ...props
}: useRender.ComponentProps<"div"> & {
  typing?: boolean
  grow?: boolean
  layoutId?: string
}) {
  const reduceMotion = useReducedMotion()
  const node = React.useRef<HTMLDivElement>(null)

  const wasTyping = React.useRef(typing)
  React.useLayoutEffect(() => {
    const was = wasTyping.current
    wasTyping.current = typing
    const el = node.current
    if (grow || !was || typing || !el || reduceMotion) return
    el.style.opacity = "0"
    animate(el, { opacity: [0, 1], scale: [0.85, 1] }, spring)
  }, [typing, grow, reduceMotion])

  return useRender({
    defaultTagName: "div",
    ref: node,
    render: render ?? (
      <motion.div layout={grow} layoutId={layoutId} transition={{ layout: spring }} />
    ),
    props: mergeProps<"div">(
      {
        className: cn(
          "relative w-fit max-w-full min-w-0 origin-bottom-left overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:origin-bottom-right group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50",
          className
        ),
        children: render ? (
          children
        ) : !grow ? (
          typing ? (
            <TypingDots />
          ) : (
            children
          )
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={typing ? "typing" : "message"}
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

function BubbleText({
  className,
  text,
  stream = false,
  wordDelay = 70,
  onStreamEnd,
  fade = true,
  collapsible = true,
  lines = 6,
  time,
}: {
  className?: string
  text: string
  time?: React.ReactNode
  stream?: boolean
  wordDelay?: number
  onStreamEnd?: () => void
  fade?: boolean
  collapsible?: boolean
  lines?: number
}) {
  const tokens = text.split(/(\s+)/)
  const [streams] = React.useState(stream)
  const [shown, setShown] = React.useState(streams ? 1 : tokens.length)
  const [initialWords] = React.useState(shown)
  const endStream = React.useEffectEvent(() => onStreamEnd?.())
  const total = tokens.length

  React.useEffect(() => {
    if (!streams) return
    let count = 1
    const timer = window.setInterval(() => {
      count = Math.min(count + 2, total)
      setShown(count)
      if (count >= total) {
        window.clearInterval(timer)
        endStream()
      }
    }, wordDelay)
    return () => window.clearInterval(timer)
  }, [streams, total, wordDelay])

  const words = tokens.slice(0, shown)
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
        animate={{ height: collapsed ? `${lines * 1.625}em` : "auto" }}
        transition={spring}
        className={cn(
          "overflow-hidden",
          collapsed && "mask-[linear-gradient(to_bottom,black_55%,transparent)]"
        )}
      >
        <div ref={inner} className="relative whitespace-pre-wrap">
          {words.map((word, i) =>
            fade && i >= initialWords ? (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                {word}
              </motion.span>
            ) : (
              <React.Fragment key={i}>{word}</React.Fragment>
            )
          )}
          {time !== undefined && !canCollapse && (
            <>
              <span aria-hidden className="invisible inline-block ps-3 text-xs leading-none">
                {time}
              </span>
              <span
                data-slot="bubble-time"
                className="absolute right-0 bottom-0.5 text-xs leading-none whitespace-nowrap opacity-60"
              >
                {time}
              </span>
            </>
          )}
        </div>
      </motion.div>
      {canCollapse && (
        <div className="flex items-end justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              "relative self-start text-xs font-medium opacity-80 outline-none",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
              "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
            )}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
          {time !== undefined && (
            <span data-slot="bubble-time" className="text-xs leading-none whitespace-nowrap opacity-60">
              {time}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const bubbleReactionsVariants = cva(
  "z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "absolute top-0 -translate-y-3/4",
        bottom: "relative -translate-y-1/2",
      },
      align: {
        start: "",
        end: "",
      },
    },
    compoundVariants: [
      { side: "top", align: "start", className: "left-3" },
      { side: "top", align: "end", className: "right-3" },
      { side: "bottom", align: "start", className: "mx-3 self-start" },
      { side: "bottom", align: "end", className: "mx-3 self-end" },
    ],
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
  pop?: boolean
  count?: number
  rolling?: boolean
}) {
  const node = React.useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const lastCount = React.useRef(count)
  React.useEffect(() => {
    const was = lastCount.current
    lastCount.current = count
    if (!pop || reduceMotion || was === count || !node.current) return
    animate(node.current, { rotate: [0, -12, 10, -6, 0], scale: [1, 1.2, 1] }, { duration: 0.5 })
  }, [count, pop, reduceMotion])

  const pill = (
    <motion.div
      ref={node}
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
      <span className="flex gap-0.5">{children}</span>
      {count !== undefined && <RollingNumber value={count} rolling={rolling} />}
    </motion.div>
  )

  if (side === "top") return pill

  return (
    <motion.div
      className="flex flex-col"
      initial={{ height: 0, marginTop: "-0.25rem" }}
      animate={{ height: "auto", marginTop: 0 }}
      exit={{ height: 0, marginTop: "-0.25rem" }}
      transition={settle}
    >
      {pill}
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
        <RollingDigit key={digits.length - i} digit={Number(digit)} />
      ))}
    </span>
  )
}

function RollingDigit({ digit }: { digit: number }) {
  return (
    <span aria-hidden className="relative inline-block contain-paint [clip-path:inset(0)]">
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

function BubbleStatus({
  className,
  status,
  animated = true,
  onRetry,
}: {
  className?: string
  status: BubbleStatusValue
  animated?: boolean
  onRetry?: () => void
}) {
  const reduceMotion = useReducedMotion()
  const icon = React.useRef<HTMLSpanElement>(null)
  const [spinning, setSpinning] = React.useState(false)
  const draw = animated ? { pathLength: 0 } : false

  const retry = async () => {
    if (spinning) return
    if (animated && !reduceMotion && icon.current) {
      setSpinning(true)
      await animate(icon.current, { rotate: [0, 360] }, { duration: 0.6, ease: [0.65, 0, 0.35, 1] })
      setSpinning(false)
    }
    onRetry?.()
  }

  return (
    <div
      data-slot="bubble-status"
      className={cn(
        "flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground group-data-[align=end]/bubble:justify-end",
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
            onClick={retry}
            aria-busy={spinning || undefined}
            className="flex items-center gap-1 font-medium outline-none hover:underline focus-visible:underline"
          >
            <span ref={icon} className="flex">
              <RotateCwIcon className="size-3" />
            </span>
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

function BubbleSuggestions({
  className,
  stagger = true,
  ...props
}: React.ComponentProps<"div"> & {
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
