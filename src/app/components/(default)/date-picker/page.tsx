"use client"

import * as React from "react"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxDatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"

// Each format is labelled with this date written in it, e.g. "28/09/2026" rather than "dd/MM/yyyy".
const SAMPLE_DATE = new Date(2026, 8, 28)
const DATE_FORMATS = [
  "PPP",
  "MMM d, yyyy",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
  "dd MMM yyyy",
  "EEEE, d MMM",
  "MMMM yyyy",
  "yyyy",
]

const controls = {
  showIcon: { group: "Trigger", type: "checkbox", label: "Icon", value: true },
  rollingLabel: { group: "Trigger", type: "checkbox", label: "Rolling label", value: true },
  dateFormat: {
    group: "Trigger",
    type: "select",
    label: "Format",
    value: "PPP",
    options: DATE_FORMATS.map((value) => ({ label: format(SAMPLE_DATE, value), value })),
  },

  fromBehind: { group: "Popup", type: "checkbox", label: "From behind trigger", value: true },
  contentAnimation: {
    group: "Popup",
    type: "select",
    label: "Content in",
    value: "scale",
    options: [
      { label: "Scale + fade", value: "scale" },
      { label: "Fade", value: "fade" },
    ],
  },
  contentScale: {
    disabled: (v) => v.contentAnimation === "fade",
    group: "Popup",
    type: "slider",
    label: "Start scale",
    value: 0.9,
    min: 0.5,
    max: 1,
    step: 0.05,
  },
  closeOnSelect: { group: "Popup", type: "checkbox", label: "Close on select", value: true },

  captionLayout: {
    group: "Month change",
    type: "select",
    label: "Header",
    value: "dropdown",
    options: [
      { label: "Month + year", value: "dropdown" },
      { label: "Month only", value: "dropdown-months" },
      { label: "Year only", value: "dropdown-years" },
      { label: "Label", value: "label" },
    ],
  },
  yearsBefore: {
    disabled: (v) => v.captionLayout === "label" || v.captionLayout === "dropdown-months",
    group: "Month change",
    type: "slider",
    label: "Years before",
    value: 10,
    min: 0,
    max: 100,
    step: 1,
  },
  yearsAfter: {
    disabled: (v) => v.captionLayout === "label" || v.captionLayout === "dropdown-months",
    group: "Month change",
    type: "slider",
    label: "Years after",
    value: 10,
    min: 0,
    max: 100,
    step: 1,
  },
  monthTransition: {
    group: "Month change",
    type: "select",
    label: "Transition",
    value: "slide",
    options: [
      { label: "Slide + fade", value: "slide" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  monthSlideDistance: {
    disabled: (v) => v.monthTransition !== "slide",
    group: "Month change",
    type: "slider",
    label: "Slide distance",
    value: 40,
    min: 5,
    max: 100,
    step: 5,
    unit: "%",
  },
  slidingArrows: { group: "Month change", type: "checkbox", label: "Sliding arrows", value: true },

  hoverVariant: {
    group: "Date hover",
    type: "select",
    label: "Variant",
    value: "filled",
    options: [
      { label: "Filled", value: "filled" },
      { label: "Outline", value: "outline" },
    ],
  },
  hoverTransition: {
    group: "Date hover",
    type: "select",
    label: "Transition",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fade", value: "fade" },
    ],
  },
  hoverDuration: {
    group: "Date hover",
    type: "slider",
    label: "Glide duration",
    value: 0.25,
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  hoverBounce: {
    disabled: (v) => v.hoverTransition === "fade",
    group: "Date hover",
    type: "slider",
    label: "Glide bounce",
    value: 0.15,
    min: 0,
    max: 0.6,
    step: 0.05,
  },

  weekStartsOn: {
    group: "Calendar",
    type: "select",
    label: "Week starts",
    value: "0",
    options: [
      { label: "Sunday", value: "0" },
      { label: "Monday", value: "1" },
    ],
  },
  onlyCurrentMonth: { group: "Calendar", type: "checkbox", label: "Only current month", value: true },
  fixedWeeks: { group: "Calendar", type: "checkbox", label: "Fixed 6 weeks", value: true },
  disablePast: { group: "Calendar", type: "checkbox", label: "Disable past dates", value: false },
  highlightToday: { group: "Calendar", type: "checkbox", label: "Highlight today", value: false },
} satisfies HpxControlSchema

type DatePickerProps = React.ComponentProps<typeof HpxDatePicker>

export default function DatePickerPage() {
  const [date, setDate] = React.useState<Date>()
  const panel = useHpxControls(controls)
  const { values } = panel

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-semibold">Date Picker</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A button that opens a calendar to pick a single date.
      </p>
      <div className="mt-6 flex min-h-48 items-center justify-center">
        <HpxDatePicker
          value={date}
          onChange={setDate}
          showIcon={values.showIcon}
          rollingLabel={values.rollingLabel}
          dateFormat={values.dateFormat}
          fromBehind={values.fromBehind}
          contentAnimation={values.contentAnimation as DatePickerProps["contentAnimation"]}
          contentScale={values.contentScale}
          closeOnSelect={values.closeOnSelect}
          captionLayout={values.captionLayout as DatePickerProps["captionLayout"]}
          yearsBefore={values.yearsBefore}
          yearsAfter={values.yearsAfter}
          monthTransition={values.monthTransition as DatePickerProps["monthTransition"]}
          monthSlideDistance={values.monthSlideDistance}
          slidingArrows={values.slidingArrows}
          hoverVariant={values.hoverVariant as DatePickerProps["hoverVariant"]}
          hoverTransition={values.hoverTransition as DatePickerProps["hoverTransition"]}
          hoverDuration={values.hoverDuration}
          hoverBounce={values.hoverBounce}
          weekStartsOn={Number(values.weekStartsOn) as DatePickerProps["weekStartsOn"]}
          onlyCurrentMonth={values.onlyCurrentMonth}
          fixedWeeks={values.fixedWeeks}
          disablePast={values.disablePast}
          highlightToday={values.highlightToday}
        />
      </div>

      <HpxControlsPanel title="Date Picker" {...panel} />
    </div>
  )
}
