import { FieldDemo } from "./field-demo"

export default function FieldPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Field</h1>
        <p className="text-sm text-muted-foreground">
          Labels, hints and error messages that hold a form&apos;s inputs together.
        </p>
      </div>

      <FieldDemo />
    </div>
  )
}
