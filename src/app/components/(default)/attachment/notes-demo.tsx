"use client"

import * as React from "react"
import { FileTextIcon, PlusIcon, XIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"

import {
  HpxAttachment,
  HpxAttachmentAction,
  HpxAttachmentActions,
  HpxAttachmentContent,
  HpxAttachmentDescription,
  HpxAttachmentGroup,
  HpxAttachmentMedia,
  HpxAttachmentTitle,
} from "@/components/ui/attachment"
import { HpxButton } from "@/components/ui/button"
import { HpxInput } from "@/components/ui/input"
import {
  HpxSelect,
  HpxSelectContent,
  HpxSelectItem,
  HpxSelectTrigger,
  HpxSelectValue,
} from "@/components/ui/select"

type Size = "default" | "sm" | "xs"

const sizes: { label: string; value: Size }[] = [
  { label: "Default", value: "default" },
  { label: "Small", value: "sm" },
  { label: "Extra small", value: "xs" },
]

type Note = { id: number; text: string; size: Size }

export function HpxNotesDemo() {
  const [notes, setNotes] = React.useState<Note[]>([
    { id: 1, text: "Confirm Monday's roast dates", size: "default" },
  ])
  const [text, setText] = React.useState("")
  const [size, setSize] = React.useState<Size>("default")
  const [nextId, setNextId] = React.useState(2)

  function addNote(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setNotes((current) => [...current, { id: nextId, text: trimmed, size }])
    setNextId((id) => id + 1)
    setText("")
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[2vw] font-semibold">Demo 2 · Notes</h2>
        <p className="text-sm text-muted-foreground">
          Write a short note and add it to the board below.
        </p>
      </div>
      <form onSubmit={addNote} className="flex items-center gap-2 max-md:flex-wrap">
        <HpxInput
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note…"
          aria-label="Note text"
          maxLength={120}
          className="flex-1 max-md:basis-full"
        />
        <HpxSelect
          items={sizes}
          value={size}
          onValueChange={(value) => value && setSize(value as Size)}
        >
          <HpxSelectTrigger aria-label="Note size" className="w-32">
            <HpxSelectValue />
          </HpxSelectTrigger>
          <HpxSelectContent>
            {sizes.map((option) => (
              <HpxSelectItem key={option.value} value={option.value}>
                {option.label}
              </HpxSelectItem>
            ))}
          </HpxSelectContent>
        </HpxSelect>
        <HpxButton type="submit" disabled={!text.trim()}>
          <PlusIcon />
          Add note
        </HpxButton>
      </form>
      <div className="flex min-h-24 flex-col justify-center rounded-lg border p-6 max-md:p-4">
        <HpxAttachmentGroup
          wrap
          className="items-center"
          values={notes.map((note) => note.id)}
          onReorder={(ids) =>
            setNotes((current) => ids.flatMap((id) => current.find((note) => note.id === id) ?? []))
          }
        >
          <AnimatePresence initial={false} mode="popLayout">
            {notes.map((note) => {
              return (
                <HpxAttachment key={note.id} value={note.id} size={note.size} title={note.text}>
                  <HpxAttachmentMedia>
                    <FileTextIcon />
                  </HpxAttachmentMedia>
                  <HpxAttachmentContent>
                    <HpxAttachmentTitle>{note.text}</HpxAttachmentTitle>
                    <HpxAttachmentDescription>Size: {note.size}</HpxAttachmentDescription>
                  </HpxAttachmentContent>
                  <HpxAttachmentActions>
                    <HpxAttachmentAction
                      reveal
                      aria-label={`Remove note: ${note.text}`}
                      onClick={() => setNotes((current) => current.filter((n) => n.id !== note.id))}
                    >
                      <XIcon />
                    </HpxAttachmentAction>
                  </HpxAttachmentActions>
                </HpxAttachment>
              )
            })}
          </AnimatePresence>
        </HpxAttachmentGroup>
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet. Write one above.</p>
        )}
      </div>
    </section>
  )
}
