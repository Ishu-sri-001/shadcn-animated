import { ChoiceDemo } from "./choice-demo"

export default function ChoicePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Checkbox &amp; Radio</h1>
        <p className="text-sm text-muted-foreground">
          One component for both. <code>type=&quot;checkbox&quot;</code> allows any number of
          choices; <code>type=&quot;radio&quot;</code> allows exactly one.
        </p>
      </div>

      <ChoiceDemo />
    </div>
  )
}
