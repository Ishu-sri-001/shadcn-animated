import { Button } from "@/components/ui/button"

export default function ButtonPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-semibold">Button</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Displays a button or a component that looks like a button.
      </p>
      <div className="mt-6 flex min-h-48 flex-wrap items-center justify-center gap-3 rounded-lg border p-8">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  )
}
