"use client"

import * as React from "react"
import { cn } from "cn"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react"

type InputOTPRounded = "none" | "sm" | "md" | "lg" | "xl" | "full"
/** Tailwind size step, e.g. "10". */
type InputOTPSize = "8" | "9" | "10" | "11" | "12" | "14"
type InputOTPCharAnimation = "pop" | "roll" | "fade" | "none"

type InputOTPMotion = {
  /** One ring glides between boxes. */
  glide: boolean
  charAnimation: InputOTPCharAnimation
  /** Paste fill gap, in seconds. */
  pasteStagger: number
  /** Shake when turning invalid. */
  shakeOnError: boolean
  /** Green wave and tick on success. */
  successWave: boolean
  boxSize: InputOTPSize
  rounded: InputOTPRounded
  /** Boxes share borders as a strip. */
  joined: boolean
}

/** Corners of each separate box. */
const BOX_ROUNDED: Record<InputOTPRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

/** Outer corners of a joined strip. */
const ROUNDED: Record<InputOTPRounded, string> = {
  none: "first:rounded-l-none last:rounded-r-none",
  sm: "first:rounded-l-sm last:rounded-r-sm",
  md: "first:rounded-l-md last:rounded-r-md",
  lg: "first:rounded-l-lg last:rounded-r-lg",
  xl: "first:rounded-l-xl last:rounded-r-xl",
  full: "first:rounded-l-full last:rounded-r-full",
}

const SIZE: Record<InputOTPSize, string> = {
  "8": "size-8 text-sm",
  "9": "size-9 text-sm",
  // Phones: step down to size-9.
  "10": "size-10 text-base max-md:size-9",
  "11": "size-11 text-base max-md:size-9",
  "12": "size-12 text-lg max-md:size-9 max-md:text-base",
  "14": "size-14 text-xl max-md:size-9 max-md:text-base",
}

/** Success wave delay per box, seconds. */
const WAVE_GAP = 0.06

const CHAR_IN: Record<Exclude<InputOTPCharAnimation, "none">, { from: TargetAndTransition; to: TargetAndTransition }> = {
  pop: { from: { opacity: 0, scale: 0.4 }, to: { opacity: 1, scale: 1 } },
  roll: { from: { opacity: 0, y: "100%" }, to: { opacity: 1, y: "0%" } },
  fade: { from: { opacity: 0 }, to: { opacity: 1 } },
}


const InputOTPMotionContext = React.createContext<
  InputOTPMotion & {
    ringId: string
    invalid: boolean
    success: boolean
    /** Where the latest paste starts. */
    pasteFrom: number | null
  }
>({
  glide: true,
  charAnimation: "pop",
  pasteStagger: 0.05,
  shakeOnError: true,
  successWave: true,
  boxSize: "8",
  rounded: "lg",
  joined: false,
  ringId: "otp-ring",
  invalid: false,
  success: false,
  pasteFrom: null,
})

function InputOTP({
  className,
  containerClassName,
  value: valueProp,
  onChange,
  maxLength,
  invalid = false,
  success = false,
  glide = true,
  charAnimation = "pop",
  pasteStagger = 0.05,
  shakeOnError = true,
  successWave = true,
  boxSize = "8",
  rounded = "lg",
  joined = false,
  ...props
}: React.ComponentProps<typeof OTPInput> &
  Partial<InputOTPMotion> & {
    containerClassName?: string
    /** Wrong code: red boxes, shake. */
    invalid?: boolean
    /** Right code: green wave, tick. */
    success?: boolean
  }) {
  const ringId = React.useId()
  const reduceMotion = useReducedMotion()
  const box = React.useRef<HTMLDivElement>(null)
  const [uncontrolled, setUncontrolled] = React.useState("")
  const value = valueProp ?? uncontrolled
  // Multi-character change means a paste.
  const [pasteFrom, setPasteFrom] = React.useState<number | null>(null)
  const [seen, setSeen] = React.useState(value)
  if (seen !== value) {
    setSeen(value)
    setPasteFrom(value.length - seen.length > 1 ? seen.length : null)
  }

  // Shake once on turning invalid.
  const wasInvalid = React.useRef(invalid)
  React.useEffect(() => {
    const was = wasInvalid.current
    wasInvalid.current = invalid
    if (!invalid || was || !shakeOnError || reduceMotion || !box.current) return
    animate(box.current, { x: [0, -8, 8, -5, 5, -2, 0] }, { duration: 0.45, ease: "easeOut" })
  }, [invalid, shakeOnError, reduceMotion])

  const context = React.useMemo(
    () => ({
      glide,
      charAnimation,
      pasteStagger,
      shakeOnError,
      successWave,
      boxSize,
      rounded,
      joined,
      ringId,
      invalid,
      success,
      pasteFrom,
    }),
    [glide, charAnimation, pasteStagger, shakeOnError, successWave, boxSize, rounded, joined, ringId, invalid, success, pasteFrom]
  )

  return (
    <InputOTPMotionContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <div ref={box} className="relative w-fit">
          <OTPInput
            data-slot="input-otp"
            value={value}
            maxLength={maxLength}
            onChange={(next: string) => {
              setUncontrolled(next)
              onChange?.(next)
            }}
            containerClassName={cn(
              "cn-input-otp flex items-center has-disabled:opacity-50",
              !joined && "gap-2 max-md:gap-1.5",
              containerClassName
            )}
            spellCheck={false}
            className={cn("disabled:cursor-not-allowed", className)}
            {...props}
          />
          <AnimatePresence>
            {successWave && success && (
              <motion.svg
                key="tick"
                aria-label="Code accepted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                // Outside the row, so no shift.
                className="absolute top-1/2 left-[calc(100%+0.75rem)] size-5 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 max-md:top-0 max-md:left-full max-md:size-5 max-md:-translate-x-3/4 max-md:rounded-full max-md:bg-background max-md:p-0.5 max-md:ring-1 max-md:ring-emerald-500"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                transition={{
                  type: "spring",
                  visualDuration: 0.3,
                  bounce: 0.4,
                  delay: maxLength * WAVE_GAP,
                }}
              >
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: maxLength * WAVE_GAP + 0.05 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </InputOTPMotionContext.Provider>
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  const { joined } = React.useContext(InputOTPMotionContext)
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", !joined && "gap-2 max-md:gap-1.5", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const options = React.useContext(InputOTPMotionContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}
  const waved = options.successWave && options.success
  const pasteDelay =
    options.pasteFrom !== null && index >= options.pasteFrom
      ? (index - options.pasteFrom) * options.pasteStagger
      : 0

  const animation = options.charAnimation === "none" ? null : options.charAnimation

  return (
    <motion.div
      data-slot="input-otp-slot"
      data-active={isActive}
      aria-invalid={options.invalid || undefined}
      animate={waved ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, delay: waved ? index * WAVE_GAP : 0 }}
      style={{ transitionDelay: waved ? `${index * WAVE_GAP}s` : "0s" }}
      className={cn(
        "relative flex items-center justify-center border-input transition-[color,background-color,border-color,box-shadow] duration-300 outline-none aria-invalid:border-destructive dark:bg-input/30",
        options.joined ? "border-y border-r first:border-l" : "border",
        !options.glide &&
          "data-[active=true]:z-10 data-[active=true]:border-foreground data-[active=true]:aria-invalid:border-destructive",
        waved &&
          "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300",
        SIZE[options.boxSize],
        options.joined ? ROUNDED[options.rounded] : BOX_ROUNDED[options.rounded],
        className
      )}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {options.glide && isActive && (
        <motion.div
          layoutId={options.ringId}
          aria-hidden
          className={cn(
            // Crisp border, no halo.
            "pointer-events-none absolute -inset-px z-10 rounded-[inherit] border border-foreground",
            options.invalid && "border-destructive"
          )}
          transition={{ type: "spring", visualDuration: 0.25, bounce: 0.2 }}
        />
      )}
      <span className={cn("relative grid place-items-center", animation === "roll" && "overflow-hidden")}>
        {animation ? (
          // Old digit fades before new appears.
          <AnimatePresence initial={false} mode="wait">
            {char && (
              <motion.span
                key={char}
                className="col-start-1 row-start-1 block"
                initial={CHAR_IN[animation].from}
                animate={CHAR_IN[animation].to}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                transition={
                  animation === "pop"
                    ? { type: "spring", visualDuration: 0.25, bounce: 0.45, delay: pasteDelay }
                    : { duration: 0.2, ease: "easeOut", delay: pasteDelay }
                }
              >
                {char}
              </motion.span>
            )}
          </AnimatePresence>
        ) : (
          char
        )}
      </span>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[45%] w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </motion.div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
export type { InputOTPCharAnimation, InputOTPRounded, InputOTPSize }
