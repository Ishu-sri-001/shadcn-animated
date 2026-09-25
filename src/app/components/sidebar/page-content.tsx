"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { ReceiveMessage } from "./receive-message"
import { useActivePage } from "./sidebar-shell"

const pages: Record<string, string> = {
  Inbox: "Messages from customers.",
  Calendar: "This week's roasts.",
  Settings: "Shop details and preferences.",
  "Saturday roast": "Tasting event for the new Ethiopian beans.",
  "Oat milk supplier": "Finding a supplier that can deliver twice a week.",
  "New cups": "Recyclable takeaway cups with the new logo.",
}

function Heading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex w-[40vw] flex-col gap-1 max-[1025px]:w-[70vw] max-md:w-full">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </div>
  )
}

function Page({ page }: { page: string }) {
  if (page in pages) return <Heading title={page}>{pages[page]}</Heading>

  // Home keeps the button that drives the sidebar's unread badge demo.
  return (
    <div className="flex flex-col items-start gap-3">
      <Heading title="Sidebar">
        A collapsible side navigation. Press ⌘B (Ctrl+B) or the button in the header to collapse
        it to icons; on mobile it slides in from the left, or swipe in from the edge.
      </Heading>
      <ReceiveMessage />
    </div>
  )
}

export function PageContent() {
  const { page, scaleContent } = useActivePage()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={page}
        className="flex flex-col gap-6"
        initial={{ opacity: 0, scale: scaleContent ? 0.97 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{
          opacity: 0,
          scale: scaleContent ? 0.97 : 1,
          transition: { duration: 0.15, ease: "easeIn" },
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{ originY: 0 }}
      >
        <Page page={page} />
      </motion.div>
    </AnimatePresence>
  )
}
