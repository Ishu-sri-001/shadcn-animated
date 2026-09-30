"use client"

import * as React from "react"
import { cn } from "cn"

import { FillButton } from "@/components/ui/hover-effects"
import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  type QuestionnaireChoiceColor,
  type QuestionnaireChoiceHover,
  type QuestionnaireChoiceLayout,
  type QuestionnaireChoiceIndicator,
  type QuestionnaireContent,
  type QuestionnaireIndicatorRounded,
} from "@/components/ui/questionnaire"

const questions = [
  {
    name: "role",
    title: "Your role",
    labels: { designer: "Designer", developer: "Developer", product: "Product manager", other: "Something else" },
  },
  {
    name: "tools",
    title: "Weekly tools",
    labels: { figma: "Figma", github: "GitHub", linear: "Linear", notion: "Notion" },
  },
  { name: "feedback", title: "Feedback", labels: {} },
] as { name: string; title: string; labels: Record<string, string> }[]

type Answer = { title: string; values: string[] }

const controls = {
  content: {
    group: "Content",
    type: "select",
    label: "Question moves",
    value: "slide-y",
    options: [
      { label: "Slide (x axis)", value: "slide-x" },
      { label: "Slide (y axis)", value: "slide-y" },
      { label: "Fade", value: "fade" },
      { label: "Scale", value: "scale" },
      { label: "None", value: "none" },
    ],
  },
  distance: {
    disabled: (v) => v.content !== "slide-x" && v.content !== "slide-y",
    group: "Content",
    type: "slider",
    label: "Slide distance",
    value: 20,
    min: 0,
    max: 50,
    step: 1,
    unit: "vw",
  },
  choiceLayout: {
    group: "Choices",
    type: "select",
    label: "Layout",
    value: "card",
    options: [
      { label: "Cards", value: "card" },
      { label: "Inline radio", value: "inline" },
    ],
  },
  choiceHover: {
    group: "Choices",
    type: "select",
    label: "Choice hover",
    value: "top",
    options: [
      { label: "Fade", value: "fade" },
      { label: "Fill from top", value: "top" },
    ],
  },
  choiceColor: {
    group: "Choices",
    type: "select",
    label: "Selected color",
    value: "primary",
    options: [
      { label: "Muted", value: "muted" },
      { label: "Primary", value: "primary" },
    ],
  },
  indicatorRounded: {
    disabled: (v) => v.choiceIndicator !== "check",
    group: "Choices",
    type: "select",
    label: "Icon roundness",
    value: "full",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "Full", value: "full" },
    ],
  },
  indicatorBorder: { disabled: (v) => v.choiceIndicator !== "check", group: "Choices", type: "checkbox", label: "Icon border", value: false },
  choiceIndicator: {
    group: "Choices",
    type: "select",
    label: "Indicator",
    value: "check",
    options: [
      { label: "Check icon", value: "check" },
      { label: "Radio", value: "radio" },
      { label: "None", value: "none" },
    ],
  },
  bordered: { group: "Border", type: "checkbox", label: "Show border", value: true },
  multiple: { group: "Choices", type: "checkbox", label: "Choose multiple", value: false },
  staggerChoices: { group: "Choices", type: "checkbox", label: "Stagger choices", value: true },
  stagger: {
    disabled: (v) => !v.staggerChoices,
    group: "Choices",
    type: "slider",
    label: "Stagger delay",
    value: 0.05,
    min: 0,
    max: 0.2,
    step: 0.01,
    unit: "s",
  },
  showProgress: { group: "Progress", type: "checkbox", label: "Show progress", value: true },
  shortcuts: {
    group: "Progress",
    type: "select",
    label: "Choice keys",
    value: "off",
    options: [
      { label: "Letters (A, B, C)", value: "letters" },
      { label: "Numbers (1, 2, 3)", value: "numbers" },
      { label: "Off", value: "off" },
    ],
  },
  duration: {
    disabled: (v) => v.content === "none",
    group: "Motion",
    type: "slider",
    label: "Duration",
    value: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    disabled: (v) => v.content === "fade" || v.content === "none",
    group: "Motion",
    type: "slider",
    label: "Bounce",
    value: 0.1,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
} satisfies ControlSchema

export function QuestionnaireDemo() {
  const panel = useControls(controls)
  const { values } = panel
  const [answers, setAnswers] = React.useState<Answer[] | null>(null)
  const [round, setRound] = React.useState(0)

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex min-h-[50vh] flex-col justify-start rounded-lg border px-[4vw] py-8",
          !values.bordered && "border-transparent"
        )}
      >
        {answers ? (
          <div className="flex flex-col items-start gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Thanks, that&apos;s everything</h2>
              <p className="text-lg text-muted-foreground">Your answers are in.</p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-lg font-medium">You chose:</p>
              <ul className="flex flex-col gap-2 text-lg">
                {answers.map((answer) => (
                  <li key={answer.title} className="flex gap-2">
                    <span className="text-muted-foreground">{answer.title}:</span>
                    <span>{answer.values.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
            <FillButton
              className="h-11 px-5 text-base"
              onClick={() => {
                setAnswers(null)
                setRound((r) => r + 1)
              }}
            >
              Start again
            </FillButton>
          </div>
        ) : (
          <Questionnaire
            key={round}
            shortcuts={values.shortcuts === "off" ? undefined : (values.shortcuts as "letters" | "numbers")}
            content={values.content as QuestionnaireContent}
            distance={values.distance}
            duration={values.duration}
            bounce={values.bounce}
            multiple={values.multiple}
            choiceLayout={values.choiceLayout as QuestionnaireChoiceLayout}
            choiceHover={values.choiceHover as QuestionnaireChoiceHover}
            choiceColor={values.choiceColor as QuestionnaireChoiceColor}
            indicatorRounded={values.indicatorRounded as QuestionnaireIndicatorRounded}
            indicatorBorder={values.indicatorBorder}
            choiceIndicator={values.choiceIndicator as QuestionnaireChoiceIndicator}
            staggerChoices={values.staggerChoices}
            stagger={values.stagger}
            showProgress={values.showProgress}
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              setAnswers(
                questions.flatMap(({ name, title, labels }) => {
                  const values = data
                    .getAll(name)
                    .map((value) => labels[String(value)] ?? String(value))
                    .filter(Boolean)
                  return values.length ? [{ title, values }] : []
                })
              )
            }}
          >
            <QuestionnaireProgress />

            <QuestionnaireItem name="role" required>
              <QuestionnaireTitle>What best describes your role?</QuestionnaireTitle>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="designer">Designer</QuestionnaireChoice>
                <QuestionnaireChoice value="developer">Developer</QuestionnaireChoice>
                <QuestionnaireChoice value="product">
                  Product manager
                  <QuestionnaireChoiceDescription>Owns the roadmap and priorities</QuestionnaireChoiceDescription>
                </QuestionnaireChoice>
                <QuestionnaireChoice value="other">Something else</QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name="tools">
              <QuestionnaireTitle>Which tools do you use every week?</QuestionnaireTitle>
              <QuestionnaireDescription>Pick as many as you like, or skip.</QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="figma">Figma</QuestionnaireChoice>
                <QuestionnaireChoice value="github">GitHub</QuestionnaireChoice>
                <QuestionnaireChoice value="linear">Linear</QuestionnaireChoice>
                <QuestionnaireChoice value="notion">Notion</QuestionnaireChoice>
              </QuestionnaireChoices>
            </QuestionnaireItem>

            <QuestionnaireItem name="feedback">
              <QuestionnaireTitle>Anything you&apos;d like us to know?</QuestionnaireTitle>
              <QuestionnaireDescription>A sentence is plenty.</QuestionnaireDescription>
              <QuestionnaireInput placeholder="Type your answer…" />
            </QuestionnaireItem>

            <QuestionnaireActions>
              <QuestionnairePrevious />
              <QuestionnaireSkip />
              <QuestionnaireNext />
              <QuestionnaireSubmit />
            </QuestionnaireActions>
          </Questionnaire>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: press a choice&apos;s letter to pick it, Enter to continue, and ← to go back.
      </p>

      <ControlsPanel title="Questionnaire" {...panel} />
    </div>
  )
}
