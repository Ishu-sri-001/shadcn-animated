import { HpxHoverCardDemo } from "./hover-card-demo"

export default function HoverCardPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Hover Card</h1>
        <p className="text-sm text-muted-foreground">
          A preview that appears when you hover a link, so you can peek without leaving the page.
        </p>
      </div>

      <HpxHoverCardDemo />
    </div>
  )
}
