/**
 * The plain slider the controls panel uses. It is a plain copy of the base slider, kept
 * separate from `ui/slider.tsx` so animating that component can never disturb the panel
 * that every showcase page depends on.
 */
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

function ControlsSlider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("hpx-horizontal:w-full hpx-vertical:h-full", className)}
      data-hpx-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none hpx-disabled:opacity-50 hpx-vertical:h-full hpx-vertical:min-h-40 hpx-vertical:w-auto hpx-vertical:flex-col">
        <SliderPrimitive.Track
          data-hpx-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none hpx-horizontal:h-1 hpx-horizontal:w-full hpx-vertical:h-full hpx-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-hpx-slot="slider-range"
            className="bg-primary select-none hpx-horizontal:h-full hpx-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-hpx-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-background ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { ControlsSlider as HpxControlsSlider }
