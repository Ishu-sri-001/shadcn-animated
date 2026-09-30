"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

import { HpxButton } from "@/components/ui/button"

/** Text that rolls up to a copy of itself while the nearest `group/roll` is hovered. */
function RollText({ children }: { children: React.ReactNode }) {
  const roll =
    "block transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
  return (
    <span className="relative block overflow-hidden">
      <span className={cn(roll, "group-hover/roll:-translate-y-full")}>{children}</span>
      <span
        aria-hidden
        className={cn(roll, "absolute inset-x-0 top-0 translate-y-full group-hover/roll:translate-y-0")}
      >
        {children}
      </span>
    </span>
  )
}

/** Classes for a button that carries the hover fill: the fill sits under its label. */
const HOVER_FILL_CLASSES =
  "relative isolate overflow-hidden transition-[border-color] duration-400 ease-in-out hover:border-primary hover:bg-background dark:hover:bg-input/30"

/**
 * A hover fill that grows as a circle from where the pointer came in, and shrinks back
 * towards where it left. Put `circle` inside the button, wrap its content in `label`, and
 * call `place` on enter and leave.
 */
function useHoverFill() {
  const [fill, setFill] = React.useState({ x: 0, y: 0, on: false })
  const place = (event: React.PointerEvent<HTMLElement>, on: boolean) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setFill({ x: event.clientX - rect.left, y: event.clientY - rect.top, on })
  }
  const circle = (
    // Wide enough to cover the button from any corner once fully grown.
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -z-10 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
      style={{ left: fill.x, top: fill.y }}
      initial={false}
      animate={{ scale: fill.on ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  )
  const label = (children: React.ReactNode) => <span className="relative">{children}</span>
  return { place, circle, label }
}

/**
 * The hover state shared by the dialog and drawer triggers: text that rolls, and optionally
 * the circle fill. Without the fill, hover leaves the background alone.
 */
function useTriggerHover({ textRoll, fillOnHover }: { textRoll: boolean; fillOnHover: boolean }) {
  const { place, circle, label } = useHoverFill()
  return {
    className: cn(
      "group/roll",
      fillOnHover
        ? HOVER_FILL_CLASSES
        : "hover:bg-background hover:text-foreground dark:hover:bg-input/30"
    ),
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (fillOnHover) place(event, true)
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      if (fillOnHover) place(event, false)
    },
    content: (children: React.ReactNode) => {
      const text = textRoll && typeof children === "string" ? <RollText>{children}</RollText> : children
      return fillOnHover ? (
        <>
          {circle}
          {label(text)}
        </>
      ) : (
        text
      )
    },
  }
}

/** An outlined button with the hover fill. */
function FillButton({
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof HpxButton>) {
  const { place, circle, label } = useHoverFill()

  return (
    <HpxButton
      variant="outline"
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        place(event, true)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        place(event, false)
      }}
      className={cn(HOVER_FILL_CLASSES, className)}
      {...props}
    >
      {circle}
      {label(children)}
    </HpxButton>
  )
}

export { FillButton as HpxFillButton, HOVER_FILL_CLASSES as HPX_HOVER_FILL_CLASSES, RollText as HpxRollText, useHoverFill as useHpxHoverFill, useTriggerHover as useHpxTriggerHover }
