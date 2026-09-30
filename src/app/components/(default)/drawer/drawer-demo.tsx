"use client"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import {
  HpxDrawer,
  HpxDrawerClose,
  HpxDrawerContent,
  HpxDrawerDescription,
  HpxDrawerFooter,
  HpxDrawerHeader,
  HpxDrawerIndent,
  HpxDrawerProvider,
  HpxDrawerTitle,
  HpxDrawerTrigger,
  type HpxDrawerOpenAnimation,
} from "@/components/ui/drawer"
import { HpxRollText } from "@/components/ui/hover-effects"

const roasts = [
  { name: "Ethiopia Guji", notes: "Jasmine, peach, black tea" },
  { name: "Colombia Huila", notes: "Red apple, caramel, cocoa" },
  { name: "Kenya Nyeri", notes: "Blackcurrant, grapefruit" },
  { name: "House blend", notes: "Chocolate, hazelnut" },
]

const SIDES = { bottom: "down", top: "up", left: "left", right: "right" } as const

const controls = {
  textRoll: { group: "Button", type: "checkbox", label: "Text roll on hover", value: true },
  fillOnHover: { group: "Button", type: "checkbox", label: "Fill on hover", value: false },

  side: {
    group: "Drawer",
    type: "select",
    label: "Side",
    value: "bottom",
    options: [
      { label: "Bottom", value: "bottom" },
      { label: "Top", value: "top" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
  },
  showSwipeHandle: { group: "Drawer", type: "checkbox", label: "Swipe handle", value: true },

  openAnimation: {
    group: "Motion",
    type: "select",
    label: "Opens with",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fade", value: "fade" },
    ],
  },
  springy: { disabled: (v) => v.openAnimation === "fade", group: "Motion", type: "checkbox", label: "Springy", value: true },
  duration: {
    group: "Motion",
    type: "slider",
    label: "Duration",
    value: 0.5,
    min: 0.2,
    max: 1.2,
    step: 0.05,
    unit: "s",
  },
  bounce: { disabled: (v) => !v.springy || v.openAnimation === "fade", group: "Motion", type: "slider", label: "Bounce", value: 0.2, min: 0, max: 0.6, step: 0.05 },
  stagger: {
    group: "Motion",
    type: "slider",
    label: "Item stagger",
    value: 0.04,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },
  swipeTilt: { group: "Motion", type: "checkbox", label: "Tilt while swiping", value: false },
  scaleBackground: { group: "Motion", type: "checkbox", label: "Shrink page behind", value: true },
} satisfies HpxControlSchema

export function HpxDrawerDemo() {
  const panel = useHpxControls(controls)
  const { side, scaleBackground, openAnimation, ...options } = panel.values
  const direction = SIDES[side as keyof typeof SIDES]

  return (
    <HpxDrawerProvider>
      <div className="relative isolate rounded-2xl">
        <HpxDrawerIndent scale={scaleBackground} className="flex flex-col gap-6 py-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Drawer</h1>
            <p className="text-sm text-muted-foreground">
              A panel that slides in from the edge of the screen and can be swiped away.
            </p>
          </div>

          <div className="flex min-h-[40vh] items-center justify-center rounded-lg border">
            <HpxDrawer
              key={side}
              {...options}
              swipeDirection={direction}
              openAnimation={openAnimation as HpxDrawerOpenAnimation}
            >
              <HpxDrawerTrigger
                className="h-auto px-5 py-2.5 text-lg"
                render={<HpxButton variant="outline" />}
              >
                Choose a roast
              </HpxDrawerTrigger>
              <HpxDrawerContent>
                <div className="flex w-full flex-1 flex-col">
                  <HpxDrawerHeader>
                    <HpxDrawerTitle>Next box</HpxDrawerTitle>
                    <HpxDrawerDescription>Pick the roast for Friday&apos;s delivery.</HpxDrawerDescription>
                  </HpxDrawerHeader>
                  <div className="flex flex-col gap-3 px-6 py-2">
                    {roasts.map((roast) => (
                      <HpxDrawerClose
                        key={roast.name}
                        render={
                          // Hover leaves the background alone; the text rolls, like the trigger.
                          <HpxButton
                            variant="outline"
                            data-drawer-item
                            className="group/roll h-auto justify-between py-3 transition-[color,background-color,border-color] hover:bg-background hover:text-foreground dark:hover:bg-input/30"
                          />
                        }
                      >
                        <span className="font-medium">
                          <HpxRollText>{roast.name}</HpxRollText>
                        </span>
                        <span className="text-muted-foreground">
                          <HpxRollText>{roast.notes}</HpxRollText>
                        </span>
                      </HpxDrawerClose>
                    ))}
                  </div>
                  <HpxDrawerFooter>
                    <HpxDrawerClose
                      render={
                        <HpxButton
                          variant="ghost"
                          data-drawer-item
                          className="group/line transition-[color,background-color] hover:bg-transparent dark:hover:bg-transparent"
                        />
                      }
                    >
                      {/* An underline draws in from the left on hover and leaves to the right. */}
                      <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out group-hover/line:after:origin-left group-hover/line:after:scale-x-100 group-focus-visible/line:after:origin-left group-focus-visible/line:after:scale-x-100 motion-reduce:after:transition-none">
                        Close
                      </span>
                    </HpxDrawerClose>
                  </HpxDrawerFooter>
                </div>
              </HpxDrawerContent>
            </HpxDrawer>
          </div>
          <p className="text-sm text-muted-foreground">
            Tip: drag the drawer back towards its edge to close it.
          </p>
        </HpxDrawerIndent>
      </div>

      <HpxControlsPanel title="Drawer" {...panel} />
    </HpxDrawerProvider>
  )
}
