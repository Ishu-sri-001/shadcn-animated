import { AnimatedLink, AnimatedLinkText } from "@/components/animated-link"

export default function ComponentsLayout({
  children,
}: LayoutProps<"/components">) {
  return (
    <main className="mx-auto flex w-full max-w-[80vw] flex-col gap-4 px-4 py-8">
      <AnimatedLink href="/" className="text-sm text-muted-foreground hover:text-foreground">

        <AnimatedLinkText>All components</AnimatedLinkText>
      </AnimatedLink>
      <div>{children}</div>
    </main>
  )
}
