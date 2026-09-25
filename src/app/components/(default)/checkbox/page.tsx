import { CheckboxDemo } from "./checkbox-demo"

export default function CheckboxPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Checkbox</h1>
        <p className="text-sm text-muted-foreground">
          Pick any number of options. Includes select all and deselect all, shift-click ranges, and
          minimum and maximum limits.
        </p>
      </div>

      <CheckboxDemo />
    </div>
  )
}
