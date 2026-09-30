"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxDataTable,
  type HpxDataTableAlign,
  type HpxDataTableColumn,
  type HpxDataTableCountUp,
  type HpxDataTableHighlight,
  type HpxDataTableHoverTone,
  type HpxDataTableRadius,
  type HpxDataTableRow,
  type HpxDataTableSelectMark,
  type HpxDataTableStatus,
} from "@/components/ui/data-table"

const methods = ["Credit Card", "PayPal", "Bank Transfer"]

const invoices: HpxDataTableRow[] = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: 250 },
  { id: "INV002", status: "Pending", method: "PayPal", amount: 150 },
  { id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: 350 },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: 450 },
  { id: "INV005", status: "Paid", method: "PayPal", amount: 550 },
  { id: "INV006", status: "Pending", method: "Bank Transfer", amount: 200 },
  { id: "INV007", status: "Unpaid", method: "Credit Card", amount: 300 },
  { id: "INV008", status: "Paid", method: "Bank Transfer", amount: 125 },
  { id: "INV009", status: "Pending", method: "Credit Card", amount: 640 },
  { id: "INV010", status: "Paid", method: "PayPal", amount: 90 },
  { id: "INV011", status: "Unpaid", method: "PayPal", amount: 410 },
  { id: "INV012", status: "Paid", method: "Credit Card", amount: 275 },
]

const columns: HpxDataTableColumn[] = [
  { key: "id", header: "Invoice", className: "w-[20%] font-medium" },
  { key: "status", header: "Status", kind: "status" },
  { key: "method", header: "Method" },
  { key: "amount", header: "Amount", kind: "currency", align: "right" },
]

const statuses: HpxDataTableStatus[] = [
  { value: "Paid", tone: "success" },
  { value: "Pending", tone: "warning", pulse: true },
  { value: "Unpaid", tone: "danger" },
]

// Text button whose underline draws in from the left on hover, as in the other showcases.
const lineButton = cn(
  "relative font-medium text-muted-foreground transition-[color,opacity] outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40",
  "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
  "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
)

const controls = {
  staggerRows: { group: "Entrance", type: "checkbox", label: "Stagger rows", value: true },
  staggerCells: {
    disabled: (v) => !v.staggerRows,
    group: "Entrance",
    type: "checkbox",
    label: "Stagger cells",
    value: false,
  },
  numberAnimation: {
    group: "Entrance",
    type: "select",
    label: "Number animation",
    value: "roll",
    options: [
      { label: "Roll", value: "roll" },
      { label: "Count up", value: "on" },
      { label: "Off", value: "off" },
    ],
  },
  duration: {
    group: "Timing",
    type: "slider",
    label: "Duration",
    value: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  stagger: {
    disabled: (v) => !v.staggerRows,
    group: "Timing",
    type: "slider",
    label: "Stagger",
    value: 0.04,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },
  rowHighlight: {
    group: "Hover",
    type: "select",
    label: "Row highlight",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fill from top", value: "fill" },
      { label: "None", value: "none" },
    ],
  },
  rowHighlightColor: {
    disabled: (v) => v.rowHighlight === "none",
    group: "Hover",
    type: "select",
    label: "Row highlight color",
    value: "muted",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  rollingText: { group: "Hover", type: "checkbox", label: "Rolling text", value: false },
  showStatusFilter: { group: "Data", type: "checkbox", label: "Show status filter", value: true },
  highlightTotal: { group: "Data", type: "checkbox", label: "Highlight total", value: false },
  showPagination: { group: "Data", type: "checkbox", label: "Show pagination", value: false },
  selectable: { group: "Selection", type: "checkbox", label: "Row checkboxes", value: false },
  showSelectAll: { disabled: (v) => !v.selectable, group: "Selection", type: "checkbox", label: "Show select all", value: true },
  selectMark: {
    disabled: (v) => !v.selectable,
    group: "Selection",
    type: "select",
    label: "Select mark",
    value: "check",
    options: [
      { label: "Checkmark", value: "check" },
      { label: "Filled circle", value: "circle" },
    ],
  },
  showActionBar: { disabled: (v) => !v.selectable, group: "Selection", type: "checkbox", label: "Show action bar", value: true },
  dragMode: {
    group: "Rows",
    type: "checkbox",
    label: "Drag mode",
    value: false,
  },
  showStatusBadges: { group: "Rows", type: "checkbox", label: "Show status badges", value: true },
  expandable: { group: "Rows", type: "checkbox", label: "Expandable preview", value: false },
  removable: { group: "Rows", type: "checkbox", label: "Delete column", value: false },
  addable: { group: "Rows", type: "checkbox", label: "Add rows", value: true },
  textAlign: {
    group: "Layout",
    type: "select",
    label: "Text alignment",
    value: "left",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
  },
  bordered: { group: "Layout", type: "checkbox", label: "Border", value: true },
  rounded: {
    group: "Layout",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
    ],
  },
  showHorizontalLines: { group: "Layout", type: "checkbox", label: "Show horizontal lines", value: true },
  showVerticalLines: { group: "Layout", type: "checkbox", label: "Show vertical lines", value: true },
  showHeaderBorder: { group: "Layout", type: "checkbox", label: "Show header border", value: true },
  boldHeader: { group: "Layout", type: "checkbox", label: "Bold header", value: true },
  stickyHeader: { group: "Layout", type: "checkbox", label: "Sticky header", value: true },
  expandFullTable: { group: "Layout", type: "checkbox", label: "Expand full table", value: false },
  height: {
    disabled: (v) => !!v.expandFullTable,
    group: "Layout",
    type: "slider",
    label: "Table height",
    value: 50,
    min: 20,
    max: 100,
    step: 5,
    unit: "vh",
  },
  stickyFooter: { disabled: (v) => !v.highlightTotal, group: "Layout", type: "checkbox", label: "Sticky last row", value: true },
  loadingSkeleton: { group: "Layout", type: "checkbox", label: "Loading skeleton", value: true },
} satisfies HpxControlSchema

export default function TablePage() {
  const panel = useHpxControls(controls)
  const { values } = panel
  const [replay, setReplay] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const reload = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1400)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4 max-md:flex-col max-md:items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Table</h1>
          <p className="text-sm text-muted-foreground">
            Filter, select and reorder invoices, with rows that glide into place.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <button type="button" onClick={reload} disabled={loading} className={lineButton}>
            Reload
          </button>
          <button type="button" onClick={() => setReplay((n) => n + 1)} className={lineButton}>
            Replay
          </button>
        </div>
      </div>

      <HpxDataTable
        key={replay}
        // On phones the table breaks out of the page's 80vw column to 94vw, centred.
        className="max-md:relative max-md:left-1/2 max-md:w-[94vw] max-md:-translate-x-1/2"
        columns={columns}
        rows={invoices}
        totalKey="amount"
        statusKey="status"
        statuses={statuses}
        loading={loading}
        renderDetail={(row) =>
          `${row.id} was paid by ${String(row.method).toLowerCase()}. Issued 12 March, due 12 April.`
        }
        createRow={(rows) => {
          // One past the highest invoice number so far.
          const n = Math.max(0, ...rows.map((row) => Number(String(row.id).slice(3)))) + 1
          return {
            id: `INV${String(n).padStart(3, "0")}`,
            status: "Pending",
            method: methods[n % methods.length],
            amount: 100 + ((n * 37) % 500),
          }
        }}
        {...values}
        height={`${values.height}vh`}
        sortable={false}
        rowHighlight={values.rowHighlight as HpxDataTableHighlight}
        numberAnimation={values.numberAnimation as HpxDataTableCountUp}
        rowHighlightColor={values.rowHighlightColor as HpxDataTableHoverTone}
        selectMark={values.selectMark as HpxDataTableSelectMark}
        textAlign={values.textAlign as HpxDataTableAlign}
        rounded={values.rounded as HpxDataTableRadius}
        dragMode={values.dragMode ? "rows" : "none"}
      />

      <HpxControlsPanel title="Table" {...panel} />
    </div>
  )
}
