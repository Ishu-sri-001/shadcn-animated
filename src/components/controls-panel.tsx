"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, RotateCcwIcon } from "lucide-react"
import { motion, useDragControls } from "motion/react"

import { HpxButton } from "@/components/ui/button"
import { HpxCheckbox } from "@/components/ui/checkbox"
import { HpxInput } from "@/components/ui/input"
import { HpxLabel } from "@/components/ui/label"
import {
  HpxSelect,
  HpxSelectContent,
  HpxSelectItem,
  HpxSelectTrigger,
  HpxSelectValue,
} from "@/components/ui/select"
import { HpxControlsSlider } from "@/components/controls-slider"

type ControlState = Record<string, string | number | boolean>

type BaseControl = {
  label: string
  group?: string
  // Greys the control out when it has no effect
  disabled?: (values: ControlState) => boolean
}

export type HpxCheckboxControl = BaseControl & { type: "checkbox"; value: boolean }

export type HpxSliderControl = BaseControl & {
  type: "slider"
  value: number
  min: number
  max: number
  step?: number
  unit?: string
}

export type HpxSelectControl = BaseControl & {
  type: "select"
  value: string
  options: { label: string; value: string }[]
}

export type HpxTextControl = BaseControl & { type: "text"; value: string; placeholder?: string }

export type HpxControl = HpxCheckboxControl | HpxSliderControl | HpxSelectControl | HpxTextControl

export type HpxControlSchema = Record<string, HpxControl>

export type HpxControlValues<S extends HpxControlSchema> = { [K in keyof S]: S[K]["value"] }

function defaultsOf<S extends HpxControlSchema>(schema: S) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, control]) => [key, control.value])
  ) as HpxControlValues<S>
}

export function useHpxControls<S extends HpxControlSchema>(schema: S) {
  const [values, setValues] = React.useState(() => defaultsOf(schema))

  const set = React.useCallback(
    <K extends keyof S>(key: K, value: S[K]["value"]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    []
  )
  const reset = React.useCallback(() => setValues(defaultsOf(schema)), [schema])

  return { schema, values, set, reset }
}

type ControlsPanelProps<S extends HpxControlSchema> = {
  schema: S
  values: HpxControlValues<S>
  set: <K extends keyof S>(key: K, value: S[K]["value"]) => void
  reset?: () => void
  title?: string
  className?: string
}

export function HpxControlsPanel<S extends HpxControlSchema>({
  schema,
  values,
  set,
  reset,
  title = "Controls",
  className,
}: ControlsPanelProps<S>) {
  const [open, setOpen] = React.useState(true)
  const entries = Object.entries(schema) as [keyof S & string, HpxControl][]
  const dragControls = useDragControls()
  const bounds = React.useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={bounds} aria-hidden className="pointer-events-none fixed inset-x-0 top-14 bottom-0" />
      <motion.aside
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={bounds}
        className={cn(
          "fixed top-[10vh] right-[1.5vw] z-40 flex max-h-[80vh] w-[20vw] flex-col overflow-hidden rounded-lg border bg-background/95 text-sm shadow-lg backdrop-blur max-[1025px]:hidden",
          className
        )}
      >
        <div
          onPointerDown={(event) => {
            if ((event.target as Element).closest("button")) return
            dragControls.start(event)
          }}
          className="flex cursor-grab touch-none items-center justify-between gap-2 border-b px-3 py-2 select-none active:cursor-grabbing"
        >
          <span className="font-medium">{title}</span>
          <div className="flex items-center gap-1">
            {reset && (
              <HpxButton variant="ghost" size="icon-xs" aria-label="Reset controls" onClick={reset}>
                <RotateCcwIcon />
              </HpxButton>
            )}
            <HpxButton
              variant="ghost"
              size="icon-xs"
              aria-label={open ? "Collapse controls" : "Expand controls"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <motion.span
                className="flex"
                initial={false}
                animate={{ rotate: open ? 0 : -90 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChevronDownIcon />
              </motion.span>
            </HpxButton>
          </div>
        </div>

        {open && (
          <div className="flex flex-col gap-3 overflow-y-auto px-3 py-3">
            {entries.map(([key, control], i) => {
              const showGroup = control.group && control.group !== entries[i - 1]?.[1].group
              return (
                <React.Fragment key={key}>
                  {showGroup && (
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase not-first:border-t not-first:py-2">
                      {control.group}
                    </span>
                  )}
                  <ControlRow
                    id={`control-${key}`}
                    control={control}
                    disabled={control.disabled?.(values) ?? false}
                    value={values[key]}
                    onChange={(v) => set(key, v as S[typeof key]["value"])}
                  />
                </React.Fragment>
              )
            })}
          </div>
        )}
      </motion.aside>
    </>
  )
}

function ControlRow({
  id,
  control,
  disabled,
  value,
  onChange,
}: {
  id: string
  control: HpxControl
  disabled: boolean
  value: HpxControl["value"]
  onChange: (value: HpxControl["value"]) => void
}) {
  const label = (
    <HpxLabel
      htmlFor={id}
      className={cn("text-muted-foreground transition-opacity", disabled && "opacity-40")}
    >
      {control.label}
    </HpxLabel>
  )

  if (control.type === "checkbox") {
    return (
      <div className="flex items-center justify-between gap-3">
        {label}
        <HpxCheckbox id={id} disabled={disabled} checked={value as boolean} onCheckedChange={(c) => onChange(c)} />
      </div>
    )
  }

  if (control.type === "text") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <HpxInput
          id={id}
          value={value as string}
          disabled={disabled}
          placeholder={control.placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  if (control.type === "slider") {
    const decimals = String(control.step ?? 1).split(".")[1]?.length ?? 0
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {label}
          <span className={cn("font-mono text-xs tabular-nums transition-opacity", disabled && "opacity-40")}>
            {(value as number).toFixed(decimals)}
            {control.unit}
          </span>
        </div>
        <HpxControlsSlider
          id={id}
          disabled={disabled}
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={[value as number]}
          onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {label}
      <HpxSelect
        items={control.options}
        value={value as string}
        disabled={disabled}
        onValueChange={(v) => v !== null && onChange(v)}
      >
        <HpxSelectTrigger id={id} size="sm" className="w-[55%]">
          <HpxSelectValue />
        </HpxSelectTrigger>
        <HpxSelectContent className="w-auto min-w-(--anchor-width)">
          {control.options.map((option) => (
            <HpxSelectItem key={option.value} value={option.value}>
              {option.label}
            </HpxSelectItem>
          ))}
        </HpxSelectContent>
      </HpxSelect>
    </div>
  )
}
