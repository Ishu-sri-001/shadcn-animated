export { cn } from "cn"

// Render helpers emit data-slot, so the Hpx hook is set by hand
export function hpxSlot(name: string) {
  return { "data-hpx-slot": name }
}
