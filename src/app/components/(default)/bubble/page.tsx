import { ChatDemo } from "./chat-demo"

export default function BubblePage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Bubble</h1>
        <p className="text-sm text-muted-foreground">
          Chat message bubbles with variants, grouping and reactions.
        </p>
      </div>

      <ChatDemo />
    </div>
  )
}
