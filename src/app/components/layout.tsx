import { HpxComponentsNav } from "./components-nav"
import { HpxApiReferenceProvider } from "@/components/api-reference-visibility"

export default function ComponentsRootLayout({ children }: LayoutProps<"/components">) {
  return (
    <HpxApiReferenceProvider showApiReference={true}>
      {children}
      <HpxComponentsNav />
    </HpxApiReferenceProvider>
  )
}
