"use client"

import * as React from "react"
import { cn } from "cn"
import gsap from "gsap"
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import {
  AnimatePresence,
  motion,
  MotionConfig,
  Reorder,
  stagger as staggerChildren,
  useDragControls,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react"

import { Button } from "@/components/ui/button"
import { MorphChevron } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const smoothEase = [0.22, 1, 0.36, 1] as const
const easeOutCubic = [0.33, 1, 0.68, 1] as const
const glide = { type: "spring", visualDuration: 0.3, bounce: 0.15 } as const

/** Gap between a row's cells with `rowCellsStagger`, in seconds. */
const CELL_GAP = 0.04
/** Gap between rows ticking in a select-all wave, in milliseconds. */
const WAVE_MS = 30

type DataTableRow = { id: string; [key: string]: unknown }

type DataTableColumn = {
  key: string
  header: string
  kind?: "text" | "number" | "currency" | "status"
  align?: "left" | "right"
  /** Tailwind classes for the column's cells, e.g. a width like `w-[20%]`. */
  className?: string
}

type DataTableStatusTone = "success" | "warning" | "danger" | "neutral"
type DataTableStatus = {
  value: string
  tone: DataTableStatusTone
  pulse?: boolean
}
type DataTableHighlight = "slide" | "fill" | "none"
/** Tailwind radius names for the table's outer corners. */
type DataTableRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl"

const RADIUS_CLASS: Record<DataTableRadius, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
}

/** Colour of the hovered row's highlight. */
type DataTableHoverTone = "muted" | "primary"
/** How numbers animate: digits roll, the value counts up, or no animation. */
type DataTableCountUp = "roll" | "on" | "off"
type DataTableDrag = "none" | "rows"
type DataTableSelectMark = "check" | "circle"
type DataTableAlign = "left" | "center" | "right"

const ALIGN_CLASS: Record<DataTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

type DataTableProps = {
  columns: DataTableColumn[]
  rows: DataTableRow[]
  caption?: string
  /** Column summed in the footer. */
  totalKey?: string
  /** Column holding each row's status, for badges, filter chips and the action bar. */
  statusKey?: string
  statuses?: DataTableStatus[]
  currency?: string
  /** Content for a row's expandable detail panel. */
  renderDetail?: (row: DataTableRow) => React.ReactNode
  /** Makes a new row for the Add button, given the rows already in the table. */
  createRow?: (rows: DataTableRow[]) => DataTableRow
  loading?: boolean
  className?: string

  /** Base animation length, in seconds. */
  duration?: number
  /** Gap between rows appearing, in seconds. */
  stagger?: number
  /** Rows fade and rise in one after another when the table scrolls into view. */
  entrance?: boolean
  /** Cells come in left to right inside each row, making a diagonal wave. */
  rowCellsStagger?: boolean
  /**
   * How numbers animate, from zero the first time they appear and then between values:
   * `roll` spins each digit like an odometer, `on` counts the value up, `off` doesn't animate.
   */
  countUp?: DataTableCountUp
  /** How the hovered row is highlighted. */
  highlight?: DataTableHighlight
  /** Colour of the row highlight: a soft muted tint, or primary with light text. */
  hoverTone?: DataTableHoverTone
  /** Text cells roll to a copy of themselves on hover (not numbers or status badges). */
  textRoll?: boolean
  /** Click a heading to sort; rows glide to their new places. */
  sortable?: boolean
  /** Status chips above the table filter the rows. */
  filterable?: boolean
  /** Show the total footer with a muted background and bold text; otherwise hide it. */
  highlightTotal?: boolean
  /** Row checkboxes, with shift-click ranges. */
  selectable?: boolean
  /** A header checkbox that ticks every row in a wave. */
  selectAll?: boolean
  /** How a selected row is marked: a checkbox with a tick, or a circle that fills solid. */
  selectMark?: DataTableSelectMark
  /** Text alignment for every heading, cell and the footer. */
  textAlign?: DataTableAlign
  /** A floating bar with actions for the selected rows. */
  actionBar?: boolean
  /** What can be dragged to reorder. */
  drag?: DataTableDrag
  /** Status as coloured pills that change on click. */
  statusBadges?: boolean
  /** Click a row to open its detail panel. */
  expandable?: boolean
  /** A delete button on each row. */
  removable?: boolean
  /** An Add button above the table. */
  addable?: boolean
  /** Pin the footer (the total row) to the bottom while the rows scroll. */
  stickyFooter?: boolean
  /** Pin the header while the table scrolls. Does not change the table's height. */
  stickyHeader?: boolean
  /** Show every row without the internal height limit. */
  expandFullTable?: boolean
  /** Maximum table height when not expanded; CSS length or pixels. Defaults to 50vh. */
  height?: React.CSSProperties["maxHeight"]
  /** The line under the header row. */
  headerBorder?: boolean
  /** Semibold header text; off, it's regular weight. */
  boldHeader?: boolean
  /** Shimmering placeholder rows while `loading`. */
  skeleton?: boolean
  /** Split rows into pages that slide. */
  pagination?: boolean
  pageSize?: number
  /** A rounded border around the whole table. */
  bordered?: boolean
  /** Roundness of the table corners; row highlights clip at these outer edges. */
  radius?: DataTableRadius
  /** Lines between rows. */
  horizontalLines?: boolean
  /** Lines between columns. */
  verticalLines?: boolean
}

type Settings = Required<
  Omit<
    DataTableProps,
    | "columns"
    | "rows"
    | "caption"
    | "totalKey"
    | "statusKey"
    | "renderDetail"
    | "createRow"
    | "className"
  >
> &
  Pick<DataTableProps, "statusKey" | "renderDetail">

type ExitKind = "remove" | "filter" | "page"
type RowCustom = { delay: number; dir: number; kind: ExitKind }

type TableContextValue = {
  settings: Settings
  columns: DataTableColumn[]
  revealed: boolean
  /** The first reveal has finished; numbers that mount later show their value straight away. */
  settled: boolean
  /** Direction of the last page change (1 forward, -1 back), or 0 for any other change. */
  pageDir: number
  format: (column: DataTableColumn, value: number) => string
  hoverRow: string | null
  /** Measures the hovered row right away, in the pointer handler. */
  hoverRowAt: (id: string, el: HTMLElement) => void
  /** A row drag started (true) or ended (false); hover tracking pauses in between. */
  setDragging: (dragging: boolean) => void
  selected: Set<string>
  toggleSelect: (id: string, range: boolean) => void
  expanded: Set<string>
  toggleExpand: (id: string) => void
  removeRows: (ids: string[]) => void
  cycleStatus: (id: string) => void
  freshId: string | null
  leading: number
  trailing: number
  /** When each drawn grid line starts, during the first reveal. */
  lines: { start: number; step: number; columns: number }
}

const TableContext = React.createContext<TableContextValue | null>(null)

function useTable() {
  const context = React.useContext(TableContext)
  if (!context) throw new Error("DataTable parts must be used within <DataTable>.")
  return context
}

function DataTable({
  columns,
  rows,
  caption,
  totalKey,
  statusKey,
  statuses = [],
  currency = "USD",
  renderDetail,
  createRow,
  loading = false,
  className,
  duration = 0.4,
  stagger = 0.04,
  entrance = true,
  rowCellsStagger = false,
  countUp = "roll",
  highlight = "slide",
  hoverTone = "muted",
  textRoll = false,
  sortable = true,
  filterable = true,
  highlightTotal = false,
  selectable = true,
  selectAll = true,
  selectMark = "check",
  textAlign = "left",
  actionBar = true,
  drag = "none",
  statusBadges = true,
  expandable = false,
  removable = false,
  addable = true,
  stickyHeader = true,
  expandFullTable = false,
  height = "50vh",
  headerBorder = true,
  boldHeader = true,
  stickyFooter = true,
  skeleton = true,
  pagination = false,
  bordered = true,
  radius = "lg",
  horizontalLines = true,
  verticalLines = true,
  pageSize = 5,
}: DataTableProps) {
  const settings: Settings = {
    statuses,
    currency,
    loading,
    duration,
    stagger,
    entrance,
    rowCellsStagger,
    countUp,
    highlight,
    hoverTone,
    textRoll,
    sortable,
    filterable,
    highlightTotal,
    selectable,
    selectAll,
    selectMark,
    textAlign,
    actionBar,
    drag,
    statusBadges,
    expandable: expandable && !!renderDetail,
    removable,
    addable: addable && !!createRow,
    stickyHeader,
    expandFullTable,
    height,
    headerBorder,
    boldHeader,
    stickyFooter,
    skeleton,
    pagination,
    pageSize,
    bordered,
    radius,
    horizontalLines,
    verticalLines,
    statusKey,
    renderDetail,
  }

  const [data, setData] = React.useState(rows)
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null)
  const [filter, setFilter] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(0)
  const [exit, setExit] = React.useState<{ dir: number; kind: ExitKind }>({
    dir: 0,
    kind: "remove",
  })
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [rowBox, setRowBox] = React.useState<RowBox | null>(null)
  const hoverRow = rowBox?.id ?? null
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const [scrolled, setScrolled] = React.useState(false)
  const [atBottom, setAtBottom] = React.useState(false)

  const wrapper = React.useRef<HTMLDivElement>(null)
  const table = React.useRef<HTMLTableElement>(null)
  const anchor = React.useRef<string | null>(null)
  const timers = React.useRef<number[]>([])
  const inView = useInView(wrapper, { once: true, amount: 0.2 })
  // Only reset the entrance during loading when it is enabled. Otherwise the mounted rows
  // retain their full height behind the skeleton and appear immediately when loading ends.
  const headerRevealed = !entrance || inView
  const showSkeleton = loading && skeleton
  const revealed = headerRevealed && !(showSkeleton && entrance)
  // Rows in the first reveal use its staggered timing; rows that arrive later come in quickly.
  // Before that, with the entrance off, rows already on the page don't animate at all.
  const [settled, setSettled] = React.useState(false)
  // When loading finishes, the fresh rows get the full reveal again: they rise in, the grid
  // lines redraw and the numbers roll up from zero.
  const [wasLoading, setWasLoading] = React.useState(loading)
  if (wasLoading !== loading) {
    setWasLoading(loading)
    if (!loading) setSettled(false)
  }

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const ordered = columns
  const dragRows = drag === "rows"
  const leading = (dragRows ? 1 : 0) + (selectable ? 1 : 0)
  const trailing = (settings.expandable ? 1 : 0) + (removable ? 1 : 0)

  const numberFormat = React.useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency }),
    [currency]
  )
  const format = React.useCallback(
    (column: DataTableColumn, value: number) =>
      column.kind === "currency" ? numberFormat.format(value) : Math.round(value).toLocaleString(),
    [numberFormat]
  )

  // Filter → sort → page.
  let view = filter && statusKey ? data.filter((row) => row[statusKey] === filter) : data
  if (sort) {
    view = [...view].sort((a, b) => {
      const x = a[sort.key]
      const y = b[sort.key]
      const diff =
        typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))
      return diff * sort.dir
    })
  }
  const pageCount = pagination ? Math.max(1, Math.ceil(view.length / pageSize)) : 1
  const currentPage = Math.min(page, pageCount - 1)
  const visible = pagination
    ? view.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : view
  const total = totalKey ? view.reduce((sum, row) => sum + Number(row[totalKey] ?? 0), 0) : 0

  const exitAs = (kind: ExitKind, dir = 0) => setExit({ kind, dir })

  const toggleSelect = (id: string, range: boolean) => {
    const ids = visible.map((row) => row.id)
    const on = !selected.has(id)
    const from = anchor.current ? ids.indexOf(anchor.current) : -1
    const to = ids.indexOf(id)
    anchor.current = id
    setSelected((prev) => {
      const next = new Set(prev)
      const span =
        range && from !== -1 && to !== -1
          ? ids.slice(Math.min(from, to), Math.max(from, to) + 1)
          : [id]
      span.forEach((v) => (on ? next.add(v) : next.delete(v)))
      return next
    })
  }

  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id))
  const someSelected = visible.some((row) => selected.has(row.id))
  const toggleAll = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    const on = !allSelected
    const ids = visible.map((row) => row.id).filter((id) => selected.has(id) !== on)
    const wave = on ? ids : ids.toReversed()
    timers.current = wave.map((id, i) =>
      window.setTimeout(() => {
        setSelected((prev) => {
          const next = new Set(prev)
          if (on) next.add(id)
          else next.delete(id)
          return next
        })
      }, i * WAVE_MS)
    )
  }

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const removeRows = (ids: string[]) => {
    exitAs("remove")
    const gone = new Set(ids)
    setData((prev) => prev.filter((row) => !gone.has(row.id)))
    setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))))
    setExpanded((prev) => new Set([...prev].filter((id) => !gone.has(id))))
  }

  const setStatus = (ids: string[], value: string) => {
    if (!statusKey) return
    const targets = new Set(ids)
    setData((prev) =>
      prev.map((row) => (targets.has(row.id) ? { ...row, [statusKey]: value } : row))
    )
  }

  const cycleStatus = (id: string) => {
    if (!statusKey || statuses.length === 0) return
    const row = data.find((r) => r.id === id)
    const at = statuses.findIndex((s) => s.value === row?.[statusKey])
    exitAs("filter")
    setStatus([id], statuses[(at + 1) % statuses.length].value)
  }

  // Visible rows take the new order in the slots they already hold, so hidden rows stay put.
  const reorderRows = (next: DataTableRow[]) => {
    setSort(null)
    const ids = new Set(visible.map((row) => row.id))
    setData((prev) => {
      // Copied inside the updater: React may run it twice in development.
      const queue = [...next]
      return prev.map((row) => (ids.has(row.id) ? (queue.shift() ?? row) : row))
    })
  }

  const addRow = () => {
    if (!createRow) return
    const row = createRow(data)
    exitAs("remove")
    setFilter(null)
    setPage(0)
    setSort(null)
    setData((prev) => [row, ...prev])
    setFreshId(row.id)
  }

  const cycleSort = (key: string) => {
    exitAs("filter")
    setSort((prev) =>
      prev?.key !== key ? { key, dir: 1 } : prev.dir === 1 ? { key, dir: -1 } : null
    )
  }

  const goToPage = (next: number) => {
    exitAs("page", next > currentPage ? 1 : -1)
    setPage(next)
  }

  // Positions are relative to the scrolling wrapper, so the overlays scroll with the rows.
  // While a row is dragged, the hover highlight hides and stops tracking: otherwise it chases
  // whichever row passes under the pointer and the lines around it flicker as rows swap.
  const dragging = React.useRef(false)
  const setDragging = (next: boolean) => {
    dragging.current = next
    if (next) {
      setRowBox(null)
      return
    }
    // Dropped: put the highlight on whichever row is now under the pointer.
    const p = pointer.current
    const tr = p && document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>("tr[data-row-id]")
    if (tr?.dataset.rowId) hoverRowAt(tr.dataset.rowId, tr)
  }

  const hoverRowAt = (id: string, el: HTMLElement) => {
    const root = wrapper.current
    if (!root || dragging.current) return
    const r = el.getBoundingClientRect()
    const w = root.getBoundingClientRect()
    // Absolute children use the padding edge; the bounding rect includes the border.
    const top = r.top - w.top - root.clientTop + root.scrollTop
    setRowBox((prev) =>
      // Same row in the same place: keep the state so nothing re-renders.
      prev?.id === id && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.height - r.height) < 0.5
        ? prev
        : { id, top, height: r.height, snap: !prev }
    )
  }

  // Last pointer position over the table, to find the row under it without a pointer event.
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const trackPointer = React.useEffectEvent(() => {
    const p = pointer.current
    if (!p || dragging.current) return
    const tr = document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>("tr[data-row-id]")
    if (tr?.dataset.rowId) hoverRowAt(tr.dataset.rowId, tr)
    else setRowBox(null)
  })

  // When rows are added, removed, filtered, sorted, paged or expanded, rows slide while the
  // pointer stays put. Re-measure the row under the pointer every frame until they settle, so
  // the highlight moves with them and ends on the right row.
  const layoutKey = `${visible.map((row) => row.id).join()}|${[...expanded].join()}`
  React.useEffect(() => {
    if (!pointer.current) return
    const until = performance.now() + (duration + 0.3) * 1000
    let frame = requestAnimationFrame(function tick(now) {
      trackPointer()
      if (now < until) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [layoutKey, duration])

  const context: TableContextValue = {
    settings,
    columns: ordered,
    revealed,
    settled,
    pageDir: exit.kind === "page" ? exit.dir : 0,
    format,
    hoverRow,
    hoverRowAt,
    setDragging,
    selected,
    toggleSelect,
    expanded,
    toggleExpand,
    removeRows,
    cycleStatus,
    freshId,
    leading,
    trailing,
    // The grid forms from the top-left corner: the segment on cell (row, column) draws at
    // start + (row + column) × step, so the lines sweep out diagonally and each segment hands
    // off to the next one as it finishes. Row 0 is the header.
    lines: {
      start: 0.15,
      step: (duration * 3) / (visible.length + ordered.length + leading + trailing + 2),
      columns: ordered.length + leading + trailing,
    },
  }

  // Header, then its line, then the rows.
  const rowsStart = 0.1
  const headVariants: Variants = {
    hidden: { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0, transition: { duration, ease: smoothEase } },
  }

  const headCell = (index: number, content: React.ReactNode) => (
    <>
      {content != null && (
        <LoadingCell loading={showSkeleton}>{content}</LoadingCell>
      )}
      {verticalLines && index < context.lines.columns - 1 && (
        <GridLine
          axis="y"
          visible={headerRevealed}
          delay={context.lines.start + index * context.lines.step}
          duration={context.lines.step}
        />
      )}
      {/* The header's bottom line draws with the rest of the grid, from the top left. */}
      {headerBorder && (
        <GridLine
          axis="x"
          visible={headerRevealed}
          delay={context.lines.start + index * context.lines.step}
          duration={context.lines.step}
        />
      )}
    </>
  )

  const thClass = cn(
    "relative h-12 px-2 text-left align-middle whitespace-nowrap text-foreground",
    boldHeader ? "font-semibold" : "font-normal",
    stickyHeader && "sticky top-0 z-20 bg-background transition-shadow duration-300",
    stickyHeader && scrolled && "shadow-[0_6px_10px_-6px_rgb(0_0_0/0.2)]"
  )

  const headers = ordered.map((column, j) => {
    const sorted = sort?.key === column.key ? sort.dir : 0
    const label = sortable ? (
      <button
        type="button"
        onClick={() => cycleSort(column.key)}
        className={cn(
          "group/sort -mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          // The sort arrow sits on the outer side of right-aligned headings.
          textAlign === "right" && "flex-row-reverse"
        )}
      >
        {column.header}
        <motion.span
          className={cn(
            "flex transition-opacity duration-200",
            sorted ? "opacity-100" : "opacity-0 group-hover/sort:opacity-50"
          )}
          initial={false}
          animate={{ rotate: sorted === -1 ? 180 : 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <ArrowUpIcon className="size-3.5" />
        </motion.span>
      </button>
    ) : (
      column.header
    )
    const props = {
      "data-col": column.key,
      className: cn(
        thClass,
        ALIGN_CLASS[textAlign],
        column.className,
        // Last, so a column's own font classes don't override the header weight.
        boldHeader ? "font-semibold" : "font-normal"
      ),
      children: headCell(leading + j, label),
    }
    return <th key={column.key} {...props} />
  })

  const leadingHeads = (
    <>
      {dragRows && <th className={cn(thClass, "w-8")}>{headCell(0, null)}</th>}
      {selectable && (
        <th className={cn(thClass, "w-8")}>
          {headCell(
            dragRows ? 1 : 0,
            selectAll ? (
              <RowCheckbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                label="Select all rows"
                onToggle={toggleAll}
              />
            ) : null
          )}
        </th>
      )}
    </>
  )
  const trailingHeads = Array.from({ length: trailing }, (_, i) => (
    <th key={`trail-${i}`} className={cn(thClass, "w-10")}>
      {headCell(leading + ordered.length + i, null)}
    </th>
  ))

  const reveal = revealed ? "visible" : "hidden"
  // A pinned footer is opaque, keeps a top line, and casts a shadow up while rows hide under it.
  const footClass = cn(
    "relative",
    stickyFooter &&
      "sticky bottom-0 z-20 shadow-[inset_0_1px_0_var(--border)] transition-shadow duration-300",
    stickyFooter && (highlightTotal ? "bg-muted" : "bg-background"),
    stickyFooter &&
      !expandFullTable &&
      !atBottom &&
      "shadow-[inset_0_1px_0_var(--border),0_-6px_10px_-6px_rgb(0_0_0/0.2)]"
  )

  // The footer is the row after the last body row.
  const footLine = (j: number) =>
    verticalLines && j < context.lines.columns - 1 ? (
      <GridLine
        axis="y"
        visible={headerRevealed}
        delay={context.lines.start + (visible.length + 1 + j) * context.lines.step}
        duration={context.lines.step}
      />
    ) : null

  const headRow = (
    <motion.tr variants={headVariants} animate={headerRevealed ? "visible" : "hidden"}>
      {leadingHeads}
      {headers}
      {trailingHeads}
    </motion.tr>
  )

  const statusCounts = statusKey
    ? statuses.map((status) => ({
        ...status,
        count: data.filter((row) => row[statusKey] === status.value).length,
      }))
    : []

  // Flat list of rows and open detail rows, each keyed directly under AnimatePresence.
  const bodyRows = visible.flatMap((row, i) => [
    <DataTableRowView
      // With pagination, rows are kept by position so paging swaps the content inside each
      // cell (a sideways swipe) instead of replacing whole rows.
      key={pagination ? `slot-${i}` : row.id}
      index={i}
      // The last row's bottom line is the footer's top line, or the border without a footer.
      bottomLine={i < visible.length - 1 || (!!totalKey && highlightTotal)}
      nextId={visible[i + 1]?.id}
      row={row}
      dragRows={dragRows}
      initial={entrance || settled ? "hidden" : false}
      // Explicit, so rows that stay mounted through loading go hidden and reveal again.
      animate={reveal}
      custom={{
        delay: settled ? Math.min(i, 8) * stagger * 0.5 : rowsStart + i * stagger,
        dir: exit.dir,
        kind: exit.kind,
      }}
    />,
    settings.expandable && expanded.has(row.id) && (
      <motion.tr
        key={`${row.id}:detail`}
        layout="position"
        className={cn(horizontalLines && "border-b")}
      >
        <td colSpan={leading + ordered.length + trailing} className="p-0">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration, ease: smoothEase }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 text-sm text-muted-foreground">{renderDetail?.(row)}</div>
          </motion.div>
        </td>
      </motion.tr>
    ),
  ])

  React.useEffect(() => {
    if (!inView || settled) return
    const id = window.setTimeout(
      () => setSettled(true),
      (rowsStart + visible.length * stagger + duration) * 1000
    )
    return () => window.clearTimeout(id)
    // Timed once per reveal (the first one, and again after each load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, settled])

  const body = (
    <AnimatePresence initial={false} custom={exit}>
      {bodyRows}
    </AnimatePresence>
  )

  // As many placeholder rows as real ones, each as tall, so loading doesn't resize the table.
  const skeletonRows = Math.max(1, visible.length)

  return (
    <TableContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <div className={cn("flex w-full flex-col gap-3", className)}>
          {((filterable && statusKey && statuses.length > 0) || settings.addable) && (
            <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
              {filterable && statusKey && statuses.length > 0 ? (
                <FilterChips
                  value={filter}
                  counts={statusCounts}
                  all={data.length}
                  onChange={(value) => {
                    exitAs("filter")
                    setFilter(value)
                    setPage(0)
                  }}
                />
              ) : (
                <span />
              )}
              {settings.addable && (
                <Button variant="outline" size="sm" onClick={addRow}>
                  <PlusIcon />
                  Add row
                </Button>
              )}
            </div>
          )}

          <div className="relative w-full">
            <div
              ref={wrapper}
              style={{ maxHeight: expandFullTable ? undefined : height }}
              onScroll={(event) => {
                const el = event.currentTarget
                setScrolled(el.scrollTop > 0)
                setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1)
              }}
              className={cn(
                "relative w-full",
                RADIUS_CLASS[radius],
                // The outline is a plain border, there from the start; only the inner lines draw.
                bordered && "border",
                "overflow-auto"
              )}
            >
              <HoverOverlays
                highlight={highlight}
                tone={hoverTone}
                rowBox={rowBox}
              />
              <motion.table
                ref={table}
                data-slot="table"
                className="relative w-full caption-bottom text-base"
                initial={entrance ? "hidden" : false}
                animate={reveal}
                // Re-measured on every move, so the highlight follows rows that have shifted.
                onPointerMove={(event) => {
                  pointer.current = { x: event.clientX, y: event.clientY }
                  const tr = (event.target as Element).closest<HTMLElement>("tr[data-row-id]")
                  if (tr?.dataset.rowId) hoverRowAt(tr.dataset.rowId, tr)
                }}
                onPointerLeave={() => {
                  pointer.current = null
                  setRowBox(null)
                }}
              >
                {caption && (
                  <caption className="py-4 text-sm text-muted-foreground">{caption}</caption>
                )}
                <thead data-slot="table-header">{headRow}</thead>

                {showSkeleton && (
                  <tbody data-slot="table-skeleton">
                    {Array.from({ length: skeletonRows }, (_, i) => (
                      <tr key={i} className={cn(horizontalLines && "border-b")}>
                        {Array.from({ length: leading + ordered.length + trailing }, (_, j) => (
                          <td
                            key={j}
                            className={cn(
                              "px-2 py-3 align-middle",
                              verticalLines &&
                                j < leading + ordered.length + trailing - 1 &&
                                "border-r"
                            )}
                          >
                            <div className={cn("flex items-center", removable ? "h-7" : "h-6")}>
                              <Skeleton className="h-4 w-[70%]" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
                {dragRows ? (
                  <Reorder.Group
                    as="tbody"
                    axis="y"
                    values={visible}
                    onReorder={reorderRows}
                    data-slot="table-body"
                    className={cn(
                      "[&_tr:last-child]:border-0",
                      showSkeleton && "hidden",
                      loading && !skeleton && "opacity-50"
                    )}
                  >
                    {body}
                  </Reorder.Group>
                ) : (
                  <motion.tbody
                    data-slot="table-body"
                    className={cn(
                      "[&_tr:last-child]:border-0",
                      showSkeleton && "hidden",
                      loading && !skeleton && "opacity-50"
                    )}
                  >
                    {body}
                  </motion.tbody>
                )}

                {totalKey && highlightTotal && (
                  <tfoot
                    data-slot="table-footer"
                    className={cn(highlightTotal ? "bg-muted font-bold" : "font-normal")}
                  >
                    <tr>
                      {Array.from({ length: leading }, (_, i) => (
                        <td key={`lead-${i}`} className={footClass}>
                          {footLine(i)}
                        </td>
                      ))}
                      {ordered.map((column, j) => (
                        <motion.td
                          key={column.key}
                          className={cn(footClass, "px-2 py-3 align-middle", ALIGN_CLASS[textAlign])}
                        >
                          {(column.key === totalKey || j === 0) && (
                            <LoadingCell loading={showSkeleton}>
                              {column.key === totalKey ? (
                                <NumberValue
                                  value={total}
                                  format={(v) => format(column, v)}
                                  mode={countUp}
                                  fromZero
                                  animate
                                  run={revealed}
                                  duration={duration * 2.5}
                                />
                              ) : (
                                "Total"
                              )}
                            </LoadingCell>
                          )}
                          {footLine(leading + j)}
                        </motion.td>
                      ))}
                      {Array.from({ length: trailing }, (_, i) => (
                        <td key={`trail-${i}`} className={footClass}>
                          {footLine(leading + ordered.length + i)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </motion.table>
            </div>
          </div>

          {pagination && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="flex items-center gap-1 text-muted-foreground">
                Page
                <RollingText value={String(currentPage + 1)} className="text-foreground" />
                of {pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next page"
                disabled={currentPage >= pageCount - 1}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          )}
        </div>

        {actionBar && selectable && (
          <ActionBar
            count={selected.size}
            markLabel={statuses[0]?.value}
            onMark={() => {
              if (statuses[0]) setStatus([...selected], statuses[0].value)
            }}
            onDelete={() => removeRows([...selected])}
            onClear={() => setSelected(new Set())}
          />
        )}
      </MotionConfig>
    </TableContext.Provider>
  )
}

/** Preserve content dimensions while replacing only the text/control with a placeholder. */
function LoadingCell({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className={cn(loading && "invisible")} aria-hidden={loading || undefined}>
        {children}
      </div>
      {loading && (
        <Skeleton className="absolute top-1/2 left-0 h-4 w-[70%] -translate-y-1/2" />
      )}
    </div>
  )
}

function DataTableRowView({
  ref: forwardedRef,
  index,
  bottomLine,
  nextId,
  animate,
  row,
  dragRows,
  initial,
  custom,
}: {
  ref?: React.Ref<HTMLElement>
  index: number
  bottomLine: boolean
  /** The row below, so this row's bottom line can fade when that one is hovered. */
  nextId?: string
  animate: "visible" | "hidden"
  row: DataTableRow
  dragRows: boolean
  initial: "hidden" | false
  custom: RowCustom
}) {
  const context = useTable()
  const { settings, columns, hoverRow, selected, expanded, freshId } = context
  const controls = useDragControls()
  const hovered = hoverRow === row.id
  const isSelected = selected.has(row.id)
  // A primary highlight sits under the hovered row, so its text switches to light.
  const onPrimary = hovered && settings.hoverTone === "primary" && settings.highlight !== "none"

  const variants: Variants = {
    // The row itself stays put; each cell's content slides up inside its cell (see `Reveal`).
    hidden: (c: RowCustom) =>
      c.kind === "page" && c.dir ? { opacity: 0, x: c.dir * 32 } : { opacity: 1 },
    visible: (c: RowCustom) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: settings.duration,
        ease: smoothEase,
        delay: c.delay,
        // Row cells stagger: the cells come in left to right; otherwise they rise together.
        delayChildren: settings.rowCellsStagger
          ? staggerChildren(CELL_GAP, { startDelay: c.delay })
          : c.delay,
      },
    }),
    exit: (c: RowCustom) => ({
      opacity: 0,
      ...(c.kind === "page" ? { x: -c.dir * 32 } : c.kind === "remove" ? { x: -24 } : {}),
      transition: { duration: settings.duration, ease: smoothEase },
    }),
  }

  // A newly added row flashes the primary colour and fades back.
  const ref = (node: HTMLElement | null) => {
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
    if (!node || freshId !== row.id || node.dataset.flashed) return
    node.dataset.flashed = "true"
    node.animate(
      [
        {
          backgroundColor: "color-mix(in oklch, var(--primary) 14%, transparent)",
        },
        { backgroundColor: "transparent" },
      ],
      { duration: 1400, easing: "ease-out" }
    )
  }

  const t = context.lines
  // Grid lines for the cell in column `j`: its bottom edge and, unless it's last, its right edge.
  // Lines the hover highlight covers fade out, so it reads as one solid block: this row's
  // own lines when it's hovered, and its bottom line when the row below is hovered.
  const highlighted = settings.highlight !== "none"
  const coverSelf = highlighted && hovered
  const coverBottom = highlighted && (hovered || (!!nextId && hoverRow === nextId))
  const lines = (j: number) => (
    <>
      {settings.horizontalLines && bottomLine && (
        <GridLine
          axis="x"
          delay={t.start + (index + 1 + j) * t.step}
          duration={t.step}
          faded={coverBottom}
        />
      )}
      {settings.verticalLines && j < t.columns - 1 && (
        <GridLine
          axis="y"
          delay={t.start + (index + 1 + j) * t.step}
          duration={t.step}
          faded={coverSelf}
        />
      )}
    </>
  )
  const lead = context.leading
  const dragCol = 0
  const selectCol = dragRows ? 1 : 0
  const expandCol = lead + columns.length
  const removeCol = expandCol + (settings.expandable ? 1 : 0)

  const cells = (
    <>
      {dragRows && (
        <td className="relative w-8 px-2 align-middle">
          <Reveal swapKey={row.id}>
            <button
              type="button"
              aria-label="Drag to reorder"
              onPointerDown={(event) => controls.start(event)}
              className="flex cursor-grab touch-none items-center text-muted-foreground active:cursor-grabbing"
            >
              <GripVerticalIcon className="size-4" />
            </button>
          </Reveal>
          {lines(dragCol)}
        </td>
      )}
      {settings.selectable && (
        <td className="relative w-8 px-2 align-middle">
          <Reveal swapKey={row.id}>
            <RowCheckbox
              checked={isSelected}
              label={`Select ${row.id}`}
              onToggle={(range) => context.toggleSelect(row.id, range)}
            />
          </Reveal>
          {lines(selectCol)}
        </td>
      )}
      {columns.map((column, k) => (
        <motion.td
          key={column.key}
          data-col={column.key}
          data-row={row.id}
          className={cn(
            "relative px-2 align-middle whitespace-nowrap",
            ALIGN_CLASS[settings.textAlign],
            column.className
          )}
        >
          <CellValue column={column} row={row} hovered={hovered} index={k} />
          {lines(lead + k)}
        </motion.td>
      ))}
      {settings.expandable && (
        <td className="relative w-10 px-2 align-middle">
          <Reveal swapKey={row.id}>
            <MorphChevron open={expanded.has(row.id)} className="size-3.5 text-muted-foreground" />
          </Reveal>
          {lines(expandCol)}
        </td>
      )}
      {settings.removable && (
        <td className="relative w-10 px-2 text-right align-middle">
          <Reveal swapKey={row.id}>
            <button
              type="button"
              aria-label={`Delete ${row.id}`}
              onClick={(event) => {
                event.stopPropagation()
                context.removeRows([row.id])
              }}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-[opacity,color] duration-200 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50",
                hovered ? "opacity-100" : "opacity-0"
              )}
            >
              <Trash2Icon className="size-4" />
            </button>
          </Reveal>
          {lines(removeCol)}
        </td>
      )}
    </>
  )

  const props = {
    ref,
    "data-slot": "table-row",
    "data-row-id": row.id,
    "data-selected": isSelected || undefined,
    custom,
    variants,
    initial,
    animate,
    exit: "exit",
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) =>
      context.hoverRowAt(row.id, event.currentTarget),
    onClick: settings.expandable ? () => context.toggleExpand(row.id) : undefined,
    className: cn(
      "relative transition-colors duration-300",
      settings.highlight === "none" &&
        (settings.hoverTone === "primary"
          ? "hover:bg-primary hover:text-primary-foreground [&:hover_.text-muted-foreground]:text-primary-foreground/70 [&:hover_[data-slot=status-badge]]:bg-background"
          : "hover:bg-muted/50"),
      isSelected && "bg-primary/[0.06]",
      settings.expandable && "cursor-pointer",
      onPrimary &&
        "text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/70 [&_[data-slot=status-badge]]:bg-background"
    ),
    children: cells,
  }

  return dragRows ? (
    <Reorder.Item
      as="tr"
      value={row}
      dragListener={false}
      dragControls={controls}
      {...props}
      // A solid, lifted row while dragging, so the rows it passes over don't show through.
      className={cn(
        props.className,
        "data-dragging:z-30 data-dragging:bg-background data-dragging:shadow-lg"
      )}
      onDragStart={(event) => {
        ;(event.target as Element).closest("tr")?.setAttribute("data-dragging", "")
        context.setDragging(true)
      }}
      onDragEnd={(event) => {
        ;(event.target as Element).closest("tr")?.removeAttribute("data-dragging")
        context.setDragging(false)
      }}
    />
  ) : (
    <motion.tr layout="position" {...props} />
  )
}

function CellValue({
  column,
  row,
  hovered,
  index,
}: {
  column: DataTableColumn
  row: DataTableRow
  hovered: boolean
  /** Column position, so the text roll ripples across the row. */
  index: number
}) {
  const { settings, format, revealed, settled, cycleStatus } = useTable()
  const value = row[column.key]

  let content: React.ReactNode
  if (column.kind === "status") {
    const status = settings.statuses.find((s) => s.value === value)
    content = settings.statusBadges ? (
      <StatusBadge value={String(value)} status={status} onCycle={() => cycleStatus(row.id)} />
    ) : (
      String(value)
    )
  } else if (column.kind === "number" || column.kind === "currency") {
    content = (
      <NumberValue
        value={Number(value)}
        format={(v) => format(column, v)}
        mode={settings.countUp}
        fromZero={!settled}
        animate
        run={revealed}
        duration={settings.duration * 2.5}
      />
    )
  } else {
    content = String(value)
  }
  // Text cells roll on hover, a touch later per column; numbers and status badges don't.
  if (settings.textRoll && (column.kind ?? "text") === "text") {
    content = (
      <RollText active={hovered} delay={index * 0.03}>
        {content}
      </RollText>
    )
  }

  return <Reveal swapKey={row.id}>{content}</Reveal>
}

/**
 * One edge of a cell, drawn in during the table's first reveal: a row line grows left to right
 * (scaleX 0 → 1), a column line grows top to bottom (scaleY 0 → 1). Afterwards it's just there.
 */
function GridLine({
  axis,
  delay,
  duration,
  faded = false,
  visible,
}: {
  axis: "x" | "y"
  delay: number
  duration: number
  /** Fade out, e.g. where the hover highlight covers the line. */
  faded?: boolean
  /** Override row visibility for edges that remain visible during loading. */
  visible?: boolean
}) {
  const { revealed, settled, settings } = useTable()
  const draws = settings.entrance && !settled
  const shown = axis === "x" ? { scaleX: 1 } : { scaleY: 1 }
  const hidden = axis === "x" ? { scaleX: 0 } : { scaleY: 0 }
  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bg-border transition-opacity duration-200",
        axis === "x" ? "inset-x-0 bottom-0 h-px origin-left" : "inset-y-0 right-0 w-px origin-top",
        faded && "opacity-0"
      )}
      initial={draws ? hidden : false}
      animate={(visible ?? revealed) ? shown : hidden}
      transition={{ duration, ease: "linear", delay }}
    />
  )
}

/** Cell content that slides up from the bottom edge of its own cell as the row comes in. */
function Reveal({ swapKey, children }: { swapKey?: string; children: React.ReactNode }) {
  const { settings, settled, pageDir } = useTable()
  const transition = { duration: settings.duration, ease: smoothEase }
  const preserveHeight = !settled || (settings.loading && settings.skeleton)
  // The cell's vertical padding lives inside, so a collapsed cell is truly zero height.
  // Initial and skeleton reveals keep full row heights; only the content slides in.
  // Rows added or removed after settling can still expand or collapse.
  return (
    <motion.span
      className="block overflow-hidden"
      variants={{
        hidden: { height: preserveHeight ? "auto" : 0 },
        visible: { height: "auto", transition },
        exit: { height: 0, transition },
      }}
    >
      <motion.span
        className="block py-3"
        variants={{
          hidden: { y: "100%" },
          visible: { y: "0%", transition },
          exit: { y: "100%", transition },
        }}
      >
        {settings.pagination && swapKey ? (
          <Swap swapKey={swapKey} dir={pageDir} duration={settings.duration}>
            {children}
          </Swap>
        ) : (
          children
        )}
      </motion.span>
    </motion.span>
  )
}

const swapVariants: Variants = {
  enter: (dir: number) => (dir ? { x: `${dir * 100}%`, opacity: 1 } : { x: "0%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => (dir ? { x: `${-dir * 100}%`, opacity: 1 } : { x: "0%", opacity: 0 }),
}

/**
 * When the row in a slot changes (paging), the old content swipes out sideways inside the cell
 * while the new content swipes in, left when paging forward and right when paging back. Other
 * changes cross-fade.
 */
function Swap({
  swapKey,
  dir,
  duration,
  children,
}: {
  swapKey: string
  dir: number
  duration: number
  children: React.ReactNode
}) {
  return (
    <span className="relative block overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        <motion.span
          key={swapKey}
          className="block"
          custom={dir}
          variants={swapVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration, ease: smoothEase }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Picks the number animation: rolling digits, a GSAP count, or plain text. */
function NumberValue({
  mode,
  fromZero,
  ...props
}: {
  value: number
  format: (value: number) => string
  mode: DataTableCountUp
  fromZero: boolean
  animate: boolean
  run: boolean
  duration: number
}) {
  if (mode === "off") return <span className="tabular-nums">{props.format(props.value)}</span>
  if (mode === "roll") return <RollingNumber {...props} fromZero={fromZero} />
  return <AnimatedNumber {...props} countUp={fromZero} />
}

/**
 * The formatted value with each digit on its own rolling strip, like an odometer. Digits start
 * at zero on first appearance and roll to the value; later changes roll from the old digits.
 * Keyed from the right so the ones digit stays the ones digit when the length changes.
 */
function RollingNumber({
  value,
  format,
  fromZero,
  animate,
  run,
  duration,
}: {
  value: number
  format: (value: number) => string
  fromZero: boolean
  animate: boolean
  run: boolean
  duration: number
}) {
  const reduceMotion = useReducedMotion()
  const text = format(value)
  const chars = text.split("")
  const instant = reduceMotion || !animate

  return (
    <span className="inline-flex tabular-nums">
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => {
        const key = chars.length - i
        if (!/\d/.test(char)) {
          return (
            <span key={key} aria-hidden>
              {char}
            </span>
          )
        }
        const digit = Number(char)
        return (
          <span
            key={key}
            aria-hidden
            // `overflow-clip`, not clip-path: the 20-digit strip must not count as scrollable
            // height (it left a gap under the table), and the digit keeps its text baseline.
            className="relative inline-block overflow-clip select-none"
          >
            <span className="invisible">{char}</span>
            {/* The strip holds 0–9 twice and digits rest in the second set, so on first
                appearance every digit (zeros too) spins a full turn up from the first 0.
                Later changes roll the short way within the second set. */}
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col"
              initial={fromZero ? { y: "0%" } : false}
              // Back at zero whenever the table is hidden (before the reveal, or while loading).
              animate={{ y: `${-((run ? 10 + digit : 0) / 20) * 100}%` }}
              transition={
                instant && !fromZero
                  ? { duration: 0 }
                  : // Digits settle right to left, a touch apart.
                    { duration: duration * 1.2, ease: smoothEase, delay: (key - 1) * 0.04 }
              }
            >
              {Array.from({ length: 20 }, (_, n) => (
                <span key={n}>{n % 10}</span>
              ))}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

/** Counts to its value with GSAP: from zero on first appearance, then from the previous value. */
function AnimatedNumber({
  value,
  format,
  countUp,
  animate,
  run,
  duration,
}: {
  value: number
  format: (value: number) => string
  countUp: boolean
  animate: boolean
  run: boolean
  duration: number
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const current = React.useRef(countUp ? 0 : value)
  const [initial] = React.useState(() => format(countUp ? 0 : value))

  const play = React.useEffectEvent(() => {
    const el = ref.current
    if (!el) return
    if (!run) {
      // Hidden again (loading): start from zero next time.
      if (countUp) current.current = 0
      return
    }
    const from = current.current
    if (reduceMotion || (!animate && !(countUp && from === 0 && value !== 0)) || from === value) {
      current.current = value
      el.textContent = format(value)
      return
    }
    const state = { v: from }
    return gsap.to(state, {
      v: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        current.current = state.v
        el.textContent = format(state.v)
      },
    })
  })

  React.useEffect(() => {
    const tween = play()
    return () => {
      tween?.kill()
    }
  }, [value, run])

  return (
    <span ref={ref} className="tabular-nums">
      {initial}
    </span>
  )
}

const toneClasses: Record<DataTableStatusTone, string> = {
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
  neutral: "bg-muted text-muted-foreground",
}

function StatusBadge({
  value,
  status,
  onCycle,
}: {
  value: string
  status?: DataTableStatus
  onCycle: () => void
}) {
  return (
    <button
      type="button"
      data-slot="status-badge"
      title="Click to change status"
      onClick={(event) => {
        event.stopPropagation()
        onCycle()
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring/50",
        toneClasses[status?.tone ?? "neutral"]
      )}
    >
      {status?.pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      )}
      <RollingText value={value} />
    </button>
  )
}

/** Text that rolls up to its new value when it changes. */
function RollingText({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("relative inline-grid overflow-hidden", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="block tabular-nums"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Text that rolls up to a copy of itself while `active`. */
function RollText({
  active,
  delay = 0,
  children,
}: {
  active: boolean
  delay?: number
  children: React.ReactNode
}) {
  const transition = { duration: 0.4, ease: easeOutCubic, delay }
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
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

function RowCheckbox({
  checked,
  indeterminate = false,
  label,
  onToggle,
}: {
  checked: boolean
  indeterminate?: boolean
  label: string
  onToggle: (range: boolean) => void
}) {
  const { settings } = useTable()
  const circle = settings.selectMark === "circle"
  const marked = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      // Keep shift-click from selecting text.
      onMouseDown={(event) => event.shiftKey && event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation()
        onToggle(event.shiftKey)
      }}
      className={cn(
        // The outline is an inset ring, not a border: it takes no space, so the fill paints
        // over it edge to edge with no gap. Focus uses an outline so it doesn't fight the ring.
        "relative grid size-4 place-items-center overflow-hidden ring-1 ring-inset outline-none transition-[box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50",
        // The theme's rounded-sm (6px) makes a 16px box look round; xs keeps it a square.
        circle ? "rounded-full" : "rounded-xs",
        marked ? "ring-primary" : "ring-input hover:ring-foreground/40"
      )}
    >
      <motion.span
        aria-hidden
        // Rounded like its box, so a filling checkbox never shows square corners.
        className="absolute inset-0 rounded-[inherit] bg-primary"
        initial={false}
        animate={{ scale: marked ? 1 : 0 }}
        transition={{ type: "spring", visualDuration: 0.25, bounce: 0 }}
      />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative size-full text-primary-foreground"
      >
        {/* The circle mark is the solid fill alone; the checkbox draws a tick on top. */}
        <motion.path
          d="M5 12.5 10 17.5 19 7"
          initial={false}
          animate={{
            pathLength: checked && !circle ? 1 : 0,
            opacity: checked && !circle ? 1 : 0,
          }}
          transition={{
            pathLength: {
              duration: 0.25,
              ease: "easeOut",
              delay: checked ? 0.08 : 0,
            },
            opacity: { duration: 0.1 },
          }}
        />
        <motion.path
          d="M6 12h12"
          initial={false}
          animate={{
            pathLength: indeterminate ? 1 : 0,
            opacity: indeterminate ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      </svg>
    </button>
  )
}

function FilterChips({
  value,
  counts,
  all,
  onChange,
}: {
  value: string | null
  counts: (DataTableStatus & { count: number })[]
  all: number
  onChange: (value: string | null) => void
}) {
  const id = React.useId()
  const chips = [
    { value: null, label: "All", count: all },
    ...counts.map((c) => ({ value: c.value, label: c.value, count: c.count })),
  ]
  return (
    <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1">
      {chips.map((chip) => {
        const active = chip.value === value
        return (
          <button
            key={chip.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "relative isolate flex items-center gap-1.5 rounded-full px-3 py-1 text-sm outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-chip`}
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={glide}
              />
            )}
            {chip.label}
            <span className="text-xs tabular-nums opacity-70">{chip.count}</span>
          </button>
        )
      })}
    </div>
  )
}

type RowBox = { id: string; top: number; height: number; snap: boolean }

/** Square row highlights, clipped to the scroll wrapper's rounded outer corners. */
function HoverOverlays({
  highlight,
  tone,
  rowBox,
}: {
  highlight: DataTableHighlight
  tone: DataTableHoverTone
  rowBox: RowBox | null
}) {
  // `snap` places the highlight without gliding when it appears from nothing.
  const snap = rowBox?.snap ?? true

  return (
    <>
      {highlight === "slide" && (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0",
            tone === "primary" ? "bg-primary" : "bg-muted"
          )}
          initial={false}
          animate={{
            y: rowBox?.top ?? 0,
            height: rowBox?.height ?? 0,
            opacity: rowBox ? 1 : 0,
          }}
          transition={{
            y: snap ? { duration: 0 } : glide,
            height: snap ? { duration: 0 } : glide,
            opacity: { duration: 0.2 },
          }}
        />
      )}
      {highlight === "fill" && (
        <AnimatePresence>
          {rowBox && (
            <motion.div
              key={rowBox.id}
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0",
                tone === "primary" ? "bg-primary" : "bg-muted"
              )}
              style={{ top: rowBox.top, height: rowBox.height, originY: 0 }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.3, ease: easeOutCubic }}
            />
          )}
        </AnimatePresence>
      )}
    </>
  )
}

function ActionBar({
  count,
  markLabel,
  onMark,
  onDelete,
  onClear,
}: {
  count: number
  markLabel?: string
  onMark: () => void
  onDelete: () => void
  onClear: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[4vh] z-50 flex justify-center">
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            role="toolbar"
            aria-label="Selected rows"
            className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background py-1.5 pr-1.5 pl-4 text-sm shadow-lg"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", visualDuration: 0.35, bounce: 0.2 }}
          >
            <span className="flex items-center gap-1">
              <RollingText value={String(count)} className="font-medium" />
              selected
            </span>
            {markLabel && (
              <Button variant="ghost" size="sm" className="rounded-full" onClick={onMark}>
                Mark {markLabel.toLowerCase()}
              </Button>
            )}
            <Button variant="destructive" size="sm" className="rounded-full" onClick={onDelete}>
              <Trash2Icon />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Clear selection"
              onClick={onClear}
            >
              <XIcon />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export {
  DataTable,
  type DataTableProps,
  type DataTableColumn,
  type DataTableRow,
  type DataTableStatus,
  type DataTableHighlight,
  type DataTableCountUp,
  type DataTableDrag,
  type DataTableSelectMark,
  type DataTableHoverTone,
  type DataTableRadius,
  type DataTableAlign,
}
