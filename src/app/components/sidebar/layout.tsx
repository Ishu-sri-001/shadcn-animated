import { HpxSidebarShell } from "./sidebar-shell"
import { HpxApiReference } from "@/components/api-reference"

export default function SidebarLayout({ children }: LayoutProps<"/components/sidebar">) {
  return (
    <HpxSidebarShell>
      {children}
      <HpxApiReference slug="sidebar" />
    </HpxSidebarShell>
  )
}
