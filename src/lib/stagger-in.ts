import { animate, stagger } from "motion/react"

/**
 * Fades the elements matching `selector` inside `root` up into place one after another.
 * Call it as the container mounts (from a callback ref): the items are hidden first, so
 * they never show for a frame before their turn.
 */
export function hpxStaggerIn(
  root: Element,
  selector: string,
  { gap, delay = 0.08, distance = 8 }: { gap: number; delay?: number; distance?: number }
) {
  if (gap <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const items = Array.from(root.querySelectorAll<HTMLElement>(selector))
  if (items.length === 0) return
  for (const item of items) item.style.opacity = "0"
  return animate(
    items,
    { opacity: [0, 1], y: [distance, 0] },
    { delay: stagger(gap, { startDelay: delay }), duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  )
}
