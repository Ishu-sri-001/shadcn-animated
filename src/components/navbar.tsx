import { AnimatedLink, AnimatedLinkText } from "@/components/animated-link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <AnimatedLink href="/" className="font-semibold">
          <AnimatedLinkText>shadcn-animated</AnimatedLinkText>
        </AnimatedLink>
        <ThemeToggle />
      </nav>
    </header>
  )
}
