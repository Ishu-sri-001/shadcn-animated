import { CommandDemo } from "./command-demo"

export default function CommandPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Command</h1>
        <p className="text-sm text-muted-foreground">
          Search and run commands from the keyboard. Click the search box for a dropdown, or press ⌘K for the palette.
        </p>
      </div>

      <CommandDemo />
    </div>
  )
}
