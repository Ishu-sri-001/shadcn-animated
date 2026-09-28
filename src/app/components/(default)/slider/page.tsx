import { SliderDemo } from "./slider-demo"

export default function SliderPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Slider</h1>
        <p className="text-sm text-muted-foreground">
          Pick a value, or a range, with a fill that springs after the thumb.
        </p>
      </div>

      <SliderDemo />
    </div>
  )
}
