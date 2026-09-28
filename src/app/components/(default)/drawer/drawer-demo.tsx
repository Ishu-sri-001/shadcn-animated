"use client"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerIndent,
  DrawerProvider,
  DrawerTitle,
  DrawerTrigger,
  type DrawerOpenAnimation,
} from "@/components/ui/drawer"
import { RollText } from "@/components/ui/hover-effects"

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
  snapPoints: { group: "Drawer", type: "checkbox", label: "Snap to half / full (bottom only)", value: false },
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
  springy: { group: "Motion", type: "checkbox", label: "Springy", value: true },
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
  bounce: { group: "Motion", type: "slider", label: "Bounce", value: 0.2, min: 0, max: 0.6, step: 0.05 },
  stagger: {
    group: "Motion",
    type: "slider",
    label: "Content stagger",
    value: 0.04,
    min: 0,
    max: 0.15,
    step: 0.01,
    unit: "s",
  },
  swipeTilt: { group: "Motion", type: "checkbox", label: "Tilt while swiping", value: false },
  scaleBackground: { group: "Motion", type: "checkbox", label: "Shrink page behind", value: true },
} satisfies ControlSchema

export function DrawerDemo() {
  const panel = useControls(controls)
  const { side, snapPoints, scaleBackground, openAnimation, ...options } = panel.values
  const direction = SIDES[side as keyof typeof SIDES]
  // Snap points only apply to bottom sheets.
  const snaps = snapPoints && side === "bottom" ? [0.5, 1] : undefined

  return (
    <DrawerProvider>
      <div className="relative isolate rounded-2xl">
        <DrawerIndent scale={scaleBackground} className="flex flex-col gap-6 py-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Drawer</h1>
            <p className="text-sm text-muted-foreground">
              A panel that slides in from the edge of the screen and can be swiped away.
            </p>
          </div>

          <div className="flex min-h-[40vh] items-center justify-center rounded-lg border">
            <Drawer
              key={`${side}-${snaps ? "snap" : "free"}`}
              {...options}
              swipeDirection={direction}
              snapPoints={snaps}
              openAnimation={openAnimation as DrawerOpenAnimation}
            >
              <DrawerTrigger
                className="h-auto px-5 py-2.5 text-lg"
                render={<Button variant="outline" />}
              >
                Choose a roast
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex w-full flex-1 flex-col">
                  <DrawerHeader>
                    <DrawerTitle>Next box</DrawerTitle>
                    <DrawerDescription>Pick the roast for Friday&apos;s delivery.</DrawerDescription>
                  </DrawerHeader>
                  <div className="flex flex-col gap-2 p-4">
                    {roasts.map((roast) => (
                      <DrawerClose
                        key={roast.name}
                        render={
                          // Hover leaves the background alone; the text rolls, like the trigger.
                          <Button
                            variant="outline"
                            className="group/roll h-auto justify-between py-3 hover:bg-background hover:text-foreground dark:hover:bg-input/30"
                          />
                        }
                      >
                        <span data-drawer-text className="font-medium">
                          <RollText>{roast.name}</RollText>
                        </span>
                        <span data-drawer-text className="text-muted-foreground">
                          <RollText>{roast.notes}</RollText>
                        </span>
                      </DrawerClose>
                    ))}
                  </div>
                  <DrawerFooter>
                    <DrawerClose
                      render={
                        <Button
                          variant="ghost"
                          className="group/line hover:bg-transparent dark:hover:bg-transparent"
                        />
                      }
                    >
                      {/* An underline draws in from the left on hover and leaves to the right. */}
                      <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out group-hover/line:after:origin-left group-hover/line:after:scale-x-100 group-focus-visible/line:after:origin-left group-focus-visible/line:after:scale-x-100 motion-reduce:after:transition-none">
                        Cancel
                      </span>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <p className="text-sm text-muted-foreground">
            Tip: drag the drawer back towards its edge to close it.
          </p>
        </DrawerIndent>
      </div>

      <ControlsPanel title="Drawer" {...panel} />
    </DrawerProvider>
  )
}
