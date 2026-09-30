import { HpxButtonDemo } from "./button-demo"

export default function ButtonPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Button</h1>
        <p className="text-sm text-muted-foreground">
          A button with hover effects: a dot that fills from the pointer, letters that roll or scramble, and a line that draws underneath.
        </p>
      </div>

      <HpxButtonDemo />
    </div>
  )
}
