"use client"

import {
  HpxControlsPanel,
  useHpxControls,
  type HpxControlSchema,
} from "@/components/controls-panel"
import { HpxButton } from "@/components/ui/button"
import {
  HpxToaster,
  hpxToast,
  hpxToastOrigin,
  type HpxToastPosition,
  type HpxToastRounded,
} from "@/components/ui/toast"

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
    disabled: (v) => !v.showDescription,
    group: "Toast",
    type: "checkbox",
    label: "Collapsible description",
    value: true,
  },
  showAction: {
    group: "Toast",
    type: "checkbox",
    label: "Show action",
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

  elastic: {
    group: "Animation",
    type: "checkbox",
    label: "Elastic",
    value: true,
  },
  originFromTrigger: {
    group: "Animation",
    type: "checkbox",
    label: "Origin from trigger",
    value: false,
  },
  fadeContent: {
    group: "Animation",
    type: "checkbox",
    label: "Fade content",
    value: true,
  },
  exitAnimation: {
    group: "Animation",
    type: "select",
    label: "Exit animation",
    value: "fade",
    options: [
      { label: "Fade out", value: "fade" },
      { label: "Slide off", value: "slide" },
    ],
  },
  tiltOnSwipe: {
    group: "Animation",
    type: "checkbox",
    label: "Tilt on swipe",
    value: true,
  },
  morphIcon: {
    group: "Animation",
    type: "checkbox",
    label: "Loading → tick morph",
    value: true,
  },
  showTimerBar: {
    disabled: (v) => v.timeout === 0 || v.variant === "loading",
    group: "Animation",
    type: "checkbox",
    label: "Show timer bar",
    value: true,
  },

  glass: { group: "Style", type: "checkbox", label: "Glass", value: true },
  showAccentEdge: {
    disabled: (v) => v.variant === "default",
    group: "Style",
    type: "checkbox",
    label: "Show accent edge",
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
      { label: "xl", value: "xl" },
      { label: "2xl", value: "2xl" },
      { label: "3xl", value: "3xl" },
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
} satisfies HpxControlSchema

export default function ToastPage() {
  const panel = useHpxControls(controls)
  const { values } = panel

  const showToast = (trigger: HTMLElement) => {
    const common = {
      timeout: values.timeout * 1000,
      data: { origin: hpxToastOrigin(trigger) },
    }
    const text = (message: { title: string; description: string }) => ({
      title: message.title,
      description: values.showDescription ? message.description : undefined,
    })

    if (values.variant === "loading") {
      hpxToast.promise(roast(), {
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
    const id = hpxToast.add({
      ...common,
      type: variant === "default" ? undefined : variant,
      ...text(messages[variant]),
      actionProps: values.showAction
        ? {
            children: "Undo",
            onClick: () =>
              hpxToast.update(id, {
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
    <HpxToaster
      elastic={values.elastic}
      originFromTrigger={values.originFromTrigger}
      fadeContent={values.fadeContent}
      collapsibleDescription={values.collapsibleDescription}
      exitAnimation={values.exitAnimation as "fade" | "slide"}
      tiltOnSwipe={values.tiltOnSwipe}
      morphIcon={values.morphIcon}
      showTimerBar={values.showTimerBar}
      glass={values.glass}
      showAccentEdge={values.showAccentEdge}
      rounded={values.rounded as HpxToastRounded}
      position={values.position as HpxToastPosition}
    >
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Toast</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brief messages that stack in the corner and can be swiped away.
        </p>
        <div className="mt-6 flex min-h-48 items-center justify-center">
          <HpxButton
            variant="outline"
            onClick={(event) => showToast(event.currentTarget)}
            className='text-xl py-5 px-8'
          >
            Show toast
          </HpxButton>
        </div>
      </div>

      <HpxControlsPanel title="Toast" {...panel} />
    </HpxToaster>
  )
}
