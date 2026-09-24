"use client"

import {
  ControlsPanel,
  useControls,
  type ControlSchema,
} from "@/components/controls-panel"
import { Button } from "@/components/ui/button"
import {
  Toaster,
  toast,
  toastOrigin,
  type ToastPosition,
  type ToastRounded,
} from "@/components/ui/toast"

// Message for each variant (coffee subscription theme, like the accordion).
const messages = {
  default: {
    title: "Delivery rescheduled",
    description:
      "Your next box now arrives on Friday instead of Wednesday. You can change the day again from your account until Thursday noon.",
  },
  success: {
    title: "Order placed",
    description:
      "We've received your order and will roast it on Monday. You'll get an email with tracking as soon as it ships.",
  },
  info: {
    title: "Roast day is Monday",
    description:
      "Orders placed before Sunday midnight are roasted on Monday and ship fresh on Tuesday, so they reach you within a few days.",
  },
  warning: {
    title: "Card expires soon",
    description:
      "The card on your account expires at the end of this month. Update it before your next delivery so your subscription keeps running.",
  },
  error: {
    title: "Payment failed",
    description:
      "We couldn't charge your card for this box. Check your card details and try again, or pick another payment method.",
  },
} as const

// Resolves after 2s, for the loading → success variant.
const roast = () =>
  new Promise<string>((resolve) =>
    setTimeout(() => resolve("Ethiopia Guji"), 2000)
  )

const controls = {
  variant: {
    group: "Toast",
    type: "select",
    label: "Variant",
    value: "default",
    options: [
      { label: "Default", value: "default" },
      { label: "Success", value: "success" },
      { label: "Info", value: "info" },
      { label: "Warning", value: "warning" },
      { label: "Error", value: "error" },
      { label: "Loading → success", value: "loading" },
    ],
  },
  showDescription: {
    group: "Toast",
    type: "checkbox",
    label: "Description",
    value: true,
  },
  collapsibleDescription: {
    group: "Toast",
    type: "checkbox",
    label: "Collapsible description",
    value: true,
  },
  withAction: {
    group: "Toast",
    type: "checkbox",
    label: "Undo action",
    value: false,
  },
  timeout: {
    group: "Behaviour",
    type: "slider",
    label: "Stays for",
    value: 5,
    min: 1,
    max: 15,
    step: 1,
    unit: "s",
  },

  springy: {
    group: "Animation",
    type: "checkbox",
    label: "Springy entrance",
    value: true,
  },
  fromTrigger: {
    group: "Animation",
    type: "checkbox",
    label: "Grow from button",
    value: false,
  },
  contentFade: {
    group: "Animation",
    type: "checkbox",
    label: "Content fade-in",
    value: true,
  },
  exitAnimation: {
    group: "Animation",
    type: "select",
    label: "Exit",
    value: "fade",
    options: [
      { label: "Fade out", value: "fade" },
      { label: "Slide off", value: "slide" },
    ],
  },
  swipeTilt: {
    group: "Animation",
    type: "checkbox",
    label: "Swipe tilt",
    value: true,
  },
  morphIcon: {
    group: "Animation",
    type: "checkbox",
    label: "Loading → tick morph",
    value: true,
  },
  timerBar: {
    group: "Animation",
    type: "checkbox",
    label: "Time-left bar",
    value: true,
  },

  glass: { group: "Style", type: "checkbox", label: "Glass", value: true },
  accentEdge: {
    group: "Style",
    type: "checkbox",
    label: "Coloured line",
    value: true,
  },
  rounded: {
    group: "Style",
    type: "select",
    label: "Roundness",
    value: "md",
    options: [
      { label: "None", value: "none" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "XL", value: "xl" },
      { label: "2XL", value: "2xl" },
      { label: "3XL", value: "3xl" },
      { label: "Full (pill)", value: "full" },
    ],
  },
  position: {
    group: "Style",
    type: "select",
    label: "Position",
    value: "bottom-center",
    options: [
      { label: "Bottom right", value: "bottom-right" },
      { label: "Bottom left", value: "bottom-left" },
      { label: "Bottom centre", value: "bottom-center" },
      { label: "Top right", value: "top-right" },
      { label: "Top left", value: "top-left" },
      { label: "Top centre", value: "top-center" },
    ],
  },
} satisfies ControlSchema

export default function ToastPage() {
  const panel = useControls(controls)
  const { values } = panel

  const showToast = (trigger: HTMLElement) => {
    const common = {
      timeout: values.timeout * 1000,
      // Where the toast grows out of (with "Grow from button").
      data: { origin: toastOrigin(trigger) },
    }
    const text = (message: { title: string; description: string }) => ({
      title: message.title,
      description: values.showDescription ? message.description : undefined,
    })

    if (values.variant === "loading") {
      // Objects, not plain strings: a string only fills the description.
      toast.promise(roast(), {
        loading: {
          ...common,
          ...text({
            title: "Roasting your beans…",
            description:
              "This takes a couple of seconds. You can keep browsing while we get your order ready.",
          }),
        },
        success: (origin) => ({
          ...common,
          type: "success",
          ...text({
            title: "Ready to ship",
            description: `${origin} is roasted, packed and waiting for the courier. You'll get tracking details by email shortly.`,
          }),
        }),
        error: {
          ...common,
          ...text({
            title: "Roasting failed",
            description:
              "Something went wrong while preparing your order. Try again in a moment, or contact us if it keeps happening.",
          }),
        },
      })
      return
    }

    const variant = values.variant as keyof typeof messages
    const id = toast.add({
      ...common,
      type: variant === "default" ? undefined : variant,
      ...text(messages[variant]),
      // Undo turns the toast into a short confirmation (instead of just
      // closing it, which would look the same as the ✕).
      actionProps: values.withAction
        ? {
            children: "Undo",
            onClick: () =>
              toast.update(id, {
                type: "success",
                title: "Change undone",
                description: values.showDescription
                  ? "Everything is back the way it was."
                  : undefined,
                actionProps: undefined,
                timeout: 2000,
              }),
          }
        : undefined,
    })
  }

  return (
    <Toaster
      springy={values.springy}
      fromTrigger={values.fromTrigger}
      contentFade={values.contentFade}
      collapsibleDescription={values.collapsibleDescription}
      exitAnimation={values.exitAnimation as "fade" | "slide"}
      swipeTilt={values.swipeTilt}
      morphIcon={values.morphIcon}
      timerBar={values.timerBar}
      glass={values.glass}
      accentEdge={values.accentEdge}
      rounded={values.rounded as ToastRounded}
      position={values.position as ToastPosition}
    >
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Toast</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brief messages that stack in the corner and can be swiped away.
        </p>
        <div className="mt-6 flex min-h-48 items-center justify-center">
          <Button
            variant="outline"
            onClick={(event) => showToast(event.currentTarget)}
            className='text-xl py-5 px-8'
          >
            Show toast
          </Button>
        </div>
      </div>

      <ControlsPanel title="Toast" {...panel} />
    </Toaster>
  )
}
