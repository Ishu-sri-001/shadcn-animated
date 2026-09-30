"use client"

import * as React from "react"
import {
  CherryIcon,
  CitrusIcon,
  CopyIcon,
  FileIcon,
  FilePlusIcon,
  FileTextIcon,
  FlameIcon,
  FolderOpenIcon,
  HeartIcon,
  LeafIcon,
  MoonIcon,
  MountainIcon,
  PencilIcon,
  PrinterIcon,
  RedoIcon,
  ShareIcon,
  SparklesIcon,
  TableIcon,
  Trash2Icon,
  UndoIcon,
} from "lucide-react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxMenubar,
  HpxMenubarCheckboxItem,
  HpxMenubarColumns,
  HpxMenubarContent,
  HpxMenubarGroup,
  HpxMenubarItem,
  HpxMenubarLabel,
  HpxMenubarMenu,
  HpxMenubarRadioGroup,
  HpxMenubarRadioItem,
  HpxMenubarSeparator,
  HpxMenubarShortcut,
  HpxMenubarSub,
  HpxMenubarSubContent,
  HpxMenubarSubTrigger,
  HpxMenubarTrigger,
  type HpxMenubarAnimation,
  type HpxMenubarContentShift,
  type HpxMenubarContentSwitch,
  type HpxMenubarRounded,
  type HpxMenubarSize,
  type HpxMenubarSwitch,
  type HpxMenubarTriggerHighlight,
} from "@/components/ui/menubar"
import type {
  HpxDropdownMenuHighlight,
  HpxDropdownMenuHighlightColor,
  HpxDropdownMenuIndicator,
} from "@/components/ui/dropdown-menu"

const controls = {
  animation: {
    group: "Panel",
    type: "select",
    label: "Opening",
    value: "collapse",
    options: [
      { label: "Scale", value: "scale" },
      { label: "Slide", value: "slide" },
      { label: "Collapse", value: "collapse" },
      { label: "Reveal", value: "reveal" },
    ],
  },
  exitFast: { group: "Panel", type: "checkbox", label: "Exit fast", value: false },

  switchAnimation: {
    group: "Between menus",
    type: "select",
    label: "Moving over",
    value: "glide",
    options: [
      { label: "Glide", value: "glide" },
      { label: "Replay", value: "replay" },
    ],
  },
  contentAnimation: {
    disabled: (v) => v.switchAnimation !== "glide",
    group: "Between menus",
    type: "select",
    label: "Content animation",
    value: "slide",
    options: [
      { label: "Slides in", value: "slide" },
      { label: "Fades in", value: "fade" },
      { label: "At once", value: "none" },
    ],
  },
  slideDistance: {
    disabled: (v) => v.switchAnimation !== "glide" || v.contentAnimation !== "slide",
    group: "Between menus",
    type: "select",
    label: "Slide distance",
    value: "lg",
    options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
  },

  duration: {
    group: "Timing",
    type: "slider",
    label: "Duration",
    value: 0.3,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  delay: {
    group: "Timing",
    type: "slider",
    label: "Delay",
    value: 0.05,
    min: 0,
    max: 0.5,
    step: 0.01,
    unit: "s",
  },
  stagger: {
    group: "Timing",
    
    type: "slider",
    label: "Stagger",
    value: 0.03,
    min: 0,
    max: 0.2,
    step: 0.01,
    unit: "s",
  },

  triggerHighlight: {
    group: "Bar",
    type: "select",
    label: "Menu highlight",
    value: "pill",
    options: [
      { label: "Gliding pill", value: "pill" },
      { label: "Gliding underline", value: "underline" },
      { label: "None", value: "none" },
    ],
  },
  triggerHighlightColor: {
    disabled: (v) => v.triggerHighlight === "none",
    group: "Bar",
    type: "select",
    label: "Highlight fill",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
    ],
  },
  showChevrons: { group: "Bar", type: "checkbox", label: "Chevrons", value: true },
  triggerRollingText: { group: "Bar", type: "checkbox", label: "Rolling trigger text", value: true },
  openOnClick: { group: "Bar", type: "checkbox", label: "Open on click", value: false },
  pressFeedback: { group: "Bar", type: "checkbox", label: "Press feedback", value: true },

  itemHighlight: {
    group: "Items",
    type: "select",
    label: "Item highlight",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fill from top", value: "fill" },
      { label: "None", value: "none" },
    ],
  },
  itemHighlightColor: {
    disabled: (v) => v.itemHighlight === "none",
    group: "Items",
    type: "select",
    label: "Item highlight color",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
    ],
  },
  selectionIndicator: {
    group: "Items",
    type: "select",
    label: "Selection indicator",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Dot", value: "dot" },
      { label: "Bar", value: "bar" },
    ],
  },
  showIcons: { group: "Items", type: "checkbox", label: "Icons", value: true },
  showDescriptions: { group: "Items", type: "checkbox", label: "Descriptions", value: true },
  rollingText: { group: "Items", type: "checkbox", label: "Rolling text", value: false },

  size: {
    group: "Style",
    type: "select",
    label: "Size",
    value: "lg",
    options: [
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
    ],
  },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
    ],
  },
} satisfies HpxControlSchema

export function HpxMenubarDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [showRatio, setShowRatio] = React.useState(true)
  const [showTimer, setShowTimer] = React.useState(true)
  const [showNotes, setShowNotes] = React.useState(false)
  const [roast, setRoast] = React.useState("medium")
  const [method, setMethod] = React.useState("pour-over")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col items-center gap-[3vw] py-[4vw] max-md:gap-[6vw]">
        <HpxMenubar
          animation={values.animation as HpxMenubarAnimation}
          switchAnimation={values.switchAnimation as HpxMenubarSwitch}
          exitFast={values.exitFast}
          duration={values.duration}
          delay={values.delay}
          stagger={values.stagger}
          triggerHighlight={values.triggerHighlight as HpxMenubarTriggerHighlight}
          pressFeedback={values.pressFeedback}
          openOnClick={values.openOnClick}
          itemHighlight={values.itemHighlight as HpxDropdownMenuHighlight}
          itemHighlightColor={values.itemHighlightColor as HpxDropdownMenuHighlightColor}
          triggerHighlightColor={values.triggerHighlightColor as HpxDropdownMenuHighlightColor}
          selectionIndicator={values.selectionIndicator as HpxDropdownMenuIndicator}
          rollingText={values.rollingText}
          triggerRollingText={values.triggerRollingText}
          contentAnimation={values.contentAnimation as HpxMenubarContentSwitch}
          slideDistance={values.slideDistance as HpxMenubarContentShift}
          showChevrons={values.showChevrons}
          showIcons={values.showIcons}
          showDescriptions={values.showDescriptions}
          size={values.size as HpxMenubarSize}
          rounded={values.rounded as HpxMenubarRounded}
        >
          <HpxMenubarMenu>
            <HpxMenubarTrigger>File</HpxMenubarTrigger>
            <HpxMenubarContent>
              <HpxMenubarGroup>
                <HpxMenubarLabel>Start</HpxMenubarLabel>
                <HpxMenubarItem
                  icon={<FilePlusIcon />}
                  description="A blank recipe, ready to dial in."
                >
                  New brew <HpxMenubarShortcut>⌘N</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarItem
                  icon={<CopyIcon />}
                  description="Copy this recipe and tweak it."
                >
                  Duplicate <HpxMenubarShortcut>⌘D</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarItem
                  icon={<FolderOpenIcon />}
                  description="Browse everything you've saved."
                >
                  Open recent <HpxMenubarShortcut>⌘O</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarSub>
                  <HpxMenubarSubTrigger>Export</HpxMenubarSubTrigger>
                  <HpxMenubarSubContent>
                    <HpxMenubarItem icon={<FileTextIcon />}>As a recipe card</HpxMenubarItem>
                    <HpxMenubarItem icon={<TableIcon />}>As a spreadsheet</HpxMenubarItem>
                    <HpxMenubarItem icon={<FileIcon />}>As plain text</HpxMenubarItem>
                  </HpxMenubarSubContent>
                </HpxMenubarSub>
              </HpxMenubarGroup>
              <HpxMenubarSeparator />
              <HpxMenubarGroup>
                <HpxMenubarItem
                  icon={<ShareIcon />}
                  description="Send a link your friends can brew from."
                >
                  Share <HpxMenubarShortcut>⇧⌘S</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarItem icon={<PrinterIcon />} description="One page, kitchen friendly.">
                  Print <HpxMenubarShortcut>⌘P</HpxMenubarShortcut>
                </HpxMenubarItem>
              </HpxMenubarGroup>
            </HpxMenubarContent>
          </HpxMenubarMenu>

          <HpxMenubarMenu>
            <HpxMenubarTrigger>Edit</HpxMenubarTrigger>
            <HpxMenubarContent>
              <HpxMenubarGroup>
                <HpxMenubarItem icon={<UndoIcon />} description="Step back one change.">
                  Undo <HpxMenubarShortcut>⌘Z</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarItem icon={<RedoIcon />} description="Put that change back.">
                  Redo <HpxMenubarShortcut>⇧⌘Z</HpxMenubarShortcut>
                </HpxMenubarItem>
                <HpxMenubarItem icon={<PencilIcon />} description="Give this brew a better name.">
                  Rename brew
                </HpxMenubarItem>
                <HpxMenubarItem
                  icon={<Trash2Icon />}
                  variant="destructive"
                  description="This can't be undone."
                >
                  Delete brew
                </HpxMenubarItem>
              </HpxMenubarGroup>
            </HpxMenubarContent>
          </HpxMenubarMenu>

          <HpxMenubarMenu>
            <HpxMenubarTrigger>View</HpxMenubarTrigger>
            <HpxMenubarContent>
              <HpxMenubarCheckboxItem checked={showRatio} onCheckedChange={setShowRatio}>
                Brew ratio
              </HpxMenubarCheckboxItem>
              <HpxMenubarCheckboxItem checked={showTimer} onCheckedChange={setShowTimer}>
                Timer
              </HpxMenubarCheckboxItem>
              <HpxMenubarCheckboxItem checked={showNotes} onCheckedChange={setShowNotes}>
                Tasting notes
              </HpxMenubarCheckboxItem>
            </HpxMenubarContent>
          </HpxMenubarMenu>

          <HpxMenubarMenu>
            <HpxMenubarTrigger>Roast</HpxMenubarTrigger>
            <HpxMenubarContent>
              <HpxMenubarGroup>
                <HpxMenubarLabel>Roast level</HpxMenubarLabel>
                <HpxMenubarRadioGroup value={roast} onValueChange={setRoast}>
                  <HpxMenubarRadioItem value="light">Light</HpxMenubarRadioItem>
                  <HpxMenubarRadioItem value="medium">Medium</HpxMenubarRadioItem>
                  <HpxMenubarRadioItem value="dark">Dark</HpxMenubarRadioItem>
                </HpxMenubarRadioGroup>
              </HpxMenubarGroup>
              <HpxMenubarSeparator />
              <HpxMenubarGroup>
                <HpxMenubarLabel>Method</HpxMenubarLabel>
                <HpxMenubarRadioGroup value={method} onValueChange={setMethod}>
                  <HpxMenubarRadioItem value="pour-over">Pour-over</HpxMenubarRadioItem>
                  <HpxMenubarRadioItem value="espresso">Espresso</HpxMenubarRadioItem>
                  <HpxMenubarRadioItem value="french-press">French press</HpxMenubarRadioItem>
                </HpxMenubarRadioGroup>
              </HpxMenubarGroup>
            </HpxMenubarContent>
          </HpxMenubarMenu>

          <HpxMenubarMenu>
            <HpxMenubarTrigger>Beans</HpxMenubarTrigger>
            <HpxMenubarContent>
              {/* Two columns side by side, with a gap between them. */}
              <HpxMenubarColumns>
                <HpxMenubarGroup>
                  <HpxMenubarLabel>Single origin</HpxMenubarLabel>
                  <HpxMenubarItem icon={<CitrusIcon />} description="Jasmine, peach, black tea.">
                    Ethiopia Guji
                  </HpxMenubarItem>
                  <HpxMenubarItem icon={<CherryIcon />} description="Red apple, caramel, cocoa.">
                    Colombia Huila
                  </HpxMenubarItem>
                  <HpxMenubarItem icon={<MountainIcon />} description="Blackcurrant and bright acidity.">
                    Kenya Nyeri
                  </HpxMenubarItem>
                </HpxMenubarGroup>
                <HpxMenubarGroup>
                  <HpxMenubarLabel>Blends & more</HpxMenubarLabel>
                  <HpxMenubarItem icon={<FlameIcon />} description="Dark chocolate, built for milk.">
                    House espresso
                  </HpxMenubarItem>
                  <HpxMenubarItem icon={<MoonIcon />} description="All the flavour, none of the buzz.">
                    Swiss water decaf
                  </HpxMenubarItem>
                  <HpxMenubarItem icon={<SparklesIcon />} description="A new lot, only this month.">
                    Roaster&apos;s pick
                  </HpxMenubarItem>
                </HpxMenubarGroup>
              </HpxMenubarColumns>
              <HpxMenubarSeparator />
              <HpxMenubarGroup>
                <HpxMenubarItem icon={<HeartIcon />} description="Everything you've starred.">
                  Favourites
                </HpxMenubarItem>
                <HpxMenubarItem icon={<LeafIcon />} description="Organic and direct-trade lots.">
                  Browse all beans
                </HpxMenubarItem>
              </HpxMenubarGroup>
            </HpxMenubarContent>
          </HpxMenubarMenu>
        </HpxMenubar>

        <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
          <span>
            {roast[0].toUpperCase() + roast.slice(1)} roast · {method.replace("-", " ")}
          </span>
          <span>
            {[showRatio && "1:16 ratio", showTimer && "3:00 timer", showNotes && "tasting notes"]
              .filter(Boolean)
              .join(" · ") || "Nothing shown"}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: open a menu, then slide the pointer along the bar or press the arrow keys.
      </p>

      <HpxControlsPanel title="Menubar" {...panel} />
    </div>
  )
}
