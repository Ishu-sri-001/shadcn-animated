import { SidebarShell } from "./sidebar-shell"

export default function SidebarLayout({ children }: LayoutProps<"/components/sidebar">) {
  return <SidebarShell>{children}</SidebarShell>
}
