import { HpxDialogDemo } from "./dialog-demo"

export default function DialogPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dialog</h1>
        <p className="text-sm text-muted-foreground">
          A window over the page that asks for a decision before you carry on.
        </p>
      </div>

      <HpxDialogDemo />
    </div>
  )
}
