"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-hpx-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border hpx-horizontal:h-px hpx-horizontal:w-full hpx-vertical:w-px hpx-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator as HpxSeparator }
