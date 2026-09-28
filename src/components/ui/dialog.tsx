"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react"

import { Button } from "@/components/ui/button"
import { FillButton, useTriggerHover } from "@/components/ui/hover-effects"
import { XIcon } from "lucide-react"

type DialogRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
type DialogBackdrop = "none" | "dim" | "blur"
type DialogExit = "fade" | "drop" | "shrink"

type DialogMotion = {
  /** Spring instead of an eased tween. */
  springy: boolean
  /** Seconds. */
  duration: number
  /** Spring overshoot, 0–1. */
  bounce: number
  /** Grow from and back into trigger. */
  fromTrigger: boolean
  /** Content fades in after the box. */
  contentFade: boolean
  /** Content grows from 80% while fading. */
  contentScale: boolean
  /** Content fades out before closing. */
  contentFadeOut: boolean
  /** Trigger text rolls up on hover. */
  textRoll: boolean
  /** Trigger fills from pointer on hover. */
  fillOnHover: boolean
  backdrop: DialogBackdrop
  exit: DialogExit
  /** Clicking outside closes the dialog. */
  dismissible: boolean
  /** Shake when outside click is blocked. */
  shakeOnBlock: boolean
  rounded: DialogRounded
}

const ROUNDED: Record<DialogRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
}

const BACKDROP: Record<DialogBackdrop, string> = {
  none: "bg-transparent",
  dim: "bg-black/40",
  blur: "bg-black/10 backdrop-blur-sm",
}

/** Where each exit leaves to. */
const EXIT: Record<DialogExit, { opacity: number; scale: number; y: string }> = {
  fade: { opacity: 0, scale: 0.97, y: "0%" },
  drop: { opacity: 0, scale: 1, y: "30%" },
  shrink: { opacity: 0, scale: 0.8, y: "0%" },
}

/** Fades content in after the box. */
function fadeInContent(popup: HTMLElement, scale: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const centreX = popup.clientWidth / 2
  const centreY = popup.clientHeight / 2
  for (const child of popup.querySelectorAll<HTMLElement>(":scope > *")) {
    const origin = `${centreX - child.offsetLeft}px ${centreY - child.offsetTop}px`
    const timing = { duration: 500, delay: 200, fill: "backwards" as const }
    child.animate([{ opacity: 0 }, { opacity: 1 }], {
      ...timing,
      easing: "cubic-bezier(0.45, 0, 0.55, 1)",
    })
    if (scale !== 1) {
      child.animate(
        [
          { scale: String(scale), transformOrigin: origin },
          { scale: "1", transformOrigin: origin },
        ],
        { ...timing, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      )
    }
  }
}

/** Content fade-out time, in seconds. */
const CONTENT_OUT = 0.15

function fadeOutContent(popup: HTMLElement) {
  for (const child of popup.querySelectorAll<HTMLElement>(":scope > *")) {
    child.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CONTENT_OUT * 1000,
      easing: "ease-in",
      fill: "forwards",
    })
  }
}

type Point = { x: number; y: number }

const DialogContext = React.createContext<{
  open: boolean
  motion: DialogMotion
  origin: Point | null
  setOrigin: (origin: Point) => void
} | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("Dialog parts must be used inside <Dialog>.")
  return context
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  springy = true,
  duration = 0.35,
  bounce = 0.2,
  fromTrigger = true,
  contentFade = true,
  contentScale = false,
  contentFadeOut = true,
  textRoll = true,
  fillOnHover = true,
  backdrop = "blur",
  exit = "fade",
  dismissible = true,
  shakeOnBlock = true,
  rounded = "xl",
  ...props
}: DialogPrimitive.Root.Props & Partial<DialogMotion>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [origin, setOrigin] = React.useState<Point | null>(null)
  const open = openProp ?? uncontrolledOpen

  const context = React.useMemo(
    () => ({
      open,
      origin,
      setOrigin,
      motion: {
        springy,
        duration,
        bounce,
        fromTrigger,
        contentFade,
        contentScale,
        contentFadeOut,
        textRoll,
        fillOnHover,
        backdrop,
        exit,
        dismissible,
        shakeOnBlock,
        rounded,
      },
    }),
    [open, origin, springy, duration, bounce, fromTrigger, contentFade, contentScale, contentFadeOut, textRoll, fillOnHover, backdrop, exit, dismissible, shakeOnBlock, rounded]
  )

  return (
    <DialogContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <DialogPrimitive.Root
          data-slot="dialog"
          open={open}
          onOpenChange={(next, details) => {
            setUncontrolledOpen(next)
            onOpenChange?.(next, details)
          }}
          disablePointerDismissal={!dismissible}
          {...props}
        />
      </MotionConfig>
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
  children,
  ...props
}: DialogPrimitive.Trigger.Props) {
  const { setOrigin, motion: options } = useDialog()
  const hover = useTriggerHover(options)

  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      onClick={(event) => {
        // Remember origin for grow-from-trigger.
        const rect = event.currentTarget.getBoundingClientRect()
        setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        onClick?.(event)
      }}
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
    </DialogPrimitive.Trigger>
  )
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const { motion: options } = useDialog()
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      render={
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeOut",
              delay: options.contentFadeOut ? CONTENT_OUT : 0,
            },
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      }
      className={cn("fixed inset-0 isolate z-50", BACKDROP[options.backdrop], className)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const { open, origin, motion: options } = useDialog()
  const popup = React.useRef<HTMLDivElement | null>(null)
  const reduceMotion = useReducedMotion()

  const enter: Transition = reduceMotion
    ? { duration: 0.2, ease: "easeOut" }
    : options.springy
      ? { type: "spring", visualDuration: options.duration, bounce: options.bounce }
      : { duration: options.duration, ease: [0.22, 1, 0.36, 1] }

  // Reduced motion: fade only, in place.
  const fromTrigger = options.fromTrigger && origin !== null && !reduceMotion
  const still = { opacity: 0, scale: 1, x: 0, y: "0%" }
  const closed = reduceMotion
    ? still
    : fromTrigger
      ? {
          opacity: 0,
          scale: 0.2,
          x: origin.x - window.innerWidth / 2,
          y: origin.y - window.innerHeight / 2,
        }
      : { opacity: 0, scale: 0.95, x: 0, y: "0%" }
  const leave = reduceMotion ? still : fromTrigger ? closed : { ...EXIT[options.exit], x: 0 }

  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      popup.current = node
      if (node && options.contentFade) fadeInContent(node, options.contentScale ? 0.8 : 1)
    },
    [options.contentFade, options.contentScale]
  )

  // Fade content out before exit.
  const fadeOut = options.contentFadeOut
  React.useEffect(() => {
    if (open || !fadeOut || !popup.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    fadeOutContent(popup.current)
  }, [open, fadeOut])
  const exitDelay = fadeOut && !reduceMotion ? CONTENT_OUT : 0

  const shake = () => {
    const node = popup.current
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    animate(node, { x: [0, -8, 8, -5, 5, -2, 0] }, { duration: 0.45, ease: "easeOut" })
  }

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal keepMounted>
          <DialogOverlay
            onPointerDown={!options.dismissible && options.shakeOnBlock ? shake : undefined}
          />
          <DialogPrimitive.Popup
            ref={attach}
            data-slot="dialog-content"
            render={
              <motion.div
                initial={closed}
                animate={{ opacity: 1, scale: 1, x: 0, y: "0%" }}
                exit={{
                  ...leave,
                  transition: reduceMotion
                    ? { duration: 0.2, ease: "easeOut" }
                    : fromTrigger
                    ? {
                        type: "spring",
                        visualDuration: options.duration * 0.8,
                        bounce: 0,
                        delay: exitDelay,
                      }
                    : { duration: 0.2, ease: [0.4, 0, 1, 1], delay: exitDelay },
                }}
                transition={enter}
              />
            }
            className={cn(
              "fixed top-1/2 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-6 bg-popover p-8 max-md:p-6 text-base text-popover-foreground ring-1 ring-foreground/10 outline-none max-md:max-w-[calc(100%-2rem)]",
              ROUNDED[options.rounded],
              className
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "absolute top-5 right-5 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
                      // Cross turns a quarter on hover.
                      "[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out hover:[&_svg]:rotate-90 focus-visible:[&_svg]:rotate-90 motion-reduce:[&_svg]:transition-none"
                    )}
                  />
                }
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Popup>
        </DialogPortal>
      )}
    </AnimatePresence>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-8 -mb-8 flex justify-end gap-2 rounded-b-[inherit] border-t bg-muted/50 px-8 py-5 max-md:-mx-6 max-md:-mb-6 max-md:px-6 max-md:flex-col-reverse max-md:justify-start",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}


/** Footer-sized button with hover fill. */
function DialogButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <FillButton className={cn("h-auto px-3 py-2", className)} {...props} />
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-xl leading-tight font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-base leading-relaxed text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogButton,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
export type { DialogBackdrop, DialogExit, DialogRounded }
