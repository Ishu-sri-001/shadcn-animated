"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon, RotateCcwIcon } from "lucide-react"
import { motion, useDragControls } from "motion/react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

type BaseControl = {
  label: string
  group?: string
}

export type CheckboxControl = BaseControl & { type: "checkbox"; value: boolean }

export type SliderControl = BaseControl & {
  type: "slider"
  value: number
  min: number
  max: number
  step?: number
  unit?: string
}

export type SelectControl = BaseControl & {
  type: "select"
  value: string
  options: { label: string; value: string }[]
}

export type Control = CheckboxControl | SliderControl | SelectControl

export type ControlSchema = Record<string, Control>

export type ControlValues<S extends ControlSchema> = { [K in keyof S]: S[K]["value"] }

function defaultsOf<S extends ControlSchema>(schema: S) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, control]) => [key, control.value])
  ) as ControlValues<S>
}

export function useControls<S extends ControlSchema>(schema: S) {
  const [values, setValues] = React.useState(() => defaultsOf(schema))

  const set = React.useCallback(
    <K extends keyof S>(key: K, value: S[K]["value"]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    []
  )
  const reset = React.useCallback(() => setValues(defaultsOf(schema)), [schema])

  return { schema, values, set, reset }
}

type ControlsPanelProps<S extends ControlSchema> = {
  schema: S
  values: ControlValues<S>
  set: <K extends keyof S>(key: K, value: S[K]["value"]) => void
  reset?: () => void
  title?: string
  className?: string
}

export function ControlsPanel<S extends ControlSchema>({
  schema,
  values,
  set,
  reset,
  title = "Controls",
  className,
}: ControlsPanelProps<S>) {
  const [open, setOpen] = React.useState(true)
  const entries = Object.entries(schema) as [keyof S & string, Control][]
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
              <Button variant="ghost" size="icon-xs" aria-label="Reset controls" onClick={reset}>
                <RotateCcwIcon />
              </Button>
            )}
            <Button
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
            </Button>
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
  value,
  onChange,
}: {
  id: string
  control: Control
  value: Control["value"]
  onChange: (value: Control["value"]) => void
}) {
  const label = (
    <Label htmlFor={id} className="text-muted-foreground">
      {control.label}
    </Label>
  )

  if (control.type === "checkbox") {
    return (
      <div className="flex items-center justify-between gap-3">
        {label}
        <Checkbox id={id} checked={value as boolean} onCheckedChange={(c) => onChange(c)} />
      </div>
    )
  }

  if (control.type === "slider") {
    const decimals = String(control.step ?? 1).split(".")[1]?.length ?? 0
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {label}
          <span className="font-mono text-xs tabular-nums">
            {(value as number).toFixed(decimals)}
            {control.unit}
          </span>
        </div>
        <Slider
          id={id}
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
      <Select
        items={control.options}
        value={value as string}
        onValueChange={(v) => v !== null && onChange(v)}
      >
        <SelectTrigger id={id} size="sm" className="w-[55%]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {control.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
