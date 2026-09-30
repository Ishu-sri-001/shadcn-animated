import { HpxTooltipDemo } from "./tooltip-demo"

export default function TooltipPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tooltip</h1>
        <p className="text-sm text-muted-foreground">
          A tooltip that follows the cursor with a bit of weight, or sits on the element and reshapes as you move
          between controls.
        </p>
      </div>

      <HpxTooltipDemo />
    </div>
  )
}
