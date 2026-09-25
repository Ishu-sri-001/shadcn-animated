import { SidebarShell } from "./sidebar-shell"

// Outside the (default) group, so this route skips the centred component
// layout and fills the page like a real app.
export default function SidebarLayout({ children }: LayoutProps<"/components/sidebar">) {
  return <SidebarShell>{children}</SidebarShell>
}
