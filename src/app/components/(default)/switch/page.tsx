import { SwitchDemo } from "./switch-demo"

export default function SwitchPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Switch</h1>
        <p className="text-sm text-muted-foreground">
          Turn a setting on or off in one click.
        </p>
      </div>

      <SwitchDemo />
    </div>
  )
}
