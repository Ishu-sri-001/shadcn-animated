"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { ReceiveMessage } from "./receive-message"
import { useActivePage } from "./sidebar-shell"

const stats = [
  { label: "Orders today", value: "128" },
  { label: "Beans in stock", value: "342 kg" },
  { label: "Deliveries", value: "46" },
]

const orders = [
  { customer: "Maya Patel", coffee: "Ethiopia Guji", total: "£24.00" },
  { customer: "Tom Hughes", coffee: "House Blend", total: "£16.50" },
  { customer: "Aisha Khan", coffee: "Colombia Huila", total: "£32.00" },
]

const messages = [
  { from: "Maya Patel", text: "Could I switch my next box to whole bean?" },
  { from: "Leo Martin", text: "The Kenya AA was lovely, thank you!" },
  { from: "Sara Lind", text: "Is the decaf available in 1 kg bags?" },
  { from: "Tom Hughes", text: "Please pause my subscription for June." },
  { from: "Aisha Khan", text: "What grind would you suggest for AeroPress?" },
]

const roasts = [
  { day: "Mon", coffee: "Ethiopia Guji", amount: "24 kg" },
  { day: "Tue", coffee: "House Blend", amount: "40 kg" },
  { day: "Thu", coffee: "Colombia Huila", amount: "18 kg" },
  { day: "Fri", coffee: "Kenya AA", amount: "12 kg" },
]

const settings = [
  { label: "Shop name", value: "Bean & Co." },
  { label: "Roast days", value: "Mon, Tue, Thu, Fri" },
  { label: "Currency", value: "GBP (£)" },
  { label: "Order emails", value: "On" },
]

const projects: Record<string, { summary: string; tasks: string[] }> = {
  "Saturday roast": {
    summary: "Tasting event for the new Ethiopian beans.",
    tasks: ["Dial in the grinder", "Print tasting cards", "Set up the filter bar"],
  },
  "Oat milk supplier": {
    summary: "Finding a supplier that can deliver twice a week.",
    tasks: ["Compare three suppliers", "Order samples", "Taste with espresso"],
  },
  "New cups": {
    summary: "Recyclable takeaway cups with the new logo.",
    tasks: ["Approve the print proof", "Confirm sizes", "Schedule delivery"],
  },
}

function Heading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  )
}

function Rows({ rows }: { rows: { left: React.ReactNode; right?: React.ReactNode }[] }) {
  return (
    <ul className="flex flex-col divide-y text-sm">
      {rows.map((row, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-2.5">
          {row.left}
          {row.right !== undefined && (
            <span className="text-muted-foreground tabular-nums">{row.right}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function Home() {
  return (
    <>
      <div className="flex flex-col items-start gap-3">
        <Heading title="Sidebar">
          A collapsible side navigation. Press ⌘B (Ctrl+B) or the button in the header to collapse
          it to icons; on mobile it slides in from the left, or swipe in from the edge.
        </Heading>
        {/* Bumps the Inbox badge in the sidebar. */}
        <ReceiveMessage />
      </div>
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-xl border p-4">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="text-2xl font-semibold tabular-nums">{stat.value}</span>
          </div>
        ))}
      </div>
      <Card title="Recent orders">
        <Rows
          rows={orders.map((order) => ({
            left: (
              <span className="flex flex-col gap-0.5">
                {order.customer}
                <span className="text-muted-foreground">{order.coffee}</span>
              </span>
            ),
            right: order.total,
          }))}
        />
      </Card>
    </>
  )
}

function Inbox() {
  return (
    <>
      <div className="flex flex-col items-start gap-3">
        <Heading title="Inbox">Messages from customers.</Heading>
        <ReceiveMessage />
      </div>
      <Card title="Messages">
        <Rows
          rows={messages.map((message) => ({
            left: (
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{message.from}</span>
                <span className="text-muted-foreground">{message.text}</span>
              </span>
            ),
          }))}
        />
      </Card>
    </>
  )
}

function Calendar() {
  return (
    <>
      <Heading title="Calendar">This week&apos;s roasts.</Heading>
      <Card title="Upcoming roasts">
        <Rows
          rows={roasts.map((roast) => ({
            left: (
              <span className="flex items-center gap-3">
                <span className="w-8 text-muted-foreground">{roast.day}</span>
                {roast.coffee}
              </span>
            ),
            right: roast.amount,
          }))}
        />
      </Card>
    </>
  )
}

function Settings() {
  return (
    <>
      <Heading title="Settings">Shop details and preferences.</Heading>
      <Card title="General">
        <Rows rows={settings.map((setting) => ({ left: setting.label, right: setting.value }))} />
      </Card>
    </>
  )
}

function Project({ name }: { name: string }) {
  const project = projects[name]
  return (
    <>
      <Heading title={name}>{project.summary}</Heading>
      <Card title="Tasks">
        <Rows rows={project.tasks.map((task) => ({ left: task }))} />
      </Card>
    </>
  )
}

function Page({ page }: { page: string }) {
  if (page === "Inbox") return <Inbox />
  if (page === "Calendar") return <Calendar />
  if (page === "Settings") return <Settings />
  if (page in projects) return <Project name={page} />
  return <Home />
}

/** The page for the item picked in the sidebar; switching fades (and optionally scales) between them. */
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
        // Scales from the top, so the heading stays roughly in place.
        style={{ originY: 0 }}
      >
        <Page page={page} />
      </motion.div>
    </AnimatePresence>
  )
}
