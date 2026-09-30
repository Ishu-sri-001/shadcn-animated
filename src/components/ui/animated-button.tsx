"use client"

import * as React from "react"
import { cn } from "cn"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"

import { SearchIcon, type SearchIconHandle } from "@/components/animated-icons/search-icon"
import { SettingsIcon, type SettingsIconHandle } from "@/components/animated-icons/settings-icon"

/** dot-fill: a dot grows from the pointer to fill. char-stagger: letters roll one by one. scramble: letters shuffle into place. link: a line draws under the text. border-draw: the border draws around the button. */
type AnimatedButtonVariant = "dot-fill" | "char-stagger" | "scramble" | "link" | "border-draw"
/** filled: solid background. outline: border only. plain: no background or border. */
type AnimatedButtonSurface = "filled" | "outline" | "plain"
type AnimatedButtonTone =
  | "primary"
  | "muted"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "gradient"
type AnimatedButtonIcon = "none" | "arrow" | "search" | "settings"
type AnimatedButtonIconPosition = "start" | "end"
type AnimatedButtonStatus = "idle" | "loading" | "success"
type AnimatedButtonRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"

type AnimatedButtonMotion = {
  variant: AnimatedButtonVariant
  surface: AnimatedButtonSurface
  tone: AnimatedButtonTone
  icon: AnimatedButtonIcon
  iconPosition: AnimatedButtonIconPosition
  /** A bright band sweeps across the label, over and over. */
  shimmer: boolean
  /** The label rolls up to a copy of itself on hover. */
  textRoll: boolean
  /** The button leans toward the pointer. */
  magnetic: boolean
  /** On click the button scales down, then springs back. */
  press: boolean
  /** Shows a spinner, then a check, rolling in beside the label. */
  status: AnimatedButtonStatus
  /** Label shown while loading. With this or successText, the label rolls between states. */
  loadingText: string
  /** Label shown once done. */
  successText: string
  /** A line draws along the bottom on hover. Always on for link. */
  underline: boolean
  rounded: AnimatedButtonRounded
  /** Seconds. */
  duration: number
  /** Seconds between letters, for char-stagger. */
  stagger: number
}

const ROUNDED: Record<AnimatedButtonRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
}

// Matches the theme radius scale; full is capped at half the height
const RADIUS: Record<AnimatedButtonRounded, number> = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  "2xl": 18,
  full: 9999,
}

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789"
const ease = "ease-[cubic-bezier(0.625,0.05,0,1)]"

// Seconds for one sweep of the shimmer
const SHIMMER_SECONDS = 1.6

// Springy settle for the press squeeze
const PRESS_TRANSITION = "transition-[scale] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"

const GRADIENT = "bg-linear-to-r from-info via-success to-warning"

// Colours for each tone, filled or plain, and the dot that fills over it
const TONES: Record<
  AnimatedButtonTone,
  { border: string; filled: string; filledFlip: string; dot: string; plain: string; plainFlip: string; plainDot: string }
> = {
  primary: {
    border: "border-primary",
    filled: "border-primary bg-primary text-primary-foreground",
    filledFlip: "data-[active=true]:text-foreground",
    dot: "bg-background",
    plain: "text-foreground",
    plainFlip: "data-[active=true]:text-primary-foreground",
    plainDot: "bg-primary",
  },
  muted: {
    border: "border-border",
    filled: "border-muted bg-muted text-foreground",
    filledFlip: "data-[active=true]:text-foreground",
    dot: "bg-background",
    plain: "text-muted-foreground",
    plainFlip: "data-[active=true]:text-foreground",
    plainDot: "bg-muted",
  },
  destructive: {
    border: "border-destructive",
    filled: "border-destructive bg-destructive text-destructive-foreground",
    filledFlip: "data-[active=true]:text-destructive",
    dot: "bg-background",
    plain: "text-destructive",
    plainFlip: "data-[active=true]:text-destructive-foreground",
    plainDot: "bg-destructive",
  },
  success: {
    border: "border-success",
    filled: "border-success bg-success text-success-foreground",
    filledFlip: "data-[active=true]:text-success",
    dot: "bg-background",
    plain: "text-success",
    plainFlip: "data-[active=true]:text-success-foreground",
    plainDot: "bg-success",
  },
  warning: {
    border: "border-warning",
    filled: "border-warning bg-warning text-warning-foreground",
    filledFlip: "data-[active=true]:text-warning",
    dot: "bg-background",
    plain: "text-warning",
    plainFlip: "data-[active=true]:text-warning-foreground",
    plainDot: "bg-warning",
  },
  info: {
    border: "border-info",
    filled: "border-info bg-info text-info-foreground",
    filledFlip: "data-[active=true]:text-info",
    dot: "bg-background",
    plain: "text-info",
    plainFlip: "data-[active=true]:text-info-foreground",
    plainDot: "bg-info",
  },
  gradient: {
    border: "border-info",
    filled: `border-transparent text-info-foreground ${GRADIENT}`,
    filledFlip: "data-[active=true]:text-info",
    dot: "bg-background",
    plain: "text-info",
    plainFlip: "data-[active=true]:text-info-foreground",
    plainDot: GRADIENT,
  },
}

// Shows the icon at rest, and plays it while the button is hovered
function ButtonIcon({ icon, hovered }: { icon: AnimatedButtonIcon; hovered: boolean }) {
  const search = React.useRef<SearchIconHandle>(null)
  const settings = React.useRef<SettingsIconHandle>(null)
  const reduceMotion = useReducedMotion()

  React.useEffect(() => {
    const handle = icon === "search" ? search.current : settings.current
    if (hovered) handle?.startAnimation()
    else handle?.stopAnimation()
  }, [hovered, icon])

  if (icon === "search") return <SearchIcon ref={search} size={20} isAnimated={false} />
  if (icon === "settings") return <SettingsIcon ref={settings} size={20} isAnimated={false} />
  if (icon !== "arrow") return null
  // Reduced motion: a plain arrow that stays put
  if (reduceMotion) return <ArrowRightIcon aria-hidden className="size-5" />

  return (
    <span aria-hidden className="relative flex size-5 overflow-hidden">
      <ArrowRightIcon className="absolute inset-0 size-5 transition-transform duration-(--dur) group-data-[active=true]/animated-button:translate-x-full" />
      <ArrowRightIcon className="absolute inset-0 size-5 -translate-x-full transition-transform duration-(--dur) group-data-[active=true]/animated-button:translate-x-0" />
    </span>
  )
}

// Letters roll up one by one, each a little after the last
function CharStagger({ text, stagger }: { text: string; stagger: number }) {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden className="flex">
      {[...text].map((char, index) => (
        <span key={index} className="relative flex overflow-hidden">
          {[0, 1].map((row) => (
            <span
              key={row}
              className={cn(
                "inline-block transition-transform duration-(--dur)",
                ease,
                row === 1
                  ? "absolute inset-0 translate-y-full group-data-[active=true]/animated-button:translate-y-0"
                  : "group-data-[active=true]/animated-button:-translate-y-full"
              )}
              // Reduced motion: every letter moves at once
              style={{ transitionDelay: reduceMotion ? "0s" : `${index * stagger}s` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}

// Shuffles random glyphs and settles them left to right while active
function ScrambleText({ text, duration, active }: { text: string; duration: number; active: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  React.useEffect(() => {
    const el = ref.current
    if (!el || !active || reduceMotion) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const settled = Math.floor(progress * text.length)
      el.textContent = [...text]
        .map((char, index) =>
          char === " " || index < settled ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        )
        .join("")
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      el.textContent = text
    }
  }, [active, text, duration, reduceMotion])

  return (
    // Invisible copy holds the width, so shuffling never shifts the text
    <span aria-hidden className="relative inline-block text-left">
      <span className="invisible">{text}</span>
      <span ref={ref} className="absolute top-0 left-0 whitespace-nowrap">
        {text}
      </span>
    </span>
  )
}

// Beside the label: the icon at rest, then a spinner and a check that roll in
function StatusSlot({
  status,
  icon,
  hovered,
}: {
  status: AnimatedButtonStatus
  icon: AnimatedButtonIcon
  hovered: boolean
}) {
  const reduceMotion = useReducedMotion()
  const roll = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, rotate: -180 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20, rotate: 180 },
    transition: { type: "spring" as const, duration: 0.5, bounce: 0.2 },
  }

  if (status === "idle") return <ButtonIcon icon={icon} hovered={hovered} />

  return (
    <span className="relative flex size-5 shrink-0">
      <AnimatePresence initial>
        {status === "loading" ? (
          <motion.span key="loading" role="status" aria-label="Loading" className="absolute inset-0" {...roll}>
            <LoaderCircleIcon className="size-5 animate-spin motion-reduce:animate-none" />
          </motion.span>
        ) : (
          <motion.span key="success" role="status" aria-label="Done" className="absolute inset-0" {...roll}>
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.2, ease: "easeOut" }}
              />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// The label rolls between states and sizes to the current text.
function StatusLabel({
  status,
  idle,
  idleText,
  loadingText,
  successText,
}: {
  status: AnimatedButtonStatus
  idle: React.ReactNode
  idleText: string
  loadingText: string
  successText: string
}) {
  const reduceMotion = useReducedMotion()
  const text = { idle: idleText, loading: loadingText, success: successText }

  return (
    <span className="relative inline-grid overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={status}
          className="col-start-1 row-start-1 justify-self-center whitespace-nowrap"
          initial={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
        >
          {status === "idle" ? idle : text[status]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// The label slides up out of view as a copy rolls in from below
function TextRoll({ children }: { children: React.ReactNode }) {
  const roll = cn("block transition-transform duration-(--dur) motion-reduce:transition-none", ease)
  return (
    <span className="relative block overflow-hidden">
      <span
        className={cn(
          roll,
          "group-data-[active=true]/animated-button:-translate-y-full"
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          roll,
          "absolute inset-x-0 top-0 translate-y-full group-data-[active=true]/animated-button:translate-y-0"
        )}
      >
        {children}
      </span>
    </span>
  )
}

// The label dims while a bright copy of it, clipped to a band, sweeps across on a loop
function TextShimmer({ text }: { text: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className="relative inline-block">
      <motion.span
        initial={false}
        animate={{ opacity: reduceMotion ? 1 : 0.55 }}
        transition={{ duration: 0.25 }}
      >
        {text}
      </motion.span>
      <motion.span
        aria-hidden
        initial={false}
        className="pointer-events-none absolute inset-0 bg-clip-text [-webkit-text-fill-color:transparent]"
        style={{
          backgroundImage: "linear-gradient(105deg, transparent 35%, currentColor 50%, transparent 65%)",
          backgroundSize: "200% 100%",
          backgroundRepeat: "no-repeat",
        }}
        animate={{ backgroundPosition: reduceMotion ? "130% 0" : ["130% 0", "-30% 0"] }}
        transition={{
          duration: SHIMMER_SECONDS,
          // Steady pace, so the band crosses the text for the whole duration
          ease: "linear",
          repeat: Infinity,
          repeatDelay: 0.6,
        }}
      >
        {text}
      </motion.span>
    </span>
  )
}

function AnimatedButton({
  variant = "dot-fill",
  surface = "filled",
  tone = "primary",
  icon = "arrow",
  iconPosition = "end",
  shimmer = false,
  textRoll = false,
  magnetic = false,
  press = false,
  status = "idle",
  loadingText,
  successText,
  underline = true,
  rounded = "full",
  duration = 0.8,
  stagger = 0.02,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  style,
  ref,
  ...props
}: Omit<React.ComponentProps<"button">, "children" | "color"> &
  Partial<AnimatedButtonMotion> & { children: string }) {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [height, setHeight] = React.useState(56)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)

  // The drawn border needs the real height, which changes per screen size
  React.useEffect(() => {
    const el = buttonRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0].blockSize))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const [dot, setDot] = React.useState({ left: "50%", top: "50%", on: false })
  const reduceMotion = useReducedMotion()

  const borderDraw = variant === "border-draw"
  const plain = surface === "plain" || variant === "link"
  const outlined = surface === "outline" && variant !== "link" && !borderDraw
  // Plain, outlined and border-draw share text and dot colours; only filled differs
  const bare = plain || outlined || borderDraw
  const line = variant === "link" || (plain && underline)
  const timing = { duration: reduceMotion ? 0 : duration, ease: "easeInOut" as const }

  // The dot grows from where the pointer came in, and sweeps out toward where it left
  const fill = (
    event: React.PointerEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
    on: boolean
  ) => {
    if (variant !== "dot-fill") return
    const box = event.currentTarget.getBoundingClientRect()
    const pointer = "clientX" in event
    setDot({
      left: pointer ? `${((event.clientX - box.left) / box.width) * 100}%` : "50%",
      top: pointer ? `${((event.clientY - box.top) / box.height) * 100}%` : "50%",
      on,
    })
  }

  // Magnetic: the button trails the pointer a little, then springs home
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const pullX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const pullY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  const labelNode = (
    <>
      {variant === "char-stagger" ? (
        <>
          <span className="sr-only">{children}</span>
          <CharStagger text={children} stagger={stagger} />
        </>
      ) : variant === "scramble" ? (
        <>
          <span className="sr-only">{children}</span>
          <ScrambleText text={children} duration={duration} active={hovered} />
        </>
      ) : textRoll ? (
        <TextRoll>{shimmer ? <TextShimmer text={children} /> : <span>{children}</span>}</TextRoll>
      ) : shimmer ? (
        <TextShimmer text={children} />
      ) : (
        <span>{children}</span>
      )}
    </>
  )

  return (
    <span
      className={cn("inline-flex", magnetic && "-m-4 p-4")}
      onPointerMove={(event) => {
        if (!magnetic || reduceMotion) return
        const box = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - (box.left + box.width / 2)) * 0.3)
        y.set((event.clientY - (box.top + box.height / 2)) * 0.3)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      <motion.span
        className={cn(
          "inline-flex",
          press && PRESS_TRANSITION,
          press && pressed && !reduceMotion && "scale-[0.97]"
        )}
        style={{ x: pullX, y: pullY }}
      >
        <button
          ref={(node) => {
            buttonRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          data-slot="animated-button"
          data-active={hovered ? "true" : "false"}
          aria-busy={status === "loading" || undefined}
          onPointerEnter={(event) => {
            onPointerEnter?.(event)
            fill(event, true)
            setHovered(true)
          }}
          onPointerLeave={(event) => {
            onPointerLeave?.(event)
            fill(event, false)
            setHovered(false)
            setPressed(false)
          }}
          onPointerDown={(event) => {
            onPointerDown?.(event)
            setPressed(true)
          }}
          onPointerUp={(event) => {
            onPointerUp?.(event)
            setPressed(false)
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.key === " " || event.key === "Enter") setPressed(true)
          }}
          onKeyUp={(event) => {
            onKeyUp?.(event)
            setPressed(false)
          }}
          onFocus={(event) => {
            onFocus?.(event)
            if (!event.currentTarget.matches(":focus-visible")) return
            fill(event, true)
            setHovered(true)
          }}
          onBlur={(event) => {
            onBlur?.(event)
            fill(event, false)
            setHovered(false)
            setPressed(false)
          }}
          style={
            {
              "--dur": `${duration}s`,
              "--flip": `${duration * 0.4}s`,
              "--flip-delay": `${duration * 0.3}s`,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/animated-button relative isolate inline-flex h-14 w-fit cursor-pointer items-center justify-center overflow-hidden px-8 text-lg font-medium whitespace-nowrap outline-none max-[1025px]:h-12 max-[1025px]:text-base max-md:h-11",
            "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            status === "loading" && "pointer-events-none",
            plain
              ? cn("bg-transparent px-2", TONES[tone].plain)
              : borderDraw
                ? cn("border border-transparent bg-transparent", TONES[tone].plain)
                : outlined
                  ? cn("border bg-transparent", TONES[tone].plain, TONES[tone].border)
                  : cn("border", TONES[tone].filled),
            !plain && ROUNDED[rounded],
            !plain && "max-[1025px]:px-6 max-md:px-5",
            // Text swaps colour as the dot passes under it
            variant === "dot-fill" &&
              cn(
                "transition-colors duration-(--flip) delay-(--flip-delay)",
                bare ? TONES[tone].plainFlip : TONES[tone].filledFlip
              ),
            line &&
              (reduceMotion
                ? // The whole line appears at once instead of drawing
                  "after:absolute after:inset-x-2 after:bottom-3.5 after:h-px after:bg-current after:opacity-0 after:transition-opacity after:duration-150 data-[active=true]:after:opacity-100"
                : "after:absolute after:inset-x-2 after:bottom-3.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-(--dur) data-[active=true]:after:origin-left data-[active=true]:after:scale-x-100"),
            className
          )}
          {...props}
        >
          {variant === "dot-fill" && (
            <motion.span
              aria-hidden
              initial={false}
              style={{ x: "-50%", y: "-50%" }}
              animate={{ scale: dot.on ? 1 : 0, left: dot.left, top: dot.top }}
              // Snap to the entry point, then grow; slide out with the shrink
              transition={{
                scale: timing,
                left: dot.on ? { duration: 0 } : timing,
                top: dot.on ? { duration: 0 } : timing,
              }}
              className={cn(
                "pointer-events-none absolute -z-10 aspect-square w-[220%] rounded-full",
                bare ? TONES[tone].plainDot : TONES[tone].dot
              )}
            />
          )}

          {borderDraw && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
              {/* Both borders share one shape, so the drawn line sits exactly on the resting one */}
              {[0, 1].map((layer) => (
                <motion.rect
                  key={layer}
                  x={0.75}
                  y={0.75}
                  rx={Math.max(Math.min(RADIUS[rounded], height / 2) - 0.75, 0)}
                  style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" }}
                  fill="none"
                  strokeWidth={1.5}
                  className={layer === 0 ? "stroke-border" : "stroke-current"}
                  initial={false}
                  animate={layer === 0 ? undefined : { pathLength: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
                  transition={{
                    pathLength: timing,
                    opacity: { duration: reduceMotion ? 0 : 0.15, delay: hovered ? 0 : duration },
                  }}
                />
              ))}
            </svg>
          )}

          <span
            className={cn(
              "relative z-10 inline-flex w-fit items-center gap-1.5",
              iconPosition === "start" && "flex-row-reverse"
            )}
          >
            {loadingText || successText ? (
              <StatusLabel
                status={status}
                idle={labelNode}
                idleText={children}
                loadingText={loadingText ?? children}
                successText={successText ?? children}
              />
            ) : (
              labelNode
            )}

            <StatusSlot status={status} icon={icon} hovered={hovered} />
          </span>

        </button>
      </motion.span>
    </span>
  )
}

export { AnimatedButton }
export type {
  AnimatedButtonVariant,
  AnimatedButtonSurface,
  AnimatedButtonTone,
  AnimatedButtonIcon,
  AnimatedButtonIconPosition,
  AnimatedButtonStatus,
  AnimatedButtonRounded,
}
