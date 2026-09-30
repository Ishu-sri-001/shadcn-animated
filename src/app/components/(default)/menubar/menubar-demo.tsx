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

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarColumns,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  type MenubarAnimation,
  type MenubarContentShift,
  type MenubarContentSwitch,
  type MenubarRounded,
  type MenubarSize,
  type MenubarSwitch,
  type MenubarTriggerHighlight,
} from "@/components/ui/menubar"
import type {
  DropdownMenuHighlight,
  DropdownMenuHighlightColor,
  DropdownMenuIndicator,
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
  contentSwitch: {
    disabled: (v) => v.switchAnimation !== "glide",
    group: "Between menus",
    type: "select",
    label: "Content comes in",
    value: "slide",
    options: [
      { label: "Slides in", value: "slide" },
      { label: "Fades in", value: "fade" },
      { label: "At once", value: "none" },
    ],
  },
  contentShift: {
    disabled: (v) => v.switchAnimation !== "glide" || v.contentSwitch !== "slide",
    group: "Between menus",
    type: "select",
    label: "Content shift",
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
  chevrons: { group: "Bar", type: "checkbox", label: "Chevrons", value: true },
  triggerTextRoll: { group: "Bar", type: "checkbox", label: "Text roll on hover", value: true },
  openOnClick: { group: "Bar", type: "checkbox", label: "Open on click", value: false },
  pressFeedback: { group: "Bar", type: "checkbox", label: "Press feedback", value: true },

  itemHighlight: {
    group: "Items",
    type: "select",
    label: "Hover highlight",
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
    label: "Hover fill",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
    ],
  },
  indicator: {
    group: "Items",
    type: "select",
    label: "Radio indicator",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Dot", value: "dot" },
      { label: "Bar", value: "bar" },
    ],
  },
  icons: { group: "Items", type: "checkbox", label: "Icons", value: true },
  descriptions: { group: "Items", type: "checkbox", label: "Descriptions", value: true },
  textRoll: { group: "Items", type: "checkbox", label: "Text roll on hover", value: false },

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
} satisfies ControlSchema

export function MenubarDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const [showRatio, setShowRatio] = React.useState(true)
  const [showTimer, setShowTimer] = React.useState(true)
  const [showNotes, setShowNotes] = React.useState(false)
  const [roast, setRoast] = React.useState("medium")
  const [method, setMethod] = React.useState("pour-over")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col items-center gap-[3vw] py-[4vw] max-md:gap-[6vw]">
        <Menubar
          animation={values.animation as MenubarAnimation}
          switchAnimation={values.switchAnimation as MenubarSwitch}
          exitFast={values.exitFast}
          duration={values.duration}
          delay={values.delay}
          stagger={values.stagger}
          triggerHighlight={values.triggerHighlight as MenubarTriggerHighlight}
          pressFeedback={values.pressFeedback}
          openOnClick={values.openOnClick}
          itemHighlight={values.itemHighlight as DropdownMenuHighlight}
          itemHighlightColor={values.itemHighlightColor as DropdownMenuHighlightColor}
          triggerHighlightColor={values.triggerHighlightColor as DropdownMenuHighlightColor}
          indicator={values.indicator as DropdownMenuIndicator}
          textRoll={values.textRoll}
          triggerTextRoll={values.triggerTextRoll}
          contentSwitch={values.contentSwitch as MenubarContentSwitch}
          contentShift={values.contentShift as MenubarContentShift}
          chevrons={values.chevrons}
          icons={values.icons}
          descriptions={values.descriptions}
          size={values.size as MenubarSize}
          rounded={values.rounded as MenubarRounded}
        >
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Start</MenubarLabel>
                <MenubarItem
                  icon={<FilePlusIcon />}
                  description="A blank recipe, ready to dial in."
                >
                  New brew <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  icon={<CopyIcon />}
                  description="Copy this recipe and tweak it."
                >
                  Duplicate <MenubarShortcut>⌘D</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  icon={<FolderOpenIcon />}
                  description="Browse everything you've saved."
                >
                  Open recent <MenubarShortcut>⌘O</MenubarShortcut>
                </MenubarItem>
                <MenubarSub>
                  <MenubarSubTrigger>Export</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem icon={<FileTextIcon />}>As a recipe card</MenubarItem>
                    <MenubarItem icon={<TableIcon />}>As a spreadsheet</MenubarItem>
                    <MenubarItem icon={<FileIcon />}>As plain text</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem
                  icon={<ShareIcon />}
                  description="Send a link your friends can brew from."
                >
                  Share <MenubarShortcut>⇧⌘S</MenubarShortcut>
                </MenubarItem>
                <MenubarItem icon={<PrinterIcon />} description="One page, kitchen friendly.">
                  Print <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem icon={<UndoIcon />} description="Step back one change.">
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem icon={<RedoIcon />} description="Put that change back.">
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem icon={<PencilIcon />} description="Give this brew a better name.">
                  Rename brew
                </MenubarItem>
                <MenubarItem
                  icon={<Trash2Icon />}
                  variant="destructive"
                  description="This can't be undone."
                >
                  Delete brew
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={showRatio} onCheckedChange={setShowRatio}>
                Brew ratio
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={showTimer} onCheckedChange={setShowTimer}>
                Timer
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={showNotes} onCheckedChange={setShowNotes}>
                Tasting notes
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Roast</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Roast level</MenubarLabel>
                <MenubarRadioGroup value={roast} onValueChange={setRoast}>
                  <MenubarRadioItem value="light">Light</MenubarRadioItem>
                  <MenubarRadioItem value="medium">Medium</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarLabel>Method</MenubarLabel>
                <MenubarRadioGroup value={method} onValueChange={setMethod}>
                  <MenubarRadioItem value="pour-over">Pour-over</MenubarRadioItem>
                  <MenubarRadioItem value="espresso">Espresso</MenubarRadioItem>
                  <MenubarRadioItem value="french-press">French press</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Beans</MenubarTrigger>
            <MenubarContent>
              {/* Two columns side by side, with a gap between them. */}
              <MenubarColumns>
                <MenubarGroup>
                  <MenubarLabel>Single origin</MenubarLabel>
                  <MenubarItem icon={<CitrusIcon />} description="Jasmine, peach, black tea.">
                    Ethiopia Guji
                  </MenubarItem>
                  <MenubarItem icon={<CherryIcon />} description="Red apple, caramel, cocoa.">
                    Colombia Huila
                  </MenubarItem>
                  <MenubarItem icon={<MountainIcon />} description="Blackcurrant and bright acidity.">
                    Kenya Nyeri
                  </MenubarItem>
                </MenubarGroup>
                <MenubarGroup>
                  <MenubarLabel>Blends & more</MenubarLabel>
                  <MenubarItem icon={<FlameIcon />} description="Dark chocolate, built for milk.">
                    House espresso
                  </MenubarItem>
                  <MenubarItem icon={<MoonIcon />} description="All the flavour, none of the buzz.">
                    Swiss water decaf
                  </MenubarItem>
                  <MenubarItem icon={<SparklesIcon />} description="A new lot, only this month.">
                    Roaster&apos;s pick
                  </MenubarItem>
                </MenubarGroup>
              </MenubarColumns>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem icon={<HeartIcon />} description="Everything you've starred.">
                  Favourites
                </MenubarItem>
                <MenubarItem icon={<LeafIcon />} description="Organic and direct-trade lots.">
                  Browse all beans
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

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

      <ControlsPanel title="Menubar" {...panel} />
    </div>
  )
}
