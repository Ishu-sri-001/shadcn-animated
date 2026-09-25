"use client"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How often will my coffee arrive?",
    answer: [
      "Every two weeks by default. You can switch to weekly or monthly deliveries at any time from your account, and the change applies to your next order.",
      "If you're heading away, pause your subscription for up to three months. We'll send a reminder a few days before deliveries start again.",
    ],
  },
  {
    question: "Can I choose how my beans are ground?",
    answer: [
      "Yes. Pick whole bean, or a grind for espresso, filter, French press or stovetop. You can set a different grind for each coffee in your box.",
      "Whole beans stay fresh longest, so we recommend them if you have a grinder at home.",
    ],
  },
  {
    question: "When is the coffee roasted?",
    answer: [
      "We roast every Monday and Thursday and ship within 24 hours, so your coffee reaches you within a few days of roasting.",
      "Each bag is stamped with its roast date. For the best flavour, brew it within a month.",
    ],
  },
  {
    question: "What if I don't like a coffee?",
    answer: [
      "Tell us within 14 days and we'll send a replacement from a different origin, free of charge. There's no need to send the bag back.",
      "Your feedback also tunes future boxes, so we can steer you toward the flavours you enjoy.",
    ],
  },
  {
    question: "Is the packaging recyclable?",
    answer: [
      "Yes. Our bags are made from paper with a plant-based lining, and they go in your home compost or paper recycling. The one-way valve pulls out and goes in general waste.",
      "The shipping box is recycled cardboard, sized to fit through a standard letterbox so you don't need to be home.",
    ],
  },
  {
    question: "Can I send a subscription as a gift?",
    answer: [
      "Yes. Choose three, six or twelve months, add a personal note, and pick the date the first box should arrive.",
      "Gift subscriptions are paid upfront and end on their own, so there's nothing for the recipient to cancel.",
    ],
  },
]

const controls = {
  multiple: { group: "Accordion", type: "checkbox", label: "Multiple open", value: false },
  openOnHover: { group: "Accordion", type: "checkbox", label: "Open on hover", value: false },
  bordered: { group: "Accordion", type: "checkbox", label: "Border", value: false },
  gooey: { group: "Accordion", type: "checkbox", label: "Elastic / bouncy", value: false },
  duration: {
    group: "Timing",
    type: "slider",
    label: "Duration",
    value: 0.5,
    min: 0.1,
    max: 1.5,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    group: "Timing",
    type: "slider",
    label: "Bounce (elastic)",
    value: 0.3,
    min: 0,
    max: 0.8,
    step: 0.05,
  },
  delay: {
    group: "Timing",
    type: "slider",
    label: "Content delay",
    value: 0.2,
    min: 0,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  stagger: {
    group: "Timing",
    type: "slider",
    label: "Stagger",
    value: 0.05,
    min: 0,
    max: 0.3,
    step: 0.01,
    unit: "s",
  },
  fill: { group: "Item", type: "checkbox", label: "Fill", value: false },
  rounded: {
    group: "Item",
    type: "select",
    label: "Fill roundness",
    value: "rounded-none",
    options: [
      { label: "None", value: "rounded-none" },
      { label: "Small", value: "rounded-sm" },
      { label: "Medium", value: "rounded-md" },
      { label: "Large", value: "rounded-lg" },
      { label: "XL", value: "rounded-xl" },
      { label: "2XL", value: "rounded-2xl" },
      { label: "3XL", value: "rounded-3xl" },
    ],
  },
  line: { group: "Item", type: "checkbox", label: "Line on hover", value: true },
  icon: {
    group: "Heading",
    type: "select",
    label: "Icon",
    value: "plus",
    options: [
      { label: "Plus / minus", value: "plus" },
      { label: "Chevron", value: "chevron" },
    ],
  },
} satisfies ControlSchema

export default function AccordionPage() {
  const panel = useControls(controls)
  const { values } = panel

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-semibold">Accordion</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Expandable sections that reveal their answers with a staggered fade.
      </p>
      <div className="mt-6 flex min-h-48 items-center justify-center">
        <Accordion
          className="w-full"
          multiple={values.multiple}
          openOnHover={values.openOnHover}
          bordered={values.bordered}
          gooey={values.gooey}
          duration={values.duration}
          bounce={values.bounce}
          delay={values.delay}
          stagger={values.stagger}
        >
          {faqs.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              value={`item-${i + 1}`}
              line={values.line}
              fill={values.fill ? "bg-muted" : undefined}
              rounded={values.rounded}
            >
              <AccordionTrigger
                icon={values.icon as "plus" | "chevron"}
                className="text-[1.5vw] max-[1025px]:text-[2.5vw] max-md:text-[4.5vw]"
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <ControlsPanel title="Accordion" {...panel} />
    </div>
  )
}
