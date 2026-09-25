import { RadioDemo } from "./radio-demo"

export default function RadioPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Radio</h1>
        <p className="text-sm text-muted-foreground">
          Pick exactly one option. The dot glides to the new choice, and arrow keys move it.
        </p>
      </div>

      <RadioDemo />
    </div>
  )
}
