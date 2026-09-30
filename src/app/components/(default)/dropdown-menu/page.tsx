"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import {
  HpxDropdownMenu,
  HpxDropdownMenuContent,
  HpxDropdownMenuGroup,
  HpxDropdownMenuItemDescription,
  HpxDropdownMenuItemTitle,
  HpxDropdownMenuRadioGroup,
  HpxDropdownMenuRadioItem,
  HpxDropdownMenuTrigger,
  HpxDropdownMenuTriggerIcon,
  HpxDropdownMenuValue,
} from "@/components/ui/dropdown-menu"

const options = [
  {
    value: "weekly",
    label: "Every week",
    description: "For daily brewers who get through a bag fast.",
  },
  {
    value: "fortnightly",
    label: "Every two weeks",
    description: "Our most popular pace, and the default.",
  },
  {
    value: "monthly",
    label: "Every month",
    description: "A fresh bag now and then, no rush.",
  },
  {
    value: "paused",
    label: "Paused",
    description: "Take a break for up to three months.",
  },
]

const controls = {
  animation: {
    group: "Panel",
    type: "select",
    label: "Animation",
    value: "collapse",
    options: [
      { label: "Collapse", value: "collapse" },
      { label: "Slide", value: "slide" },
      { label: "Scale", value: "scale" },
      { label: "Reveal", value: "reveal" },
      { label: "Morph", value: "morph" },
    ],
  },
  exitFast: { group: "Panel", type: "checkbox", label: "Exit fast", value: false },
  duration: {
    group: "Timing",
    type: "slider",
    label: "Duration",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  delay: {
    group: "Timing",
    type: "slider",
    label: "Delay",
    value: 0.1,
    min: 0,
    max: 0.5,
    step: 0.01,
    unit: "s",
  },
  stagger: {
    group: "Timing",
    type: "slider",
    label: "Stagger",
    value: 0.05,
    min: 0,
    max: 0.2,
    step: 0.01,
    unit: "s",
  },
  itemHighlight: {
    group: "Options",
    type: "select",
    label: "Item highlight",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fill from top", value: "fill" },
      { label: "None", value: "none" },
    ],
  },
  selectionIndicator: {
    group: "Options",
    type: "select",
    label: "Selection indicator",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Dot", value: "dot" },
      { label: "Bar", value: "bar" },
    ],
  },
  showDescriptions: { group: "Options", type: "checkbox", label: "Descriptions", value: false },
  bold: { group: "Options", type: "checkbox", label: "Bold", value: false },
  rollingText: { group: "Options", type: "checkbox", label: "Rolling text", value: false },
  icon: {
    group: "Trigger",
    type: "select",
    label: "Icon",
    value: "plus",
    options: [
      { label: "Plus / minus", value: "plus" },
      { label: "Chevron", value: "chevron" },
    ],
  },
  rollingValue: { group: "Trigger", type: "checkbox", label: "Rolling value", value: true },
  pressFeedback: { group: "Trigger", type: "checkbox", label: "Press feedback", value: false },
  openOnHover: { group: "Trigger", type: "checkbox", label: "Open on hover", value: false },
  closeDelayOnSelect: {
    group: "Behaviour",
    type: "checkbox",
    label: "Close delay on select",
    value: false,
  },
  typeahead: { group: "Behaviour", type: "checkbox", label: "Type to jump", value: false },
} satisfies HpxControlSchema

export default function DropdownMenuPage() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [frequency, setFrequency] = React.useState("fortnightly")
  const selected = options.find((option) => option.value === frequency) ?? options[1]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dropdown Menu</h1>
        <p className="text-sm text-muted-foreground">
          A menu of actions or options that opens from a button.
        </p>
      </div>

      <div className="flex min-h-[50vh] items-start justify-center">
        <HpxDropdownMenu
          animation={values.animation as "collapse" | "slide" | "scale" | "reveal" | "morph"}
          exitFast={values.exitFast}
          duration={values.duration}
          delay={values.delay}
          stagger={values.stagger}
          itemHighlight={values.itemHighlight as "slide" | "fill" | "none"}
          selectionIndicator={values.selectionIndicator as "check" | "dot" | "bar"}
          showDescriptions={values.showDescriptions}
          bold={values.bold}
          rollingText={values.rollingText}
          closeDelayOnSelect={values.closeDelayOnSelect}
          pressFeedback={values.pressFeedback}
          typeahead={values.typeahead}
        >
          <HpxDropdownMenuTrigger
            openOnHover={values.openOnHover}
            delay={100}
            rollingValue={values.rollingValue}
            render={
              <HpxButton
                variant="outline"
                className="h-auto w-[60%] cursor-pointer justify-between gap-4 px-4 py-3 hover:bg-background aria-expanded:bg-background max-md:w-full dark:hover:bg-input/30 dark:aria-expanded:bg-input/30"
              />
            }
          >
            <span className="flex flex-col items-start gap-0.5 text-left">
              <span className="text-sm font-normal text-muted-foreground">
                Your coffee arrives
              </span>
              <HpxDropdownMenuValue className="text-base">
                {selected.label}
              </HpxDropdownMenuValue>
            </span>
            <HpxDropdownMenuTriggerIcon
              icon={values.icon as "chevron" | "plus"}
              className="text-muted-foreground"
            />
          </HpxDropdownMenuTrigger>
          <HpxDropdownMenuContent className="p-1.5">
            <HpxDropdownMenuGroup>
              <HpxDropdownMenuRadioGroup aria-label="Delivery frequency" value={frequency} onValueChange={setFrequency}>
                {options.map((option) => (
                  <HpxDropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    className="py-2"
                  >
                    <span className="flex flex-col gap-0.5">
                      <HpxDropdownMenuItemTitle>{option.label}</HpxDropdownMenuItemTitle>
                      <HpxDropdownMenuItemDescription>
                        {option.description}
                      </HpxDropdownMenuItemDescription>
                    </span>
                  </HpxDropdownMenuRadioItem>
                ))}
              </HpxDropdownMenuRadioGroup>
            </HpxDropdownMenuGroup>
          </HpxDropdownMenuContent>
        </HpxDropdownMenu>
      </div>

      <HpxControlsPanel title="Dropdown Menu" {...panel} />
    </div>
  )
}
