"use client"

import * as React from "react"
import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from "lucide-react"

import { AnimatedLinkText } from "@/components/animated-link"
import { Button } from "@/components/ui/button"
import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Command,
  CommandDialog,
  CommandSearch,
  type CommandBackdrop,
  type CommandDropdown,
  type CommandHoverColor,
  type CommandItemHover,
  type CommandRounded,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

function Items({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem onSelect={onSelect}>
          <CalendarIcon />
          <span>Calendar</span>
        </CommandItem>
        <CommandItem onSelect={onSelect}>
          <SmileIcon />
          <span>Search emoji</span>
        </CommandItem>
        <CommandItem onSelect={onSelect}>
          <CalculatorIcon />
          <span>Calculator</span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Settings">
        <CommandItem onSelect={onSelect}>
          <UserIcon />
          <span>Profile</span>
          <CommandShortcut>⌘P</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={onSelect}>
          <CreditCardIcon />
          <span>Billing</span>
          <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={onSelect}>
          <SettingsIcon />
          <span>Settings</span>
          <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </>
  )
}

const controls = {
  dropdown: {
    group: "Dropdown",
    type: "select",
    label: "Dropdown opens",
    value: "morph",
    options: [
      { label: "Morph", value: "morph" },
      { label: "Slide", value: "slide" },
      { label: "Fade", value: "fade" },
    ],
  },
  morphWidth: {
    group: "Dropdown",
    type: "slider",
    label: "Morph width",
    value: 1.25,
    min: 1,
    max: 1.6,
    step: 0.05,
    unit: "x",
  },
  delay: {
    group: "Palette",
    type: "slider",
    label: "Content delay",
    value: 0.15,
    min: 0,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  fade: { group: "Palette", type: "checkbox", label: "Fade in", value: true },
  scale: {
    group: "Palette",
    type: "slider",
    label: "Scale from",
    value: 0.75,
    min: 0.5,
    max: 1,
    step: 0.05,
  },
  backdrop: {
    group: "Palette",
    type: "select",
    label: "Backdrop",
    value: "blur",
    options: [
      { label: "None", value: "none" },
      { label: "Dim", value: "dim" },
      { label: "Blur", value: "blur" },
    ],
  },
  rounded: {
    group: "Both",
    type: "select",
    label: "Roundness",
    value: "xl",
    options: [
      { label: "None", value: "none" },
      { label: "SM", value: "sm" },
      { label: "MD", value: "md" },
      { label: "LG", value: "lg" },
      { label: "XL", value: "xl" },
      { label: "2XL", value: "2xl" },
      { label: "3XL", value: "3xl" },
    ],
  },
  itemHover: {
    group: "Both",
    type: "select",
    label: "Item hover",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fill from top", value: "fill" },
      { label: "None", value: "none" },
    ],
  },
  hoverColor: {
    group: "Both",
    type: "select",
    label: "Hover colour",
    value: "primary",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  iconMotion: { group: "Both", type: "checkbox", label: "Animated search icon", value: true },
  duration: {
    group: "Both",
    type: "slider",
    label: "Duration",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    group: "Both",
    type: "slider",
    label: "Bounce",
    value: 0.15,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
  staggerItems: { group: "Both", type: "checkbox", label: "Stagger items", value: true },
  stagger: {
    group: "Both",
    type: "slider",
    label: "Stagger delay",
    value: 0.03,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },
} satisfies ControlSchema

export function CommandDemo() {
  const [open, setOpen] = React.useState(false)
  const search = React.useRef<HTMLInputElement>(null)
  const panel = useControls(controls)
  const { values } = panel

  const motionProps = {
    duration: values.duration,
    bounce: values.bounce,
    staggerItems: values.staggerItems,
    stagger: values.stagger,
    iconMotion: values.iconMotion,
    itemHover: values.itemHover as CommandItemHover,
    hoverColor: values.hoverColor as CommandHoverColor,
    rounded: values.rounded as CommandRounded,
  }

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      const typing = (e.target as HTMLElement).closest("input, textarea, [contenteditable]")
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        search.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[60vh] flex-col items-center justify-start gap-[4vw] rounded-lg border px-[4vw] py-8 max-md:gap-[10vw]">
        <div className="w-full max-w-xs">
          <CommandSearch
            inputRef={search}
            placeholder="Search commands…"
            hint="/"
            dropdown={values.dropdown as CommandDropdown}
            morphWidth={values.morphWidth}
            {...motionProps}
          >
            <Items />
          </CommandSearch>
        </div>

        <Button
          variant="outline"
          className="group/link h-11 px-4 text-base border-none hover:bg-background aria-expanded:bg-background dark:hover:bg-input/30 dark:aria-expanded:bg-input/30"
          onClick={() => setOpen(true)}
        >
          <AnimatedLinkText>Open palette</AnimatedLinkText>
          <kbd className="rounded-sm bg-muted px-1.5 font-mono text-sm text-muted-foreground">⌘K</kbd>
        </Button>

        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          scale={values.scale}
          fade={values.fade}
          delay={values.delay}
          backdrop={values.backdrop as CommandBackdrop}
          {...motionProps}
        >
          <Command className="rounded-[inherit]">
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
              <Items onSelect={() => setOpen(false)} />
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: press / to search, ⌘K for the palette, ↑ ↓ to move, Enter to pick and Esc to close.
      </p>

      <ControlsPanel title="Command" {...panel} />
    </div>
  )
}
