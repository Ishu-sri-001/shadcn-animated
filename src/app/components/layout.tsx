import { ComponentsNav } from "./components-nav"
import { ApiReferenceProvider } from "@/components/api-reference-visibility"

export default function ComponentsRootLayout({ children }: LayoutProps<"/components">) {
  return (
    <ApiReferenceProvider showApiReference={true}>
      {children}
      <ComponentsNav />
    </ApiReferenceProvider>
  )
}
