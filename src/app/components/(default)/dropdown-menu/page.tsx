"use client"

import * as React from "react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItemDescription,
  DropdownMenuItemTitle,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerIcon,
  DropdownMenuValue,
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
  highlight: {
    group: "Options",
    type: "select",
    label: "Hover highlight",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fill from top", value: "fill" },
      { label: "None", value: "none" },
    ],
  },
  indicator: {
    group: "Options",
    type: "select",
    label: "Indicator",
    value: "check",
    options: [
      { label: "Check", value: "check" },
      { label: "Dot", value: "dot" },
      { label: "Bar", value: "bar" },
    ],
  },
  descriptions: { group: "Options", type: "checkbox", label: "Item descriptions", value: false },
  bold: { group: "Options", type: "checkbox", label: "Bold", value: false },
  textRoll: { group: "Options", type: "checkbox", label: "Text roll on hover", value: false },
  icon: {
    group: "Trigger",
    type: "select",
    label: "Icon",
    value: "plus",
    options: [
      { label: "Plus / minus", value: "plus" },
      { label: "Chevrons", value: "chevrons" },
      { label: "Chevron", value: "chevron" },
    ],
  },
  animateValue: { group: "Trigger", type: "checkbox", label: "Animate value", value: true },
  pressFeedback: { group: "Trigger", type: "checkbox", label: "Press feedback", value: false },
  openOnHover: { group: "Trigger", type: "checkbox", label: "Open on hover", value: false },
  delayCloseOnSelect: {
    group: "Behaviour",
    type: "checkbox",
    label: "Delay on close after choosing",
    value: false,
  },
  typeahead: { group: "Behaviour", type: "checkbox", label: "Type to jump", value: false },
} satisfies ControlSchema

export default function DropdownMenuPage() {
  const panel = useControls(controls)
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
        <DropdownMenu
          animation={values.animation as "collapse" | "slide" | "scale" | "reveal" | "morph"}
          exitFast={values.exitFast}
          duration={values.duration}
          delay={values.delay}
          stagger={values.stagger}
          highlight={values.highlight as "slide" | "fill" | "none"}
          indicator={values.indicator as "check" | "dot" | "bar"}
          descriptions={values.descriptions}
          bold={values.bold}
          textRoll={values.textRoll}
          delayCloseOnSelect={values.delayCloseOnSelect}
          pressFeedback={values.pressFeedback}
          typeahead={values.typeahead}
        >
          <DropdownMenuTrigger
            openOnHover={values.openOnHover}
            delay={100}
            animateValue={values.animateValue}
            render={
              <Button
                variant="outline"
                className="h-auto w-[60%] cursor-pointer justify-between gap-4 px-4 py-3 hover:bg-background aria-expanded:bg-background max-md:w-full dark:hover:bg-input/30 dark:aria-expanded:bg-input/30"
              />
            }
          >
            <span className="flex flex-col items-start gap-0.5 text-left">
              <span className="text-sm font-normal text-muted-foreground">
                Your coffee arrives
              </span>
              <DropdownMenuValue className="text-base">
                {selected.label}
              </DropdownMenuValue>
            </span>
            <DropdownMenuTriggerIcon
              icon={values.icon as "chevrons" | "chevron" | "plus"}
              className="text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup aria-label="Delivery frequency" value={frequency} onValueChange={setFrequency}>
                {options.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    className="py-2"
                  >
                    <span className="flex flex-col gap-0.5">
                      <DropdownMenuItemTitle>{option.label}</DropdownMenuItemTitle>
                      <DropdownMenuItemDescription>
                        {option.description}
                      </DropdownMenuItemDescription>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ControlsPanel title="Dropdown Menu" {...panel} />
    </div>
  )
}
