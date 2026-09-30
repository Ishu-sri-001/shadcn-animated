import { SidebarShell } from "./sidebar-shell"
import { ApiReference } from "@/components/api-reference"

export default function SidebarLayout({ children }: LayoutProps<"/components/sidebar">) {
  return (
    <SidebarShell>
      {children}
      <ApiReference slug="sidebar" />
    </SidebarShell>
  )
}
