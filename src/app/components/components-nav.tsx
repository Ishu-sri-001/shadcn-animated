"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, type Variants } from "motion/react"

import { registry } from "@/components/registry"
import {
  HpxSidebar,
  HpxSidebarContent,
  HpxSidebarGroup,
  HpxSidebarGroupContent,
  HpxSidebarHeader,
  HpxSidebarMenu,
  HpxSidebarMenuButton,
  HpxSidebarMenuItem,
  HpxSidebarProvider,
  HpxSidebarTrigger,
  useHpxSidebar,
} from "@/components/ui/sidebar"

const openSpring = { type: "spring", visualDuration: 0.3, bounce: 0.28 } as const
const closeSpring = { type: "spring", visualDuration: 0.4, bounce: 0 } as const

const listVariants: Variants = {
  open: { transition: { delayChildren: 0.3, staggerChildren: 0.02 } },
  closed: { transition: { staggerChildren: 0.01, staggerDirection: -1 } },
}

const itemVariants: Variants = {
  open: { opacity: 1, x: 0, transition: { type: "spring", visualDuration: 0.5, bounce: 0.2 } },
  closed: { opacity: 0, x: -12, transition: { duration: 0.15 } },
}

function NavPanel() {
  const pathname = usePathname()
  const { isMobile, open, openMobile, setOpen, setOpenMobile } = useHpxSidebar()
  const isOpen = isMobile ? openMobile : open
  const state = isOpen ? "open" : "closed"

  const close = React.useCallback(() => {
    setOpen(false)
    setOpenMobile(false)
  }, [setOpen, setOpenMobile])

  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  return (
    <>
      <HpxSidebarTrigger className="fixed top-[3.75rem] left-2 z-50 border bg-background shadow-xs" />
      <motion.div
        initial={false}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        transition={isOpen ? openSpring : closeSpring}
        inert={!isOpen}
        className={
          isOpen
            ? "fixed top-14 left-0 z-40 h-[calc(100svh-3.5rem)] w-(--sidebar-width) shadow-xl max-md:w-[80vw]"
            : "fixed top-14 left-0 z-40 h-[calc(100svh-3.5rem)] w-(--sidebar-width) max-md:w-[80vw]"
        }
      >
        {/* Fills the gap the spring overshoot exposes */}
        <div className="absolute inset-y-0 right-full w-[30vw] bg-sidebar" />
        <HpxSidebar collapsible="none" className="h-full w-full border-r">
          <HpxSidebarHeader className="h-12 justify-center pl-12">
            <motion.span
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -8 }}
              transition={{ delay: isOpen ? 0.2 : 0, duration: 0.3 }}
              className="text-sm font-medium"
            >
              Components
            </motion.span>
          </HpxSidebarHeader>
          <HpxSidebarContent>
            <HpxSidebarGroup>
              <HpxSidebarGroupContent>
                <motion.div initial={false} animate={state} variants={listVariants}>
                  <HpxSidebarMenu>
                    {registry.map((item) => (
                      <HpxSidebarMenuItem key={item.slug}>
                        <motion.div variants={itemVariants}>
                          <HpxSidebarMenuButton
                            isActive={pathname === `/components/${item.slug}`}
                            render={<Link href={`/components/${item.slug}`} onClick={close} />}
                          >
                            <span>{item.name}</span>
                          </HpxSidebarMenuButton>
                        </motion.div>
                      </HpxSidebarMenuItem>
                    ))}
                  </HpxSidebarMenu>
                </motion.div>
              </HpxSidebarGroupContent>
            </HpxSidebarGroup>
          </HpxSidebarContent>
        </HpxSidebar>
      </motion.div>
    </>
  )
}

export function HpxComponentsNav() {
  const pathname = usePathname()
  // The sidebar page has its own sidebar
  if (pathname.startsWith("/components/sidebar")) return null

  return (
    <HpxSidebarProvider defaultOpen={false} className="contents">
      <NavPanel />
    </HpxSidebarProvider>
  )
}
