"use client"

import * as React from "react"
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire"
import { cn } from "cn"
import { motion, useReducedMotion, type Transition, type Variants } from "motion/react"

import { buttonVariants, type Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

/** slide-x / slide-y: the next question travels in the direction you move. fade: it fades in place. scale: it grows in. */
type QuestionnaireContent = "slide-x" | "slide-y" | "fade" | "scale" | "none"
type QuestionnaireProgressStyle = "text" | "bar"

type QuestionnaireMotion = {
  content: QuestionnaireContent
  /** How far the question slides, in px. */
  distance: number
  /** Seconds. */
  duration: number
  bounce: number
  /** The form grows and shrinks to fit each question instead of jumping. */
  smoothHeight: boolean
  /** Choices rise in one after another. */
  staggerChoices: boolean
  /** Seconds between choices. */
  stagger: number
  progressStyle: QuestionnaireProgressStyle
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

// Measures the content so the form can grow and shrink to fit it
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

function Questionnaire({
  content = "slide-x",
  distance = 40,
  duration = 0.4,
  bounce = 0.1,
  smoothHeight = true,
  staggerChoices = true,
  stagger = 0.05,
  progressStyle = "bar",
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
  const [measure, height] = useHeight()
  const grow = useSpring({ duration: 0.4, bounce: 0 } as QuestionnaireMotion)
  const item = itemProp ?? own

  const context = React.useMemo(
    () => ({ content, distance, duration, bounce, smoothHeight, staggerChoices, stagger, progressStyle, item, direction }),
    [content, distance, duration, bounce, smoothHeight, staggerChoices, stagger, progressStyle, item, direction]
  )

  return (
    <QuestionnaireContext.Provider value={context}>
      {/* Padding and matching negative margin keep focus rings from being clipped */}
      <motion.div
        initial={false}
        animate={{ height: smoothHeight && height !== null ? height : "auto" }}
        transition={grow}
        className="-m-1 overflow-hidden p-1"
      >
        <div ref={measure}>
          <QuestionnairePrimitive.Root
            data-slot="questionnaire"
            ref={(node) => {
              root.current = node
              if (typeof ref === "function") ref(node)
              else if (ref) ref.current = node
            }}
            defaultItem={defaultItem}
            item={itemProp}
            onItemChange={(next) => {
              // Which way to travel, from where the two questions sit in the form
              const names = [...(root.current?.querySelectorAll<HTMLElement>('[data-slot="questionnaire-item"]') ?? [])].map(
                (el) => el.dataset.name
              )
              const from = item ?? names[0]
              setDirection(names.indexOf(next) >= names.indexOf(from) ? 1 : -1)
              setOwn(next)
              onItemChange?.(next)
            }}
            className={cn("flex w-full min-w-0 flex-col gap-4", className)}
            {...props}
          />
        </div>
      </motion.div>
    </QuestionnaireContext.Provider>
  )
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  const context = useQuestionnaire()
  const fill = useSpring(context)
  const text = cn(
    "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
    className
  )

  if (context.progressStyle === "text") {
    return <QuestionnairePrimitive.Progress data-slot="questionnaire-progress" className={text} {...props} />
  }

  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      render={(progressProps, state) => {
        const { children, ...rest } = progressProps
        return (
          <div {...rest} className="flex flex-col gap-2">
            <span className={text}>{children as React.ReactNode}</span>
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
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  const context = useQuestionnaire()
  const reduceMotion = useReducedMotion()
  const active = context.item === name
  const still = context.content === "none" || reduceMotion
  const slideX = context.content === "slide-x" && !reduceMotion
  const slideY = context.content === "slide-y" && !reduceMotion
  const spring = useSpring(context)

  const variants: Variants = {
    enter: (d: number) => ({
      opacity: still ? 1 : 0,
      x: slideX ? d * context.distance : 0,
      y: slideY ? d * context.distance : 0,
      scale: context.content === "scale" && !reduceMotion ? 0.94 : 1,
    }),
    center: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        ...(context.content === "fade" ? { duration: context.duration, ease: fadeEase } : spring),
        staggerChildren: context.staggerChoices && !reduceMotion ? context.stagger : 0,
        delayChildren: 0.08,
      },
    },
  }

  return (
    <QuestionnairePrimitive.Item
      name={name}
      data-name={name}
      data-slot="questionnaire-item"
      className={cn(
        "flex min-w-0 flex-col gap-4 border-0 p-0 outline-none",
        className
      )}
      {...props}
    >
      {/* Remounts when the question becomes active, so it plays its entrance */}
      <motion.div
        key={active ? "on" : "off"}
        custom={context.direction}
        variants={variants}
        initial={active ? "enter" : false}
        animate="center"
        className="flex min-w-0 flex-col gap-4"
      >
        {children}
      </motion.div>
    </QuestionnairePrimitive.Item>
  )
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        "font-heading text-base leading-snug font-medium text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4",
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
      data-slot="questionnaire-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn(
        "group/questionnaire-choices grid min-w-0 gap-2",
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
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      render={<motion.label variants={choiceVariants} />}
      className={cn(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-input bg-transparent px-3 py-2.5 text-start text-sm transition-colors outline-none select-none hover:bg-muted/50 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive dark:bg-input/20 data-checked:border-primary/40 data-checked:bg-muted dark:data-checked:bg-muted",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[4px] border border-input group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:bg-input/30 dark:group-data-checked/questionnaire-choice:bg-primary"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="hidden size-2 rounded-full bg-primary-foreground group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon data-slot="questionnaire-choice-indicator-check" className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block" />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex"
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
      data-slot="questionnaire-choice-description"
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
      data-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative w-full min-w-0"
    >
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          "h-8 min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
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
      data-slot="questionnaire-error"
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
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        className
      )}
      {...props}
    />
  )
}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
  )
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Skip"}
    </QuestionnairePrimitive.Skip>
  )
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  )
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  )
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
export type { QuestionnaireContent, QuestionnaireProgressStyle }
