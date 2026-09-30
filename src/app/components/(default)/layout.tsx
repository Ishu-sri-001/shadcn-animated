import { HpxAnimatedLink, HpxAnimatedLinkText } from "@/components/animated-link"

export default function ComponentsLayout({
  children,
}: LayoutProps<"/components">) {
  return (
    <main className="mx-auto flex w-full max-w-[80vw] flex-col gap-4 px-4 py-8">
      <HpxAnimatedLink href="/" className="text-sm text-muted-foreground hover:text-foreground">

        <HpxAnimatedLinkText>All components</HpxAnimatedLinkText>
      </HpxAnimatedLink>
      <div>{children}</div>
    </main>
  )
}
