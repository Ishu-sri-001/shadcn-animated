import { HpxQuestionnaireDemo } from "./questionnaire-demo"

export default function QuestionnairePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Questionnaire</h1>
        <p className="text-sm text-muted-foreground">
          Step through questions one at a time. Each question slides or fades in the direction you move, and the choices rise in one by one.
        </p>
      </div>

      <HpxQuestionnaireDemo />
    </div>
  )
}
