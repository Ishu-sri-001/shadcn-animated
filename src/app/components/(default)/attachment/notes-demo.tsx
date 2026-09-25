"use client"

import * as React from "react"
import { FileTextIcon, PlusIcon, XIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Size = "default" | "sm" | "xs"

const sizes: { label: string; value: Size }[] = [
  { label: "Default", value: "default" },
  { label: "Small", value: "sm" },
  { label: "Extra small", value: "xs" },
]

type Note = { id: number; text: string; size: Size }

export function NotesDemo() {
  const [notes, setNotes] = React.useState<Note[]>([
    { id: 1, text: "Confirm Monday's roast dates", size: "default" },
  ])
  const [text, setText] = React.useState("")
  const [size, setSize] = React.useState<Size>("default")
  // Only goes up, so keys stay unique after removals.
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
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note…"
          aria-label="Note text"
          maxLength={120}
          className="flex-1 max-md:basis-full"
        />
        <Select
          items={sizes}
          value={size}
          onValueChange={(value) => value && setSize(value as Size)}
        >
          <SelectTrigger aria-label="Note size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!text.trim()}>
          <PlusIcon />
          Add note
        </Button>
      </form>
      <div className="flex min-h-24 flex-col justify-center rounded-lg border p-6 max-md:p-4">
        {/* Wrapped, so notes reorder across rows too. */}
        <AttachmentGroup
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
                <Attachment key={note.id} value={note.id} size={note.size} title={note.text}>
                  <AttachmentMedia>
                    <FileTextIcon />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{note.text}</AttachmentTitle>
                    <AttachmentDescription>Size: {note.size}</AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      reveal
                      aria-label={`Remove note: ${note.text}`}
                      onClick={() => setNotes((current) => current.filter((n) => n.id !== note.id))}
                    >
                      <XIcon />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              )
            })}
          </AnimatePresence>
        </AttachmentGroup>
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet. Write one above.</p>
        )}
      </div>
    </section>
  )
}
