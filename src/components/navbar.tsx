import { HpxAnimatedLink, HpxAnimatedLinkText } from "@/components/animated-link"
import { HpxThemeToggle } from "@/components/theme-toggle"

export function HpxNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <HpxAnimatedLink href="/" className="font-semibold">
          <HpxAnimatedLinkText>Hpx Animated</HpxAnimatedLinkText>
        </HpxAnimatedLink>
        <HpxThemeToggle />
      </nav>
    </header>
  )
}
