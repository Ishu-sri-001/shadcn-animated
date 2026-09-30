export const HPX_PALETTE_KEY = "hpx-palette"
export const HPX_CUSTOM_THEMES_KEY = "hpx-custom-themes"
export const HPX_CUSTOM_THEMES_EVENT = "hpx-custom-themes-change"

export const HPX_CUSTOM_TOKENS = ["primary", "secondary", "muted"] as const

export type HpxCustomToken = (typeof HPX_CUSTOM_TOKENS)[number]
export type HpxCustomColors = {
  light: Partial<Record<HpxCustomToken, string>>
  dark: Partial<Record<HpxCustomToken, string>>
}
export type HpxCustomTheme = {
  id: string
  name: string
  base: string
  colors: HpxCustomColors
}

export const HPX_HEX_PATTERN = /^#[0-9a-f]{6}$/i

// Self-contained: it is also inlined into the pre-paint script
export function hpxApplyTheme() {
  try {
    const root = document.documentElement
    // Old builds stored overrides for every theme here
    localStorage.removeItem("hpx-custom-colors")
    const stored = localStorage.getItem("hpx-palette") || "default"
    let theme = stored
    let custom = null
    if (stored.indexOf("custom:") === 0) {
      const list = JSON.parse(localStorage.getItem("hpx-custom-themes") || "[]")
      for (let i = 0; i < list.length; i++) {
        if ("custom:" + list[i].id === stored) custom = list[i]
      }
      theme = custom ? custom.base : "default"
    }
    root.setAttribute("data-hpx-theme", theme)
    if (custom) root.setAttribute("data-hpx-custom", custom.id)
    else root.removeAttribute("data-hpx-custom")

    let css = ""
    const modes = [
      ["light", ":root:root:root:not(.dark)"],
      ["dark", ":root:root.dark"],
    ]
    for (let i = 0; custom && i < modes.length; i++) {
      const colors = custom.colors[modes[i][0]] || {}
      let body = ""
      for (const token in colors) {
        const hex = colors[token]
        if (!/^#[0-9a-f]{6}$/i.test(hex)) continue
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        const fg = (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff"
        body += "--" + token + ":" + hex + ";--" + token + "-foreground:" + fg + ";"
        if (token === "primary") {
          body += "--ring:" + hex + ";--sidebar-primary:" + hex + ";--sidebar-primary-foreground:" + fg + ";"
        }
      }
      if (body) css += modes[i][1] + "{" + body + "}"
    }
    let el = document.getElementById("hpx-custom-colors")
    if (!el) {
      el = document.createElement("style")
      el.id = "hpx-custom-colors"
      document.head.appendChild(el)
    }
    el.textContent = css
  } catch {}
}
