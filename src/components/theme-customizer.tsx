"use client"

import * as React from "react"

import {
  HPX_CUSTOM_TOKENS,
  HPX_HEX_PATTERN,
  type HpxCustomColors,
  type HpxCustomToken,
} from "@/components/theme-colors"
import { useHpxPalette } from "@/components/theme-provider"
import { HpxInput } from "@/components/ui/input"
import { HpxLabel } from "@/components/ui/label"
import {
  HpxDialog,
  HpxDialogButton,
  HpxDialogContent,
  HpxDialogDescription,
  HpxDialogFooter,
  HpxDialogHeader,
  HpxDialogTitle,
} from "@/components/ui/dialog"

const MODES = ["light", "dark"] as const

type Mode = (typeof MODES)[number]

function normalize(value: string) {
  const hex = value.trim().replace(/^#?/, "#")
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex)
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : hex
}

// Reads what the theme currently paints, so empty fields show real colors
function computedHex(token: HpxCustomToken) {
  const probe = document.createElement("span")
  probe.style.color = `var(--${token})`
  probe.style.display = "none"
  document.documentElement.appendChild(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return "#000000"
  ctx.fillStyle = rgb
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
}

function ColorField({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder: string
  onCommit: (hex: string) => void
}) {
  const [text, setText] = React.useState(value)
  const valid = HPX_HEX_PATTERN.test(normalize(text))

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={`${label} picker`}
        value={HPX_HEX_PATTERN.test(value) ? value : placeholder}
        onChange={(e) => onCommit(e.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
      />
      <HpxInput
        aria-label={label}
        aria-invalid={text !== "" && !valid}
        spellCheck={false}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const hex = normalize(e.target.value)
          if (HPX_HEX_PATTERN.test(hex)) onCommit(hex.toLowerCase())
        }}
        className="font-mono uppercase"
      />
    </div>
  )
}

function CustomizerBody({ onDone }: { onDone: () => void }) {
  const { palette, customThemes, addCustomTheme } = useHpxPalette()
  const [name, setName] = React.useState("")
  const [colors, setColors] = React.useState<HpxCustomColors>({ light: {}, dark: {} })
  const [placeholders] = React.useState(() => {
    return Object.fromEntries(
      HPX_CUSTOM_TOKENS.map((t) => [t, computedHex(t)])
    ) as Record<HpxCustomToken, string>
  })
  const isDark = document.documentElement.classList.contains("dark")

  // A theme built from another custom theme keeps that theme's base
  const base = React.useMemo(() => {
    const current = customThemes.find((t) => `custom:${t.id}` === palette)
    return current ? current.base : palette
  }, [customThemes, palette])

  const trimmed = name.trim()
  const taken = customThemes.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  const hasColor = MODES.some((m) => Object.keys(colors[m]).length > 0)
  const canSave = trimmed !== "" && !taken && hasColor

  const update = (mode: Mode, token: HpxCustomToken, hex: string) => {
    setColors((prev) => ({ ...prev, [mode]: { ...prev[mode], [token]: hex } }))
  }

  const save = () => {
    if (!canSave) return
    addCustomTheme({ id: Date.now().toString(36), name: trimmed, base, colors })
    onDone()
  }

  return (
    <>
      <HpxDialogHeader>
        <HpxDialogTitle>Create theme</HpxDialogTitle>
        <HpxDialogDescription>
          Name your theme and set hex codes for light and dark. It builds on the
          theme you are using now.
        </HpxDialogDescription>
      </HpxDialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <HpxLabel htmlFor="hpx-theme-name">Theme name</HpxLabel>
          <HpxInput
            id="hpx-theme-name"
            autoFocus
            maxLength={24}
            placeholder="My theme"
            value={name}
            aria-invalid={taken}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          {taken && (
            <span className="text-xs text-destructive">That name is already used.</span>
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-3 max-md:grid-cols-1">
          <span />
          <span className="text-sm font-medium max-md:hidden">Light</span>
          <span className="text-sm font-medium max-md:hidden">Dark</span>
          {HPX_CUSTOM_TOKENS.map((token) => (
            <React.Fragment key={token}>
              <span className="text-sm font-medium capitalize">{token}</span>
              {MODES.map((mode) => (
                <ColorField
                  key={mode}
                  label={`${token} ${mode}`}
                  value={colors[mode][token] ?? ""}
                  placeholder={(mode === "dark") === isDark ? placeholders[token] : "#RRGGBB"}
                  onCommit={(hex) => update(mode, token, hex)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <HpxDialogFooter>
        <HpxDialogButton variant="outline" onClick={onDone}>
          Cancel
        </HpxDialogButton>
        <HpxDialogButton disabled={!canSave} onClick={save}>
          Save theme
        </HpxDialogButton>
      </HpxDialogFooter>
    </>
  )
}

export function HpxThemeCustomizer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <HpxDialog open={open} onOpenChange={onOpenChange} originFromTrigger={false}>
      <HpxDialogContent className="max-w-2xl">
        <CustomizerBody onDone={() => onOpenChange(false)} />
      </HpxDialogContent>
    </HpxDialog>
  )
}
