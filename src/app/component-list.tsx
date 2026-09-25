"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"
import { motion, MotionConfig, stagger, type Variants } from "motion/react"

import type { RegistryItem } from "@/components/registry"

const smoothEase = [0.22, 1, 0.36, 1] as const
const easeOutCubic = [0.33, 1, 0.68, 1] as const
const glide = { type: "spring", visualDuration: 0.3, bounce: 0.15 } as const

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: stagger(0.05, { startDelay: 0.1 }) } },
}

// Each row's content slides up from the bottom of its own clipped box.
const rise: Variants = {
  hidden: { y: "100%" },
  visible: { y: "0%", transition: { duration: 0.6, ease: smoothEase } },
}

// Divider lines draw in left to right as their row arrives.
const draw: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.8, ease: smoothEase } },
}

/** The component index: rows reveal in a stagger, and one highlight glides to the hovered row. */
export function ComponentList({ items }: { items: RegistryItem[] }) {
  const [active, setActive] = React.useState<string | null>(null)

  return (
    <MotionConfig reducedMotion="user">
      <motion.ul
        className="flex flex-col"
        variants={listVariants}
        initial="hidden"
        animate="visible"
        onPointerLeave={() => setActive(null)}
      >
        {items.map((item, i) => (
          <motion.li key={item.slug} className="relative" variants={{ hidden: {}, visible: {} }}>
            {i === 0 && <Divider className="top-0" />}
            <Row
              item={item}
              index={i}
              active={active === item.slug}
              onActivate={() => setActive(item.slug)}
            />
            <Divider className="bottom-0" />
          </motion.li>
        ))}
      </motion.ul>
    </MotionConfig>
  )
}

function Divider({ className }: { className: string }) {
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 h-px origin-left bg-border ${className}`}
      variants={draw}
    />
  )
}

function Row({
  item,
  index,
  active,
  onActivate,
}: {
  item: RegistryItem
  index: number
  active: boolean
  onActivate: () => void
}) {
  return (
    <motion.div whileTap={{ scale: 0.99 }} transition={glide}>
      <Link
        href={`/components/${item.slug}`}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        className="relative isolate flex items-center gap-[2vw] rounded-lg px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 max-md:gap-4 max-md:px-3"
      >
        {active && (
          <motion.span
            layoutId="component-list-highlight"
            aria-hidden
            className="absolute inset-0 -z-10 rounded-lg bg-muted"
            transition={glide}
          />
        )}

        <Clip>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </Clip>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <Clip>
            <RollText active={active} className="font-medium">
              {item.name}
            </RollText>
          </Clip>
          <Clip>
            <span className="block text-sm text-muted-foreground">{item.description}</span>
          </Clip>
        </span>

        <Clip>
          <SwapArrow active={active} />
        </Clip>
      </Link>
    </motion.div>
  )
}

/** A clipped box whose content rises into place with the list's stagger. */
function Clip({ children }: { children: React.ReactNode }) {
  return (
    <span className="block overflow-hidden">
      <motion.span className="block" variants={rise}>
        {children}
      </motion.span>
    </span>
  )
}

/** Text that rolls up to a copy of itself while `active`. */
function RollText({
  active,
  className,
  children,
}: {
  active: boolean
  className?: string
  children: React.ReactNode
}) {
  const transition = { duration: 0.4, ease: easeOutCubic }
  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      <motion.span
        className="block"
        initial={false}
        animate={{ y: active ? "-100%" : "0%" }}
        transition={transition}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 block"
        initial={false}
        animate={{ y: active ? "0%" : "100%" }}
        transition={transition}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** On hover the arrow flies out to the top right and a new one comes in from the bottom left. */
function SwapArrow({ active }: { active: boolean }) {
  const transition = { duration: 0.4, ease: easeOutCubic }
  return (
    <span className="relative flex size-4 overflow-hidden text-muted-foreground">
      <motion.span
        className="flex"
        initial={false}
        animate={active ? { x: "100%", y: "-100%" } : { x: "0%", y: "0%" }}
        transition={transition}
      >
        <ArrowUpRightIcon className="size-4" />
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-0 flex text-foreground"
        initial={false}
        animate={active ? { x: "0%", y: "0%" } : { x: "-100%", y: "100%" }}
        transition={transition}
      >
        <ArrowUpRightIcon className="size-4" />
      </motion.span>
    </span>
  )
}
