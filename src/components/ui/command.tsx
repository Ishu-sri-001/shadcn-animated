"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { cn } from "cn"
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  stagger,
  useReducedMotion,
} from "motion/react"

import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

type CommandRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
type CommandBackdrop = "none" | "dim" | "blur"
/** morph: the bar grows into the list. slide: a card drops down. fade: a card fades in. */
type CommandItemHover = "slide" | "fill" | "none"
type CommandHoverColor = "muted" | "primary"
type CommandDropdown = "morph" | "slide" | "fade"

type CommandMotion = {
  /** Seconds. */
  duration: number
  /** Spring overshoot, 0–1. */
  bounce: number
  /** Items fade in one after another. */
  staggerItems: boolean
  /** Seconds between items. */
  stagger: number
  /** Seconds to wait before the first item starts. */
  delay: number
  /** Search icon tilts and grows on hover and focus. */
  /** Rolls item labels when highlighted. */
  textRoll: boolean
  iconMotion: boolean
  /** slide: one highlight glides between items. fill: each fills from the top. */
  itemHover: CommandItemHover
  hoverColor: CommandHoverColor
  rounded: CommandRounded
}

const ROUNDED: Record<CommandRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
}

const BACKDROP: Record<CommandBackdrop, string> = {
  none: "bg-transparent",
  dim: "bg-black/40",
  blur: "bg-black/10 backdrop-blur-sm",
}

// How far items rise from, in px
const ITEM_RISE = 8

const DEFAULT_MOTION: CommandMotion = {
  duration: 0.35,
  bounce: 0.15,
  staggerItems: true,
  stagger: 0.03,
  delay: 0.05,
  iconMotion: true,
  textRoll: false,
  itemHover: "slide",
  hoverColor: "muted",
  rounded: "sm",
}

const CommandMotionContext = React.createContext<CommandMotion>(DEFAULT_MOTION)

function useCommandMotion() {
  return React.useContext(CommandMotionContext)
}

// Only props that were passed override the inherited motion
function useMergedMotion(props: Partial<CommandMotion>) {
  const parent = useCommandMotion()
  const { duration, bounce, staggerItems, stagger, delay, iconMotion, textRoll, itemHover, hoverColor, rounded } = props
  return React.useMemo(
    () => ({
      duration: duration ?? parent.duration,
      bounce: bounce ?? parent.bounce,
      staggerItems: staggerItems ?? parent.staggerItems,
      stagger: stagger ?? parent.stagger,
      delay: delay ?? parent.delay,
      iconMotion: iconMotion ?? parent.iconMotion,
      textRoll: textRoll ?? parent.textRoll,
      itemHover: itemHover ?? parent.itemHover,
      hoverColor: hoverColor ?? parent.hoverColor,
      rounded: rounded ?? parent.rounded,
    }),
    [parent, duration, bounce, staggerItems, stagger, delay, iconMotion, textRoll, itemHover, hoverColor, rounded]
  )
}

function Command({
  className,
  duration,
  bounce,
  staggerItems,
  stagger,
  delay,
  iconMotion,
  textRoll,
  itemHover,
  hoverColor,
  rounded,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & Partial<CommandMotion>) {
  const motionProps = useMergedMotion({ duration, bounce, staggerItems, stagger, delay, iconMotion, textRoll, itemHover, hoverColor, rounded })

  return (
    <CommandMotionContext.Provider value={motionProps}>
      <CommandPrimitive
        data-slot="command"
        className={cn(
          "flex size-full flex-col overflow-hidden bg-popover p-1 text-popover-foreground",
          ROUNDED[motionProps.rounded],
          className
        )}
        {...props}
      />
    </CommandMotionContext.Provider>
  )
}

/** A palette that scales and fades in over the page. Put a `Command` inside it. */
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  open,
  onOpenChange,
  scale = 0.75,
  fade = true,
  backdrop = "blur",
  duration,
  bounce,
  staggerItems,
  stagger,
  delay = 0.25,
  iconMotion,
  textRoll,
  itemHover,
  hoverColor,
  rounded,
}: {
  title?: string
  description?: string
  className?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Size the palette grows from, 0–1. */
  scale?: number
  /** Fades in and out while it scales. */
  fade?: boolean
  backdrop?: CommandBackdrop
  children: React.ReactNode
} & Partial<CommandMotion>) {
  const options = useMergedMotion({ duration, bounce, staggerItems, stagger, delay, iconMotion, textRoll, itemHover, hoverColor, rounded })
  const reduceMotion = useReducedMotion()
  const from = { opacity: fade || reduceMotion ? 0 : 1, scale: reduceMotion ? 1 : scale }

  return (
    <CommandMotionContext.Provider value={options}>
      <MotionConfig reducedMotion="user">
        <DialogPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
          <AnimatePresence>
            {open && (
              <DialogPrimitive.Portal keepMounted>
                <DialogPrimitive.Backdrop
                  data-slot="command-overlay"
                  render={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  }
                  className={cn("fixed inset-0 isolate z-50", BACKDROP[backdrop])}
                />
                <DialogPrimitive.Popup
                  data-slot="command-dialog"
                  render={
                    <motion.div
                      initial={from}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ ...from, transition: { duration: 0.15, ease: "easeIn" } }}
                      transition={
                        reduceMotion
                          ? { duration: 0.2 }
                          : { type: "spring", visualDuration: options.duration, bounce: options.bounce }
                      }
                    />
                  }
                  className={cn(
                    "fixed top-1/4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none max-md:max-w-[calc(100%-2rem)]",
                    ROUNDED[options.rounded],
                    className
                  )}
                >
                  <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    {description}
                  </DialogPrimitive.Description>
                  {children}
                </DialogPrimitive.Popup>
              </DialogPrimitive.Portal>
            )}
          </AnimatePresence>
        </DialogPrimitive.Root>
      </MotionConfig>
    </CommandMotionContext.Provider>
  )
}

function CommandInput({
  className,
  plain = false,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  /** A bare bar with no tinted box, for the search bar. */
  plain?: boolean
}) {
  const { iconMotion, duration, bounce } = useCommandMotion()
  const [focused, setFocused] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const active = iconMotion && (focused || hovered)

  return (
    <div
      data-slot="command-input-wrapper"
      className={plain ? "" : "p-2"}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <InputGroup
        className={cn(
          "shadow-none! *:data-[slot=input-group-addon]:pr-4!",
          plain
            ? "h-14! rounded-none! border-0! bg-transparent! has-[[data-slot=input-group-control]:focus-visible]:ring-0!"
            : "h-12! rounded-lg! border-input/30 bg-input/30"
        )}
      >
        <CommandPrimitive.Input
          data-slot="command-input"
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          className={cn(
            "w-full text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            "px-4",
            className
          )}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <motion.span
            className="flex"
            initial={false}
            animate={{ scale: active ? 1.2 : 1, rotate: active ? -12 : 0, opacity: active ? 1 : 0.5 }}
            transition={{ type: "spring", visualDuration: duration, bounce: Math.max(bounce, 0.3) }}
          >
            <SearchIcon className="size-5 shrink-0" />
          </motion.span>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

const CommandListContext = React.createContext("")

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const { duration, staggerItems, stagger: gap, delay } = useCommandMotion()
  const reduceMotion = useReducedMotion()
  const list = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  // Items rise and fade in one by one when the list appears
  React.useLayoutEffect(() => {
    const items = list.current?.querySelectorAll("[cmdk-group-heading], [cmdk-item], [cmdk-separator]")
    if (!items?.length || !staggerItems || reduceMotion) return
    // Hidden until each item's turn comes
    items.forEach((el) => ((el as HTMLElement).style.opacity = "0"))
    const controls = animate(
      items,
      { opacity: [0, 1], y: [ITEM_RISE, 0] },
      { duration: duration + 0.15, delay: stagger(gap, { startDelay: delay }), ease: [0.22, 1, 0.36, 1] }
    )
    return () => controls.stop()
    // Runs once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <CommandListContext.Provider value={listId}>
      <CommandPrimitive.List
        ref={list}
        data-slot="command-list"
        className={cn(
          "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
          className
        )}
        {...props}
      />
    </CommandListContext.Provider>
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  // Server render has no items yet, so hold back until hydrated
  const ready = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  if (!ready) return null

  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-base", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-sm **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

const HOVER_BG: Record<CommandHoverColor, string> = {
  muted: "bg-muted",
  primary: "bg-primary",
}

const HOVER_TEXT: Record<CommandHoverColor, string> = {
  muted: "data-selected:text-foreground",
  primary: "data-selected:text-primary-foreground",
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const { itemHover, hoverColor, duration, bounce, rounded, textRoll } = useCommandMotion()
  const listId = React.useContext(CommandListContext)
  const reduceMotion = useReducedMotion()
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  // Same store update for old and new item, so the highlight never drops out
  const current = useCommandState((state) => state.value)
  const selected =
    !!current && node?.getAttribute("data-value")?.toLowerCase() === current.toLowerCase()

  const bg = cn("absolute inset-0 -z-10 rounded-[inherit]", HOVER_BG[hoverColor])

  return (
    <CommandPrimitive.Item
      ref={setNode}
      data-slot="command-item"
      className={cn(
        "group/command-item relative isolate flex cursor-default items-center gap-2 px-2 py-2 text-base outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        ROUNDED[rounded],
        itemHover !== "none" && "transition-colors duration-200 motion-reduce:transition-none",
        itemHover === "none" ? "data-selected:bg-muted data-selected:text-foreground" : HOVER_TEXT[hoverColor],
        itemHover === "none" && hoverColor === "primary" && "data-selected:bg-primary data-selected:text-primary-foreground",
        className
      )}
      {...props}
    >
      {itemHover === "slide" && selected && (
        <motion.span
          aria-hidden
          layoutId={`${listId}-hover`}
          className={bg}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", visualDuration: duration * 0.6, bounce }
          }
        />
      )}
      {itemHover === "fill" && (
        <span
          aria-hidden
          className={cn(
            bg,
            "origin-top scale-y-0 transition-transform duration-300 ease-out group-data-selected/command-item:scale-y-100 motion-reduce:transition-none"
          )}
        />
      )}
      {textRoll ? React.Children.map(children, (child) => {
        if (typeof child === "string") return <CommandRollText>{child}</CommandRollText>
        if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === "span" && typeof child.props.children === "string") {
          return React.cloneElement(child, {}, <CommandRollText>{child.props.children}</CommandRollText>)
        }
        return child
      }) : children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandRollText({ children }: { children: string }) {
  const roll = "block transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-data-selected/command-item:-translate-y-full motion-reduce:transition-none"
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span className={roll}>{children}</span>
      <span aria-hidden className={cn(roll, "absolute inset-x-0 top-full")}>{children}</span>
    </span>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-sm tracking-widest text-muted-foreground group-data-selected/command-item:text-inherit",
        className
      )}
      {...props}
    />
  )
}

/** A search box that opens its results below as you focus it. Put the items inside. */
// Tablet and mobile end at 1025px, so only wider screens count as desktop
function useDesktop() {
  return React.useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(min-width: 1026px)")
      query.addEventListener("change", notify)
      return () => query.removeEventListener("change", notify)
    },
    () => window.matchMedia("(min-width: 1026px)").matches,
    () => true
  )
}

function CommandSearch({
  children,
  className,
  placeholder = "Search…",
  hint,
  inputRef,
  open: openProp,
  onOpenChange,
  dropdown = "morph",
  morphWidth = 1.25,
  duration,
  bounce,
  staggerItems,
  stagger,
  delay,
  iconMotion,
  textRoll,
  itemHover,
  hoverColor,
  rounded,
}: {
  children: React.ReactNode
  className?: string
  placeholder?: string
  /** Key hint shown at the end while the box is idle. */
  hint?: string
  inputRef?: React.Ref<HTMLInputElement>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dropdown?: CommandDropdown
  /** Morph only: how much wider than the bar it grows, 1 = same. */
  morphWidth?: number
} & Partial<CommandMotion>) {
  const options = useMergedMotion({ duration, bounce, staggerItems, stagger, delay, iconMotion, textRoll, itemHover, hoverColor, rounded })
  const reduceMotion = useReducedMotion()
  const desktop = useDesktop()
  const [triggerHovered, setTriggerHovered] = React.useState(false)
  const [triggerFocused, setTriggerFocused] = React.useState(false)
  const [inputFocused, setInputFocused] = React.useState(false)
  const triggerActive = options.iconMotion && (triggerHovered || triggerFocused || inputFocused)
  const [own, setOwn] = React.useState(false)
  const open = openProp ?? own
  const root = React.useRef<HTMLDivElement>(null)
  const setOpen = (next: boolean) => {
    setTriggerHovered(false)
    setTriggerFocused(false)
    setOwn(next)
    onOpenChange?.(next)
  }

  return (
    <CommandMotionContext.Provider value={options}>
      <MotionConfig reducedMotion="user">
        <div
          ref={root}
          data-slot="command-search"
          onFocus={(event) => {
            if (event.target instanceof HTMLInputElement) setOpen(true)
          }}
          onClick={() => {
            setOpen(true)
            root.current?.querySelector("input")?.focus()
          }}
          onBlur={(event) => {
            // Keep it open while focus stays inside the box
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !open) return
            event.stopPropagation()
            setOpen(false)
            root.current?.querySelector("input")?.blur()
          }}
          className={cn("relative w-full", className)}
        >
          <CommandPrimitive
            className="flex flex-col text-popover-foreground"
            onKeyDown={(event) => {
              // Enter picks the item, then closes the list
              if (event.key === "Enter") setOpen(false)
            }}
          >
            <div className="relative h-14">
              <motion.div
                initial={false}
                animate={{
                  width: open ? `${(dropdown === "morph" && desktop ? morphWidth : 1) * 100}%` : 44,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", visualDuration: options.duration, bounce: 0 }
                }
                className={cn(
                  "absolute top-0 left-1/2 z-20 w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden border bg-popover",
                  ROUNDED[options.rounded]
                )}
              >
                <motion.div
                  initial={false}
                  animate={{ height: open ? 56 : 42 }}
                  transition={{ duration: reduceMotion ? 0 : options.duration }}
                  className="relative"
                  onPointerEnter={() => setTriggerHovered(true)}
                  onPointerLeave={() => setTriggerHovered(false)}
                >
                  <div className={cn("transition-opacity duration-200 motion-reduce:transition-none [&_[data-slot=input-group-addon]]:invisible", !open && "pointer-events-none opacity-0")} aria-hidden={!open}>
                    <CommandInput ref={inputRef} plain placeholder={placeholder} tabIndex={open ? 0 : -1} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                  </div>
                  {!open && (
                    <button
                      type="button"
                      aria-label="Search commands"
                      aria-expanded={false}
                      aria-keyshortcuts={hint}
                      onPointerEnter={() => setTriggerHovered(true)}
                      onPointerLeave={() => setTriggerHovered(false)}
                      onFocus={() => setTriggerFocused(true)}
                      onBlur={() => setTriggerFocused(false)}
                      className="absolute inset-0 flex size-full items-center justify-center rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                    </button>
                  )}
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute z-10 flex size-5"
                    initial={false}
                    animate={{ right: open ? 16 : 11, top: open ? 18 : 11 }}
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", visualDuration: options.duration, bounce: 0 }}
                  >
                    <motion.span
                      className="flex"
                      initial={false}
                      animate={{ scale: triggerActive ? 1.2 : 1, rotate: triggerActive ? -12 : 0, opacity: triggerActive ? 1 : 0.5 }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", visualDuration: options.duration, bounce: Math.max(options.bounce, 0.3) }}
                    >
                      <SearchIcon className="size-5 shrink-0" />
                    </motion.span>
                  </motion.span>
                </motion.div>
                <AnimatePresence initial={false}>
                  {open && dropdown === "morph" && (
                    <motion.div
                      key="results"
                      // Stops the input blurring before an item is clicked
                      onMouseDown={(event) => event.preventDefault()}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", visualDuration: options.duration, bounce: 0 },
                      }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                      className="overflow-hidden"
                    >
                      <div className="border-t p-1">
                        <CommandList>{children}</CommandList>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            <AnimatePresence initial={false}>
              {open && dropdown !== "morph" && (
                <motion.div
                  key="results"
                  onMouseDown={(event) => event.preventDefault()}
                  initial={{ opacity: 0, y: dropdown === "slide" ? -16 : 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: reduceMotion
                      ? { duration: 0 }
                      : dropdown === "slide"
                        ? { type: "spring", visualDuration: options.duration, bounce: options.bounce }
                        : { duration: options.duration, ease: [0.45, 0, 0.25, 1] },
                  }}
                  exit={{
                    opacity: 0,
                    y: dropdown === "slide" ? -16 : 0,
                    transition: { duration: 0.15, ease: "easeIn" },
                  }}
                  className={cn(
                    "absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 border bg-popover p-1 shadow-lg",
                    ROUNDED[options.rounded]
                  )}
                >
                  <CommandList>{children}</CommandList>
                </motion.div>
              )}
            </AnimatePresence>
          </CommandPrimitive>
        </div>
      </MotionConfig>
    </CommandMotionContext.Provider>
  )
}

export {
  Command,
  CommandDialog,
  CommandSearch,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
export type { CommandRounded, CommandBackdrop, CommandDropdown, CommandItemHover, CommandHoverColor }
