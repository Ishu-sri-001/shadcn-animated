"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
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
  type QuestionnaireContent,
  type QuestionnaireProgressStyle,
} from "@/components/ui/questionnaire"

const controls = {
  content: {
    group: "Content",
    type: "select",
    label: "Question moves",
    value: "slide-x",
    options: [
      { label: "Slide (x axis)", value: "slide-x" },
      { label: "Slide (y axis)", value: "slide-y" },
      { label: "Fade", value: "fade" },
      { label: "Scale", value: "scale" },
      { label: "None", value: "none" },
    ],
  },
  distance: {
    group: "Content",
    type: "slider",
    label: "Slide distance",
    value: 40,
    min: 0,
    max: 120,
    step: 4,
    unit: "px",
  },
  smoothHeight: { group: "Content", type: "checkbox", label: "Smooth height", value: true },
  staggerChoices: { group: "Choices", type: "checkbox", label: "Stagger choices", value: true },
  stagger: {
    group: "Choices",
    type: "slider",
    label: "Stagger delay",
    value: 0.05,
    min: 0,
    max: 0.2,
    step: 0.01,
    unit: "s",
  },
  progressStyle: {
    group: "Progress",
    type: "select",
    label: "Progress",
    value: "bar",
    options: [
      { label: "Bar", value: "bar" },
      { label: "Text", value: "text" },
    ],
  },
  shortcuts: {
    group: "Progress",
    type: "select",
    label: "Choice keys",
    value: "letters",
    options: [
      { label: "Letters (A, B, C)", value: "letters" },
      { label: "Numbers (1, 2, 3)", value: "numbers" },
      { label: "Off", value: "off" },
    ],
  },
  duration: {
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
  const [done, setDone] = React.useState(false)
  const [round, setRound] = React.useState(0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[50vh] flex-col justify-start rounded-lg border px-[4vw] py-8">
        {done ? (
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-lg font-semibold">Thanks, that&apos;s everything</h2>
            <p className="text-sm text-muted-foreground">Your answers are in.</p>
            <Button
              variant="outline"
              onClick={() => {
                setDone(false)
                setRound((r) => r + 1)
              }}
            >
              Start again
            </Button>
          </div>
        ) : (
          <Questionnaire
            key={round}
            shortcuts={values.shortcuts === "off" ? undefined : (values.shortcuts as "letters" | "numbers")}
            content={values.content as QuestionnaireContent}
            distance={values.distance}
            duration={values.duration}
            bounce={values.bounce}
            smoothHeight={values.smoothHeight}
            staggerChoices={values.staggerChoices}
            stagger={values.stagger}
            progressStyle={values.progressStyle as QuestionnaireProgressStyle}
            onSubmit={(event) => {
              event.preventDefault()
              setDone(true)
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

            <QuestionnaireItem name="tools" multiple>
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
