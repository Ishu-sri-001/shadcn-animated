"use client"

import * as React from "react"
import { HpxQuestionnairePrimitive as QuestionnairePrimitive } from "@/components/ui/questionnaire-primitive"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion, useAnimationControls, useReducedMotion, type Transition, type Variants } from "motion/react"

import { hpxButtonVariants, type HpxButton } from "@/components/ui/button"

/** slide-x / slide-y: the next question travels in the direction you move. fade: it fades in place. scale: it grows in. */
type QuestionnaireContent = "slide-x" | "slide-y" | "fade" | "scale" | "none"
type QuestionnaireProgressStyle = "text" | "bar"
/** card: each choice is a box. inline: just the indicator and label. */
type QuestionnaireChoiceLayout = "card" | "inline"
/** fade: background fades in. top: fills from the top. */
type QuestionnaireChoiceHover = "fade" | "top"
/** Roundness of the check indicator, as Tailwind radius names. */
type QuestionnaireIndicatorRounded = "none" | "sm" | "md" | "lg" | "full"

const INDICATOR_ROUNDED: Record<QuestionnaireIndicatorRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
}

type QuestionnaireChoiceColor = "muted" | "primary"
/** check: an empty circle that morphs into a drawn check. radio: a circle with a dot. */
type QuestionnaireChoiceIndicator = "radio" | "check" | "none"

type QuestionnaireMotion = {
  contentAnimation: QuestionnaireContent
  /** How far the question slides, in vw. */
  slideDistance: number
  /** Seconds. */
  duration: number
  bounce: number
  /** Choices rise in one after another. */
  staggerChoices: boolean
  /** Seconds between choices. */
  stagger: number
  progressStyle: QuestionnaireProgressStyle
  /** Shows the question count and bar. */
  showProgress: boolean
  /** Lets a question take more than one answer. */
  multiple: boolean
  choiceColor: QuestionnaireChoiceColor
  choiceIndicator: QuestionnaireChoiceIndicator
  choiceLayout: QuestionnaireChoiceLayout
  choiceHover: QuestionnaireChoiceHover
  /** Boxes the check indicator; off shows just the mark. */
  indicatorBorder: boolean
  indicatorRounded: QuestionnaireIndicatorRounded
}

type QuestionnaireContextValue = QuestionnaireMotion & {
  item: string | null
  /** 1 when moving forward, -1 when going back. */
  direction: number
}

const QuestionnaireContext = React.createContext<QuestionnaireContextValue | null>(null)

function useQuestionnaire() {
  const context = React.useContext(QuestionnaireContext)
  if (!context) throw new Error("Questionnaire parts must be used inside <Questionnaire>.")
  return context
}

// Slow at both ends, so a fade never starts or stops abruptly
const fadeEase = [0.45, 0, 0.25, 1] as const

function useSpring(context: QuestionnaireMotion): Transition {
  const reduceMotion = useReducedMotion()
  return reduceMotion
    ? { duration: 0 }
    : { type: "spring", duration: context.duration, bounce: context.bounce }
}

function Questionnaire({
  contentAnimation = "slide-x",
  slideDistance = 20,
  duration = 0.4,
  bounce = 0.1,
  staggerChoices = true,
  stagger = 0.05,
  progressStyle = "bar",
  showProgress = true,
  multiple = false,
  choiceColor = "muted",
  choiceIndicator = "check",
  choiceLayout = "card",
  indicatorBorder = false,
  indicatorRounded = "full",
  choiceHover = "fade",
  item: itemProp,
  defaultItem,
  onItemChange,
  className,
  ref,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root> & Partial<QuestionnaireMotion>) {
  const root = React.useRef<HTMLFormElement | null>(null)
  const [own, setOwn] = React.useState<string | null>(defaultItem ?? null)
  const [direction, setDirection] = React.useState(1)
  const item = itemProp ?? own

  const context = React.useMemo(
    () => ({
      contentAnimation, slideDistance, duration, bounce, staggerChoices, stagger, progressStyle, showProgress,
      multiple, choiceColor, choiceIndicator, indicatorBorder, indicatorRounded, choiceLayout, choiceHover, item, direction,
    }),
    [
      contentAnimation, slideDistance, duration, bounce, staggerChoices, stagger, progressStyle, showProgress,
      multiple, choiceColor, choiceIndicator, indicatorBorder, indicatorRounded, choiceLayout, choiceHover, item, direction,
    ]
  )

  return (
    <QuestionnaireContext.Provider value={context}>
      <QuestionnairePrimitive.Root
        data-hpx-slot="questionnaire"
        ref={(node) => {
          root.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        defaultItem={defaultItem}
        item={itemProp}
        onItemChange={(next) => {
          // Which way to travel, from where the two questions sit in the form
          const names = [...(root.current?.querySelectorAll<HTMLElement>('[data-hpx-slot="questionnaire-item"]') ?? [])].map(
            (el) => el.dataset.name
          )
          const from = item ?? names[0]
          setDirection(names.indexOf(next) >= names.indexOf(from) ? 1 : -1)
          setOwn(next)
          onItemChange?.(next)
        }}
        className={cn("grid w-full min-w-0 grid-cols-1 gap-4", className)}
        {...props}
      />
    </QuestionnaireContext.Provider>
  )
}

// Only the current number rolls up when it changes
function ProgressLabel({ children }: { children: React.ReactNode }) {
  const context = useQuestionnaire()
  const roll = useSpring(context)
  const match = typeof children === "string" ? children.match(/^(\D*)(\d+)(.*)$/) : null
  if (!match) return <>{children}</>
  const [, before, count, after] = match

  return (
    <>
      {before}
      <span className="relative inline-flex overflow-hidden align-bottom">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={count}
            className="block"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={roll}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
      {after}
    </>
  )
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  const context = useQuestionnaire()
  const fill = useSpring(context)
  if (!context.showProgress) return null
  const text = cn(
    "row-start-1 min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
    className
  )

  if (context.progressStyle === "text") {
    return (
      <QuestionnairePrimitive.Progress
        data-hpx-slot="questionnaire-progress"
        className={text}
        render={(progressProps) => {
          const { children, ...rest } = progressProps
          return <div {...rest}><ProgressLabel>{children as React.ReactNode}</ProgressLabel></div>
        }}
        {...props}
      />
    )
  }

  return (
    <QuestionnairePrimitive.Progress
      data-hpx-slot="questionnaire-progress"
      render={(progressProps, state) => {
        const { children, ...rest } = progressProps
        return (
          <div {...rest} className="row-start-1 flex flex-col gap-2">
            <span className={text}><ProgressLabel>{children as React.ReactNode}</ProgressLabel></span>
            <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${state.total ? (state.current / state.total) * 100 : 0}%` }}
                transition={fill}
              />
            </div>
          </div>
        )
      }}
      {...props}
    />
  )
}

function QuestionnaireItem({
  className,
  name,
  children,
  multiple,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  // The primitive marks the active item from its first render
  const [active, setActive] = React.useState(false)

  React.useLayoutEffect(() => {
    if (!node) return
    const read = () => setActive(node.hasAttribute("data-active"))
    read()
    const observer = new MutationObserver(read)
    observer.observe(node, { attributes: true, attributeFilter: ["data-active"] })
    return () => observer.disconnect()
  }, [node])

  const context = useQuestionnaire()
  const reduceMotion = useReducedMotion()
  const still = context.contentAnimation === "none" || reduceMotion
  const slideX = context.contentAnimation === "slide-x" && !reduceMotion
  const slideY = context.contentAnimation === "slide-y" && !reduceMotion
  const spring = useSpring(context)

  const controls = useAnimationControls()
  const mounted = React.useRef(false)
  const [wasActive, setWasActive] = React.useState(active)
  const [leaving, setLeaving] = React.useState(false)
  if (active !== wasActive) {
    setWasActive(active)
    setLeaving(!active)
  }

  React.useEffect(() => {
    if (active) {
      controls.set("enter")
      controls.start("center")
    } else if (mounted.current) {
      controls.start("exit")
    }
    mounted.current = true
  }, [active, controls])

  const offset = (d: number) => ({
    opacity: still ? 1 : 0,
    x: slideX ? `${d * context.slideDistance}vw` : "0vw",
    y: slideY ? `${d * context.slideDistance}vw` : "0vw",
    scale: context.contentAnimation === "scale" && !reduceMotion ? 0.94 : 1,
  })

  const variants: Variants = {
    enter: (d: number) => offset(d),
    // Leaves the opposite way to the one coming in
    exit: (d: number) => ({
      ...offset(-d),
      transition: still ? { duration: 0 } : { duration: context.duration * 0.7, ease: fadeEase },
    }),
    center: {
      opacity: 1,
      x: "0vw",
      y: "0vw",
      scale: 1,
      transition: {
        ...(context.contentAnimation === "fade" ? { duration: context.duration, ease: fadeEase } : spring),
        staggerChildren: context.staggerChoices && !reduceMotion ? context.stagger : 0,
        delayChildren: 0.08,
      },
    },
  }

  return (
    <QuestionnairePrimitive.Item
      ref={setNode}
      name={name}
      multiple={multiple ?? context.multiple}
      data-name={name}
      data-hpx-slot="questionnaire-item"
      // All items share one cell, so the form keeps the tallest height
      hidden={false}
      className={cn(
        "col-start-1 row-start-2 min-w-0 border-0 p-0 outline-none not-hpx-active:invisible",
        leaving && "visible!",
        className
      )}
      {...props}
    >
      {/* Padding keeps focus rings inside the clip */}
      <div className="-m-1 overflow-clip p-1">
        <motion.div
          custom={context.direction}
          variants={variants}
          initial={active ? "enter" : "exit"}
          animate={controls}
          onAnimationComplete={(definition) => {
            if (definition === "exit") setLeaving(false)
          }}
          className="flex min-w-0 flex-col gap-4"
        >
          {children}
        </motion.div>
      </div>
    </QuestionnairePrimitive.Item>
  )
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-hpx-slot="questionnaire-title"
      className={cn(
        "font-heading text-xl leading-snug font-medium text-pretty [&:not(:has(~[data-hpx-slot=questionnaire-description]))]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-hpx-slot="questionnaire-description"
      className={cn("text-base text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  const { choiceLayout } = useQuestionnaire()

  return (
    <QuestionnairePrimitive.Choices
      data-hpx-slot="questionnaire-choices"
      className={cn(
        "group/questionnaire-choices grid min-w-0",
        choiceLayout === "inline" ? "gap-1" : "gap-2",
        className
      )}
      {...props}
    />
  )
}

const choiceVariants: Variants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { type: "spring", duration: 0.4, bounce: 0.1 } },
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  const { choiceColor, choiceIndicator, indicatorBorder, indicatorRounded, choiceLayout, choiceHover, duration } =
    useQuestionnaire()
  const reduceMotion = useReducedMotion()
  const card = choiceLayout === "card"
  const bare = choiceIndicator === "check" && !indicatorBorder
  const primary = choiceColor === "primary"
  const solid = card && primary
  const hover = card ? choiceHover : "none"
  const layer = cn("pointer-events-none absolute -inset-px -z-10 rounded-[inherit]", primary ? "bg-primary" : "bg-muted")

  return (
    <QuestionnairePrimitive.Choice
      data-hpx-slot="questionnaire-choice"
      render={(choiceProps) => (
        <motion.label {...(choiceProps as React.ComponentProps<typeof motion.label>)} variants={choiceVariants}>
          {card && (
            // The border sits under the fills, so a fill meets it exactly
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-px -z-30 rounded-[inherit] border transition-colors",
                "border-input",
                hover === "fade" &&
                  (primary
                    ? "group-hpx-checked/questionnaire-choice:border-primary"
                    : "group-hpx-checked/questionnaire-choice:border-transparent"),
                hover === "fade" &&
                  (primary
                    ? "group-hover/questionnaire-choice:border-primary"
                    : "group-hover/questionnaire-choice:border-transparent"),
                "group-has-[>input:focus-visible]/questionnaire-choice:border-ring group-data-invalid/questionnaire-choice:border-destructive"
              )}
            />
          )}
          {card && (
            // Backgrounds live in a layer, since blended text ignores an element's own
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 -z-20 rounded-[calc(var(--radius-lg)-1px)] bg-background dark:bg-input/20",
                // The wipe layer carries the fill, so the base never tints
                hover !== "top" && "transition-colors",
                hover === "fade" &&
                  (primary
                    ? "group-hover/questionnaire-choice:bg-primary"
                    : "group-hover/questionnaire-choice:bg-muted"),
                hover !== "top" &&
                  (primary
                    ? "group-hpx-checked/questionnaire-choice:bg-primary dark:group-hpx-checked/questionnaire-choice:bg-primary"
                    : "group-hpx-checked/questionnaire-choice:bg-muted dark:group-hpx-checked/questionnaire-choice:bg-muted")
              )}
            />
          )}
          {hover === "top" && (
            <span
              aria-hidden
              className={cn(
                layer,
                "[clip-path:inset(0_0_100%_0)] transition-[clip-path] duration-300 ease-out group-hover/questionnaire-choice:[clip-path:inset(0)] group-hpx-checked/questionnaire-choice:[clip-path:inset(0)] motion-reduce:transition-none"
              )}
            />
          )}
          {choiceProps.children as React.ReactNode}
        </motion.label>
      )}
      className={cn(
        "group/questionnaire-choice relative isolate flex cursor-pointer items-center text-start text-base outline-none select-none",
        card
          ? "min-h-14 rounded-lg border border-transparent px-4 py-3"
          : "min-h-9 rounded-none border-b border-border py-2.5 text-muted-foreground transition-colors hover:text-foreground hpx-checked:font-medium hpx-checked:text-foreground",
        "hpx-disabled:pointer-events-none hpx-disabled:cursor-not-allowed hpx-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-hpx-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex shrink-0 items-center overflow-hidden transition-[width,margin-right,opacity] ease-[cubic-bezier(0.45,0,0.25,1)]",
          choiceIndicator === "radio"
            ? "mr-2.5 w-5 opacity-100"
            : "mr-0 w-0 opacity-0",
          choiceIndicator === "check" &&
            "group-hpx-checked/questionnaire-choice:mr-2.5 group-hpx-checked/questionnaire-choice:w-5 group-hpx-checked/questionnaire-choice:opacity-100"
        )}
        style={{ transitionDuration: `${reduceMotion ? 0 : duration}s` }}
      >
      <span
        aria-hidden="true"
        data-hpx-slot="questionnaire-choice-indicator"
        data-indicator={choiceIndicator}
        className={cn(
          "pointer-events-none relative flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-[background-color,border-color,color,border-radius] duration-300 group-hover/questionnaire-choice:border-foreground/40 group-hpx-checked/questionnaire-choice:border-primary dark:bg-input/30",
          "group-hpx-checked/questionnaire-choice:bg-primary group-hpx-checked/questionnaire-choice:text-primary-foreground dark:group-hpx-checked/questionnaire-choice:bg-primary",
          choiceIndicator === "radio" && "rounded-full",
          choiceIndicator === "check" && INDICATOR_ROUNDED[indicatorRounded],
          solid &&
            "group-hpx-checked/questionnaire-choice:border-primary-foreground group-hpx-checked/questionnaire-choice:bg-primary-foreground group-hpx-checked/questionnaire-choice:text-primary dark:group-hpx-checked/questionnaire-choice:bg-primary-foreground",
          bare &&
            cn(
              "border-transparent bg-transparent shadow-none group-hover/questionnaire-choice:border-transparent group-hpx-checked/questionnaire-choice:border-transparent group-hpx-checked/questionnaire-choice:bg-transparent dark:bg-transparent dark:group-hpx-checked/questionnaire-choice:bg-transparent",
              solid ? "group-hpx-checked/questionnaire-choice:text-primary-foreground" : "group-hpx-checked/questionnaire-choice:text-primary"
            )
        )}
      >
        <span
          data-hpx-slot="questionnaire-choice-indicator-dot"
          className={cn(
            "size-2.5 scale-0 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hpx-checked/questionnaire-choice:scale-100 motion-reduce:transition-none",
            solid ? "bg-primary" : "bg-primary-foreground",
            choiceIndicator === "check" && "hidden"
          )}
        />
        <svg
          data-hpx-slot="questionnaire-choice-indicator-check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "hidden size-3.5",
            choiceIndicator === "check" && "block"
          )}
        >
          {/* Draws in when the choice is picked */}
          <path
            d="M4 12.5 9.5 18 20 6.5"
            pathLength={1}
            strokeDasharray={1}
            className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-300 ease-out group-hpx-checked/questionnaire-choice:[stroke-dashoffset:0] motion-reduce:transition-none"
          />
        </svg>
      </span>
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-hpx-slot="questionnaire-choice-label"
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 leading-snug",
          // Text switches to the fill's foreground while it is picked or hovered
          card && primary && "group-hpx-checked/questionnaire-choice:text-primary-foreground group-hpx-checked/questionnaire-choice:[&_[data-hpx-slot=questionnaire-choice-description]]:text-primary-foreground/70",
          card && primary && "group-hover/questionnaire-choice:text-primary-foreground group-hover/questionnaire-choice:[&_[data-hpx-slot=questionnaire-choice-description]]:text-primary-foreground/70"
        )}
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-hpx-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-2.5 hidden size-5 shrink-0 items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  )
}

function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-hpx-slot="questionnaire-choice-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      data-hpx-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative w-full min-w-0"
    >
      <QuestionnairePrimitive.Input
        data-hpx-slot="questionnaire-input"
        className={cn(
          "h-12 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-hpx-slot="questionnaire-error"
      className={cn("mt-2 text-sm text-destructive", className)}
      {...props}
    />
  )
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-hpx-slot="questionnaire-actions"
      className={cn(
        "row-start-3 grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

type ActionVariant = React.ComponentProps<typeof HpxButton>["variant"]
type ActionPointerHandler = (event: React.PointerEvent<HTMLButtonElement>) => void

// The hover fill grows from where the pointer came in
function useActionHover(
  variant: ActionVariant,
  onPointerEnter?: ActionPointerHandler,
  onPointerLeave?: ActionPointerHandler
) {
  const reduceMotion = useReducedMotion()
  const [fill, setFill] = React.useState({ x: 0, y: 0, on: false })
  const solid = variant === "default"

  const place = (event: React.PointerEvent<HTMLButtonElement>, on: boolean) => {
    const box = event.currentTarget.getBoundingClientRect()
    setFill({ x: event.clientX - box.left, y: event.clientY - box.top, on })
  }

  return {
    className: cn(
      solid ? "hover:bg-primary hover:text-foreground" : "hover:bg-background hover:text-primary-foreground dark:hover:bg-input/30",
      "relative isolate h-11 overflow-hidden px-5 text-base focus-visible:ring-0",
      solid && "border-primary"
    ),
    onPointerEnter: (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(event)
      place(event, true)
    },
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(event)
      place(event, false)
    },
    content: (children: React.ReactNode) => (
      <>
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -z-10 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 rounded-full",
            solid ? "bg-background" : "bg-primary"
          )}
          style={{ left: fill.x, top: fill.y }}
          initial={false}
          animate={{ scale: fill.on ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.65, 0, 0.35, 1] }}
        />
        <span className="relative">{children}</span>
      </>
    ),
  }
}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof HpxButton>, "size" | "variant">) {
  const hover = useActionHover(variant, onPointerEnter, onPointerLeave)
  return (
    <QuestionnairePrimitive.Previous
      data-hpx-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        hpxButtonVariants({ size, variant }),
        "col-start-1 row-start-1 justify-self-start",
        hover.className,
        className
      )}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      {...props}
    >
      {hover.content(children ?? "Previous")}
    </QuestionnairePrimitive.Previous>
  )
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof HpxButton>, "size" | "variant">) {
  const hover = useActionHover(variant, onPointerEnter, onPointerLeave)
  return (
    <QuestionnairePrimitive.Skip
      data-hpx-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        hpxButtonVariants({ size, variant }),
        "col-start-2 row-start-1 justify-self-end",
        hover.className,
        className
      )}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      {...props}
    >
      {hover.content(children ?? "Skip")}
    </QuestionnairePrimitive.Skip>
  )
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof HpxButton>, "size" | "variant">) {
  const hover = useActionHover(variant, onPointerEnter, onPointerLeave)
  return (
    <QuestionnairePrimitive.Next
      data-hpx-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        hpxButtonVariants({ size, variant }),
        "col-start-3 row-start-1 justify-self-end",
        hover.className,
        className
      )}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      {...props}
    >
      {hover.content(children ?? "Next")}
    </QuestionnairePrimitive.Next>
  )
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof HpxButton>, "size" | "variant">) {
  const hover = useActionHover(variant, onPointerEnter, onPointerLeave)
  return (
    <QuestionnairePrimitive.Submit
      data-hpx-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        hpxButtonVariants({ size, variant }),
        "col-start-3 row-start-1 justify-self-end",
        hover.className,
        className
      )}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      {...props}
    >
      {hover.content(children ?? "Submit")}
    </QuestionnairePrimitive.Submit>
  )
}

export {
  Questionnaire as HpxQuestionnaire,
  QuestionnaireActions as HpxQuestionnaireActions,
  QuestionnaireChoice as HpxQuestionnaireChoice,
  QuestionnaireChoiceDescription as HpxQuestionnaireChoiceDescription,
  QuestionnaireChoices as HpxQuestionnaireChoices,
  QuestionnaireDescription as HpxQuestionnaireDescription,
  QuestionnaireError as HpxQuestionnaireError,
  QuestionnaireInput as HpxQuestionnaireInput,
  QuestionnaireItem as HpxQuestionnaireItem,
  QuestionnaireNext as HpxQuestionnaireNext,
  QuestionnairePrevious as HpxQuestionnairePrevious,
  QuestionnaireProgress as HpxQuestionnaireProgress,
  QuestionnaireSkip as HpxQuestionnaireSkip,
  QuestionnaireSubmit as HpxQuestionnaireSubmit,
  QuestionnaireTitle as HpxQuestionnaireTitle,
}
export type {
  QuestionnaireChoiceHover as HpxQuestionnaireChoiceHover,
  QuestionnaireChoiceLayout as HpxQuestionnaireChoiceLayout,
  QuestionnaireChoiceColor as HpxQuestionnaireChoiceColor,
  QuestionnaireChoiceIndicator as HpxQuestionnaireChoiceIndicator,
  QuestionnaireContent as HpxQuestionnaireContent,
  QuestionnaireIndicatorRounded as HpxQuestionnaireIndicatorRounded,
  QuestionnaireProgressStyle as HpxQuestionnaireProgressStyle,
}
