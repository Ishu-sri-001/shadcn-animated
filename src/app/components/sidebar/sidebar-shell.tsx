"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, ChevronRightIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "cn"
import { AnimatePresence, motion } from "motion/react"

import { CalendarIcon } from "@/components/animated-icons/calendar-icon"
import { CoffeeIcon } from "@/components/animated-icons/coffee-icon"
import { DropletsIcon } from "@/components/animated-icons/droplets-icon"
import { FolderIcon } from "@/components/animated-icons/folder-icon"
import { HouseIcon } from "@/components/animated-icons/house-icon"
import { InboxIcon } from "@/components/animated-icons/inbox-icon"
import { SearchIcon } from "@/components/animated-icons/search-icon"
import { SettingsIcon } from "@/components/animated-icons/settings-icon"
import { UtensilsIcon } from "@/components/animated-icons/utensils-icon"
import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGlideHighlight,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useGlide,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const spring = { type: "spring", visualDuration: 0.35, bounce: 0.2 } as const

const ICON_SIZE = "1.25rem"

const controls = {
  resizable: { group: "Sidebar", type: "checkbox", label: "Drag edge to resize", value: false },
  highlightTone: {
    group: "Active item",
    type: "select",
    label: "Highlight",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
    ],
  },
  itemRadius: {
    group: "Active item",
    type: "slider",
    label: "Roundness",
    value: 0,
    min: 0,
    max: 1.2,
    step: 0.1,
    unit: "vw",
  },
  slidingHighlight: {
    group: "Active item",
    type: "checkbox",
    label: "Slide to new item",
    value: true,
  },
  activeIndicator: {
    group: "Active item",
    type: "select",
    label: "Indicator",
    value: "bar",
    options: [
      { label: "Bar", value: "bar" },
      { label: "Pulsing dot", value: "dot" },
      { label: "None", value: "none" },
    ],
  },
  pressSquish: { group: "Interaction", type: "checkbox", label: "Press squish", value: false },
  textRoll: { group: "Interaction", type: "checkbox", label: "Text roll on hover", value: false },
  springTooltips: {
    group: "Interaction",
    type: "checkbox",
    label: "Springy tooltips",
    value: false,
  },
  rollingBadge: { group: "Badges", type: "checkbox", label: "Rolling badge", value: true },
  teamSwitcher: { group: "Header", type: "checkbox", label: "Team switcher", value: false },
  spinTrigger: { group: "Header", type: "checkbox", label: "Spin toggle on hover", value: false },
  breadcrumb: { group: "Header", type: "checkbox", label: "Breadcrumb bar", value: true },
  scaleContent: { group: "Page", type: "checkbox", label: "Scale with fade", value: true },
} satisfies ControlSchema

const InboxContext = React.createContext<{ receive: () => void } | null>(null)

export function useInbox() {
  const inbox = React.useContext(InboxContext)
  if (!inbox) throw new Error("useInbox must be used within SidebarShell.")
  return inbox
}

const ActivePageContext = React.createContext<{
  page: string
  unread: number
  scaleContent: boolean
} | null>(null)

export function useActivePage() {
  const active = React.useContext(ActivePageContext)
  if (!active) throw new Error("useActivePage must be used within SidebarShell.")
  return active
}

type IconHandle = { startAnimation: () => void; stopAnimation: () => void }
type AnimatedIcon = React.ComponentType<{ size?: number | string; ref?: React.Ref<IconHandle> }>

function useIconTrigger() {
  const icon = React.useRef<IconHandle>(null)
  const play = () => icon.current?.startAnimation()
  const stop = () => icon.current?.stopAnimation()
  return { icon, handlers: { onMouseEnter: play, onMouseLeave: stop, onFocus: play, onBlur: stop } }
}

function NavButton({
  icon: Icon,
  children,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton> & { icon: AnimatedIcon }) {
  const { icon, handlers } = useIconTrigger()
  return (
    <SidebarMenuButton {...handlers} {...props}>
      <Icon ref={icon} size={ICON_SIZE} />
      {children}
    </SidebarMenuButton>
  )
}

const teams: { name: string; plan: string; icon: AnimatedIcon }[] = [
  { name: "Bean & Co.", plan: "Roastery", icon: CoffeeIcon },
  { name: "Leaf House", plan: "Tea room", icon: DropletsIcon },
  { name: "Crumb", plan: "Bakery", icon: UtensilsIcon },
]

type Team = (typeof teams)[number]

function TeamLogo({ team, iconRef }: { team: Team; iconRef?: React.Ref<IconHandle> }) {
  const Icon = team.icon
  return <Icon ref={iconRef} size={ICON_SIZE} />
}

function TeamOption({
  team,
  selected,
  index,
  onSelect,
}: {
  team: Team
  selected: boolean
  index: number
  onSelect: () => void
}) {
  const { icon, handlers } = useIconTrigger()
  return (
    <motion.button
      type="button"
      data-team-option
      onClick={onSelect}
      {...handlers}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.04 + index * 0.04 }}
      className={cn(
        "flex items-center gap-2 rounded-(--sidebar-item-radius) px-2 py-1.5 text-left text-sm transition-colors duration-300 outline-none",
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-md border">
        <TeamLogo team={team} iconRef={icon} />
      </span>
      <span className="flex-1">{team.name}</span>
      {selected && <CheckIcon className="size-4" />}
    </motion.button>
  )
}

function TeamIdentity({ team, iconRef }: { team: Team; iconRef?: React.Ref<IconHandle> }) {
  return (
    <>
      <span className="relative flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={team.name}
            className="flex"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={spring}
          >
            <TeamLogo team={team} iconRef={iconRef} />
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative flex flex-1 flex-col gap-0.5 overflow-hidden leading-none">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={team.name}
            className="flex flex-col gap-0.5"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={spring}
          >
            <span className="truncate font-medium">{team.name}</span>
            <span className="truncate text-xs text-muted-foreground">{team.plan}</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}

const noFill =
  "active:bg-transparent active:text-sidebar-foreground data-open:hover:bg-transparent data-open:hover:text-sidebar-foreground"
const mutedFill =
  "hover:bg-sidebar-accent active:bg-sidebar-accent active:text-sidebar-foreground data-open:bg-sidebar-accent data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-foreground"

function TeamHeader({ switcher }: { switcher: boolean }) {
  const [team, setTeam] = React.useState<Team>(teams[0])
  const [open, setOpen] = React.useState(false)
  const { icon, handlers } = useIconTrigger()
  const {
    container: glideList,
    box: glideBox,
    handlers: glideHandlers,
  } = useGlide<HTMLDivElement>("[data-team-option]")

  const content = (
    <>
      <TeamIdentity team={team} iconRef={icon} />
      <motion.span
        className="flex"
        animate={{ rotate: switcher && open ? 180 : 0 }}
        transition={spring}
      >
        <ChevronsUpDownIcon />
      </motion.span>
    </>
  )

  if (!switcher) {
    return (
      <SidebarMenuButton
        size="lg"
        tooltip={team.name}
        data-no-glide
        className={cn(noFill, "cursor-default")}
        {...handlers}
      >
        {content}
      </SidebarMenuButton>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<SidebarMenuButton size="lg" data-no-glide className={mutedFill} {...handlers} />}
      >
        {content}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        positionerClassName="z-70"
        className="w-(--anchor-width) min-w-56 gap-1 p-1.5 duration-200"
      >
        <span className="px-2 py-1 text-xs text-muted-foreground">Teams</span>
        <div ref={glideList} className="relative isolate flex flex-col gap-1" {...glideHandlers}>
          <SidebarGlideHighlight box={glideBox} className="bg-muted" />
          {teams.map((t, i) => (
            <TeamOption
              key={t.name}
              team={t}
              index={i}
              selected={t.name === team.name}
              onSelect={() => {
                setTeam(t)
                setOpen(false)
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function HeaderSearch() {
  const [openWidth, setOpenWidth] = React.useState(0)
  const open = openWidth > 0
  const [query, setQuery] = React.useState("")
  const input = React.useRef<HTMLInputElement>(null)
  const icon = React.useRef<IconHandle>(null)

  const close = () => {
    setOpenWidth(0)
    setQuery("")
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: open ? openWidth : 32 }}
      transition={spring}
      className={
        open
          ? "flex h-8 shrink-0 items-center overflow-hidden rounded-md border bg-background transition-colors"
          : "flex h-8 shrink-0 items-center overflow-hidden rounded-md border border-transparent transition-colors"
      }
    >
      <button
        type="button"
        aria-label="Search"
        aria-expanded={open}
        onMouseEnter={() => icon.current?.startAnimation()}
        onMouseLeave={() => icon.current?.stopAnimation()}
        onClick={() => {
          if (open) {
            input.current?.focus()
            return
          }
          setOpenWidth(Math.min(256, window.innerWidth * 0.55))
          icon.current?.startAnimation()
          requestAnimationFrame(() => input.current?.focus())
        }}
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <SearchIcon ref={icon} size={ICON_SIZE} />
      </button>
      <input
        ref={input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && close()}
        // Closes when left empty.
        onBlur={() => query === "" && setOpenWidth(0)}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        placeholder="Search…"
        className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </motion.div>
  )
}

function Breadcrumb({ page }: { page: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Components
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="relative inline-flex overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={page}
            className="font-medium whitespace-nowrap"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={spring}
          >
            {page}
          </motion.span>
        </AnimatePresence>
      </span>
    </nav>
  )
}

const nav = [
  { title: "Home", icon: HouseIcon },
  { title: "Inbox", icon: InboxIcon },
  { title: "Calendar", icon: CalendarIcon },
]

const projects = ["Saturday roast", "Oat milk supplier", "New cups"]

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const panel = useControls(controls)
  const { teamSwitcher, breadcrumb, activeIndicator, highlightTone, scaleContent, ...options } =
    panel.values
  const [active, setActive] = React.useState("Home")
  const [unread, setUnread] = React.useState(4)
  const [projectsOpen, setProjectsOpen] = React.useState(true)
  const inbox = React.useMemo(() => ({ receive: () => setUnread((n) => n + 1) }), [])

  const go = (page: string) => {
    setActive(page)
    // Opening the inbox reads everything.
    if (page === "Inbox") setUnread(0)
  }

  return (
    <InboxContext.Provider value={inbox}>
      <ActivePageContext.Provider value={{ page: active, unread, scaleContent }}>
        <TooltipProvider>
          <SidebarProvider
            className="min-h-[calc(100svh-3.5rem)]"
            activeIndicator={activeIndicator as "bar" | "dot" | "none"}
            highlightTone={highlightTone as "primary" | "muted"}
            {...options}
          >
            <Sidebar collapsible="icon" className="z-60">
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <TeamHeader switcher={teamSwitcher} />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>

              <SidebarContent>
                <SidebarGroup label="Platform">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {nav.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <NavButton
                            icon={item.icon}
                            isActive={active === item.title}
                            tooltip={item.title}
                            onClick={() => go(item.title)}
                          >
                            <span>{item.title}</span>
                          </NavButton>
                          {item.title === "Inbox" && (
                            <AnimatePresence>
                              {unread > 0 && (
                                <SidebarMenuBadge key="badge">{unread}</SidebarMenuBadge>
                              )}
                            </AnimatePresence>
                          )}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup label="Projects">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <NavButton
                          icon={FolderIcon}
                          tooltip="Projects"
                          aria-expanded={projectsOpen}
                          onClick={() => setProjectsOpen((o) => !o)}
                        >
                          <span className="flex-1">Projects</span>
                          <motion.span
                            className="flex"
                            animate={{ rotate: projectsOpen ? 90 : 0 }}
                            transition={spring}
                          >
                            <ChevronRightIcon />
                          </motion.span>
                        </NavButton>
                        <SidebarMenuSub open={projectsOpen}>
                          {projects.map((project) => (
                            <SidebarMenuSubItem key={project}>
                              <SidebarMenuSubButton
                                isActive={active === project}
                                onClick={() => go(project)}
                              >
                                <span>{project}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavButton
                      icon={SettingsIcon}
                      isActive={active === "Settings"}
                      tooltip="Settings"
                      onClick={() => go("Settings")}
                    >
                      <span>Settings</span>
                    </NavButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>

            <SidebarInset>
              {breadcrumb ? (
                <header className="sticky top-14 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur">
                  <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger />
                    <Breadcrumb page={active} />
                  </div>
                  <HeaderSearch />
                </header>
              ) : (
                <div className="sticky top-14 z-10 h-0">
                  <SidebarTrigger className="m-3 border bg-background shadow-xs" />
                </div>
              )}
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8 max-md:px-4">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>

        <ControlsPanel title="Sidebar" {...panel} />
      </ActivePageContext.Provider>
    </InboxContext.Provider>
  )
}
