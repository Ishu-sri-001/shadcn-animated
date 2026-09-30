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

import { HpxAnimatedLinkText } from "@/components/animated-link"
import { HpxButton } from "@/components/ui/button"
import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxCommand,
  HpxCommandDialog,
  HpxCommandSearch,
  type HpxCommandBackdrop,
  type HpxCommandDropdown,
  type HpxCommandHoverColor,
  type HpxCommandItemHover,
  type HpxCommandRounded,
  HpxCommandEmpty,
  HpxCommandGroup,
  HpxCommandInput,
  HpxCommandItem,
  HpxCommandList,
  HpxCommandSeparator,
  HpxCommandShortcut,
} from "@/components/ui/command"

function Items({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      <HpxCommandEmpty>No results found.</HpxCommandEmpty>
      <HpxCommandGroup heading="Suggestions">
        <HpxCommandItem onSelect={onSelect}>
          <CalendarIcon />
          <span>Calendar</span>
        </HpxCommandItem>
        <HpxCommandItem onSelect={onSelect}>
          <SmileIcon />
          <span>Search emoji</span>
        </HpxCommandItem>
        <HpxCommandItem onSelect={onSelect}>
          <CalculatorIcon />
          <span>Calculator</span>
        </HpxCommandItem>
      </HpxCommandGroup>
      <HpxCommandSeparator />
      <HpxCommandGroup heading="Settings">
        <HpxCommandItem onSelect={onSelect}>
          <UserIcon />
          <span>Profile</span>
          <HpxCommandShortcut>⌘P</HpxCommandShortcut>
        </HpxCommandItem>
        <HpxCommandItem onSelect={onSelect}>
          <CreditCardIcon />
          <span>Billing</span>
          <HpxCommandShortcut>⌘B</HpxCommandShortcut>
        </HpxCommandItem>
        <HpxCommandItem onSelect={onSelect}>
          <SettingsIcon />
          <span>Settings</span>
          <HpxCommandShortcut>⌘S</HpxCommandShortcut>
        </HpxCommandItem>
      </HpxCommandGroup>
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
    disabled: (v) => v.dropdown !== "morph",
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
    disabled: (v) => !v.staggerItems,
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
    value: "sm",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
      { label: "3xl", value: "3xl" },
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
    disabled: (v) => v.itemHover === "none",
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
    disabled: (v) => v.dropdown === "fade" && v.itemHover !== "slide",
    group: "Both",
    type: "slider",
    label: "Bounce",
    value: 0.15,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
  textRoll: { group: "Both", type: "checkbox", label: "Text roll", value: false },
  staggerItems: { group: "Both", type: "checkbox", label: "Stagger items", value: true },
  stagger: {
    disabled: (v) => !v.staggerItems,
    group: "Both",
    type: "slider",
    label: "Stagger delay",
    value: 0.03,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },
} satisfies HpxControlSchema

export function HpxCommandDemo() {
  const [open, setOpen] = React.useState(false)
  const search = React.useRef<HTMLInputElement>(null)
  const panel = useHpxControls(controls)
  const { values } = panel

  const motionProps = {
    duration: values.duration,
    bounce: values.bounce,
    staggerItems: values.staggerItems,
    stagger: values.stagger,
    iconMotion: values.iconMotion,
    itemHover: values.itemHover as HpxCommandItemHover,
    hoverColor: values.hoverColor as HpxCommandHoverColor,
    rounded: values.rounded as HpxCommandRounded,
    textRoll: values.textRoll,
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
          <HpxCommandSearch
            inputRef={search}
            placeholder="Search commands…"
            hint="/"
            dropdown={values.dropdown as HpxCommandDropdown}
            morphWidth={values.morphWidth}
            {...motionProps}
          >
            <Items />
          </HpxCommandSearch>
        </div>

        <HpxButton
          variant="outline"
          className="group/link h-11 px-4 text-base border-none hover:bg-background aria-expanded:bg-background dark:hover:bg-input/30 dark:aria-expanded:bg-input/30"
          onClick={() => setOpen(true)}
        >
          <HpxAnimatedLinkText>Open palette</HpxAnimatedLinkText>
          <kbd className="rounded-sm bg-muted px-1.5 font-mono text-sm text-muted-foreground">⌘K</kbd>
        </HpxButton>

        <HpxCommandDialog
          open={open}
          onOpenChange={setOpen}
          scale={values.scale}
          fade={values.fade}
          delay={values.delay}
          backdrop={values.backdrop as HpxCommandBackdrop}
          {...motionProps}
        >
          <HpxCommand className="rounded-[inherit]">
            <HpxCommandInput placeholder="Type a command or search…" />
            <HpxCommandList>
              <Items onSelect={() => setOpen(false)} />
            </HpxCommandList>
          </HpxCommand>
        </HpxCommandDialog>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: press / to search, ⌘K for the palette, ↑ ↓ to move, Enter to pick and Esc to close.
      </p>

      <HpxControlsPanel title="Command" {...panel} />
    </div>
  )
}
