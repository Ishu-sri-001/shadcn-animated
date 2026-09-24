"use client"

import * as React from "react"
import { ArrowUpIcon, MessageSquarePlusIcon, XIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"

import { ControlsPanel, useControls, type ControlSchema } from "@/components/controls-panel"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  BubbleStatus,
  BubbleSuggestion,
  BubbleSuggestions,
  BubbleText,
  BubbleThread,
  type BubbleStatusValue,
} from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const variants = [
  { label: "Default", value: "default" },
  { label: "Tinted", value: "tinted" },
  { label: "Outline", value: "outline" },
  { label: "Ghost", value: "ghost" },
  { label: "Destructive", value: "destructive" },
] as const

type Variant = (typeof variants)[number]["value"]

type Message = {
  id: string
  from: "me" | "them"
  text: string
  time: string
  /** Style of your own messages, chosen when sending. */
  variant?: Variant
  status?: BubbleStatusValue
  reactions: Record<string, number>
  typing?: boolean
  /** Text of the message this one replies to. */
  replyTo?: string
  /** Seeded messages don't animate in. */
  seed?: boolean
  /** Pop-in delay within a batch, in seconds. */
  delay?: number
  /** Input rect the text flies from. */
  flyFrom?: { x: number; y: number; width: number; height: number }
  /** Shared with the suggestion it was sent from. */
  layoutId?: string
}

const seed: Message[] = [
  { id: "s1", from: "them", text: "Morning! Did the new beans arrive?", time: "9:38", reactions: {}, seed: true },
  { id: "s2", from: "them", text: "The Ethiopian roast, I mean. I want to try it for Saturday.", time: "9:38", reactions: {}, seed: true },
  { id: "s3", from: "me", text: "They did, two bags this morning ☕", time: "9:40", reactions: {}, seed: true },
  { id: "s4", from: "me", text: "Roasted on Monday, so they're at their best this week.", time: "9:40", reactions: { "❤️": 2 }, status: "read", seed: true },
  {
    id: "s5",
    from: "them",
    text: "Perfect. Here's the plan for Saturday: we open at eight, so I'll come in at seven to dial in the grinder. The Ethiopian goes on filter first, then we'll try it as espresso around ten once the morning rush dies down. If it's too bright as espresso we'll keep it on filter all day and put the house blend back on the machine. I'll write tasting notes for the board, and could you print a few cards for the counter? Oh, and remind me to order more oat milk, we ran out twice last week.",
    time: "9:42",
    reactions: {},
    seed: true,
  },
]

const replies = [
  "Nice, I'll grab a bag on my way in.",
  "Honestly the filter grind was spot on last time. Same again? I think a touch finer might bring out the berry notes, but let's taste it first.",
  "Sounds good 👍",
  "Can you check the grinder burrs too? They've been sounding rough.",
]

const incoming = ["Quick one", "Oat milk is here 🥛", "Also, the new cups arrived!"]

const suggestionSets = [
  ["Sure, on it", "Espresso instead?", "Tomorrow?"],
  ["Same again", "Go finer", "Let's taste first"],
  ["👍", "Thanks!", "See you at seven"],
]

const controls = {
  enter: { group: "Arriving", type: "checkbox", label: "Pop in", value: true },
  stagger: { group: "Arriving", type: "checkbox", label: "Stagger", value: true },
  staggerDelay: { group: "Arriving", type: "slider", label: "Stagger gap", value: 0.12, min: 0.03, max: 0.4, step: 0.01, unit: "s" },
  makeRoom: { group: "Arriving", type: "checkbox", label: "Make room", value: true },
  typing: { group: "Arriving", type: "checkbox", label: "Typing indicator", value: true },
  streaming: { group: "Arriving", type: "checkbox", label: "Streaming text", value: true },

  flyIn: { group: "Sending", type: "checkbox", label: "Fly from input", value: true },
  status: { group: "Sending", type: "checkbox", label: "Delivery status", value: true },
  shake: { group: "Sending", type: "checkbox", label: "Error shake", value: true },
  failures: { group: "Sending", type: "checkbox", label: "Simulate failures", value: true },

  pop: { group: "Reactions", type: "checkbox", label: "Reaction pop", value: true },
  rolling: { group: "Reactions", type: "checkbox", label: "Rolling count", value: true },
  doubleClick: { group: "Reactions", type: "checkbox", label: "Double-click to react", value: true },
  picker: { group: "Reactions", type: "checkbox", label: "Reaction picker", value: true },
  magnify: { group: "Reactions", type: "checkbox", label: "Magnify emojis", value: false },

  lift: { group: "Interaction", type: "checkbox", label: "Hover lift", value: false },
  time: { group: "Interaction", type: "checkbox", label: "Timestamp reveal", value: false },
  swipe: { group: "Interaction", type: "checkbox", label: "Swipe to reply", value: true },
  suggestions: { group: "Interaction", type: "checkbox", label: "Suggested replies", value: true },
  readMore: { group: "Interaction", type: "checkbox", label: "Read more", value: true },

  joined: { group: "Grouping", type: "checkbox", label: "Joined corners", value: false },
} satisfies ControlSchema

const FAIL_CHANCE = 0.25
// Gap between streamed words, in ms.
const WORD_MS = 70

function now() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

// Consecutive messages from the same sender form a group, keyed by its first message.
function groupMessages(messages: Message[]) {
  const groups: { id: string; from: Message["from"]; messages: Message[] }[] = []
  for (const message of messages) {
    const last = groups[groups.length - 1]
    if (last && last.from === message.from) last.messages.push(message)
    else groups.push({ id: message.id, from: message.from, messages: [message] })
  }
  return groups
}

export function ChatDemo() {
  const panel = useControls(controls)
  const { values } = panel

  const [messages, setMessages] = React.useState<Message[]>(seed)
  const [draft, setDraft] = React.useState("")
  const [variant, setVariant] = React.useState<Variant>("default")
  const [replyTo, setReplyTo] = React.useState<Message | null>(null)
  const [suggestions, setSuggestions] = React.useState<{ id: string; texts: string[] } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const replyIndex = React.useRef(0)
  const timers = React.useRef(new Set<number>())

  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  function later(fn: () => void, ms: number) {
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
  }

  function update(id: string, patch: Partial<Message>) {
    setMessages((current) => current.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function react(id: string, emoji: string) {
    setMessages((current) =>
      current.map((m) =>
        m.id === id ? { ...m, reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] ?? 0) + 1 } } : m
      )
    )
  }

  function botReply() {
    const id = crypto.randomUUID()
    const text = replies[replyIndex.current % replies.length]
    const nextSuggestions = suggestionSets[replyIndex.current % suggestionSets.length]
    replyIndex.current += 1
    const showSuggestions = () => setSuggestions({ id: crypto.randomUUID(), texts: nextSuggestions })

    const reveal = () => {
      if (!values.streaming) {
        update(id, { typing: false, text })
        later(showSuggestions, 300)
        return
      }
      const words = text.split(" ")
      update(id, { typing: false, text: words[0] })
      words.slice(1).forEach((_, i) => {
        later(() => update(id, { text: words.slice(0, i + 2).join(" ") }), (i + 1) * WORD_MS)
      })
      later(showSuggestions, words.length * WORD_MS + 300)
    }

    if (values.typing) {
      setMessages((current) => [
        ...current,
        { id, from: "them", text: "", time: now(), reactions: {}, typing: true },
      ])
      later(reveal, 1400)
    } else {
      setMessages((current) => [
        ...current,
        { id, from: "them", text: values.streaming ? "" : text, time: now(), reactions: {} },
      ])
      if (values.streaming) later(reveal, 50)
      else later(showSuggestions, 300)
    }
  }

  // Walks a sent message through sending → sent → delivered → read, or fails it.
  function deliver(id: string, canFail: boolean) {
    later(() => {
      if (canFail && values.failures && Math.random() < FAIL_CHANCE) {
        update(id, { status: "failed" })
        return
      }
      update(id, { status: "sent" })
      later(() => update(id, { status: "delivered" }), 700)
      later(() => {
        update(id, { status: "read" })
        botReply()
      }, 1500)
    }, 500)
  }

  function send(text: string, options: { layoutId?: string } = {}) {
    const id = crypto.randomUUID()
    const box = inputRef.current?.getBoundingClientRect()
    setMessages((current) => [
      ...current,
      {
        id,
        from: "me",
        text,
        time: now(),
        variant,
        status: "sending",
        reactions: {},
        replyTo: replyTo?.text,
        layoutId: options.layoutId,
        flyFrom:
          values.flyIn && box && !options.layoutId
            ? { x: box.left + 10, y: box.top, width: box.width, height: box.height }
            : undefined,
      },
    ])
    setReplyTo(null)
    setSuggestions(null)
    deliver(id, true)
  }

  function simulateIncoming() {
    setMessages((current) => [
      ...current,
      ...incoming.map((text, i) => ({
        id: crypto.randomUUID(),
        from: "them" as const,
        text,
        time: now(),
        reactions: {},
        delay: values.stagger ? i * values.staggerDelay : 0,
      })),
    ])
  }

  const lastMine = [...messages].reverse().find((m) => m.from === "me")

  function renderMessage(message: Message) {
    const mine = message.from === "me"
    const failed = message.status === "failed"
    const total = Object.values(message.reactions).reduce((sum, n) => sum + n, 0)
    const showStatus = values.status && mine && (failed || message.id === lastMine?.id)
    return (
      <Bubble
        key={message.id}
        align={mine ? "end" : "start"}
        variant={failed ? "destructive" : mine ? (message.variant ?? "default") : "muted"}
        enter={values.enter && !message.seed && !message.layoutId}
        enterDelay={message.delay}
        enterFrom={message.flyFrom}
        shake={values.shake}
        lift={values.lift}
        time={message.time}
        revealTime={values.time}
        swipeToReply={values.swipe}
        onReply={() => {
          setReplyTo(message)
          inputRef.current?.focus()
        }}
        onReact={(emoji) => react(message.id, emoji)}
        doubleClickReact={values.doubleClick}
        picker={values.picker}
        magnify={values.magnify}
      >
        <BubbleContent typing={message.typing} layoutId={message.layoutId}>
          {message.replyTo && (
            <span className="line-clamp-1 border-l-2 border-current/40 px-2 text-xs opacity-80">
              {message.replyTo}
            </span>
          )}
          <BubbleText text={message.text} fade={values.streaming} collapsible={values.readMore} />
        </BubbleContent>
        <AnimatePresence initial={false}>
          {total > 0 && (
            <BubbleReactions
              key="reactions"
              align={mine ? "start" : "end"}
              pop={values.pop}
              rolling={values.rolling}
              count={total}
            >
              {Object.keys(message.reactions).map((emoji) => (
                <span key={emoji}>{emoji}</span>
              ))}
            </BubbleReactions>
          )}
        </AnimatePresence>
        {showStatus && message.status && (
          <BubbleStatus
            status={message.status}
            onRetry={() => {
              update(message.id, { status: "sending" })
              // Retries always succeed.
              deliver(message.id, false)
            }}
          />
        )}
      </Bubble>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Send a message, double-click or hover a bubble to react, swipe one to reply.
        </h2>
        <Button variant="outline" size="sm" onClick={simulateIncoming}>
          <MessageSquarePlusIcon />
          Receive messages
        </Button>
      </div>
      <div className="flex flex-col rounded-lg border">
        <BubbleThread makeRoom={values.makeRoom} className="h-[60vh] px-6 py-6 max-md:px-4">
          {groupMessages(messages).map((group) => (
            <BubbleGroup key={group.id} joined={values.joined}>
              {group.messages.map(renderMessage)}
            </BubbleGroup>
          ))}
          <AnimatePresence>
            {suggestions && (
              <BubbleSuggestions key={suggestions.id} stagger={values.suggestions}>
                {suggestions.texts.map((text, i) => {
                  const layoutId = values.suggestions ? `${suggestions.id}-${i}` : undefined
                  return (
                    <BubbleSuggestion
                      key={text}
                      layoutId={layoutId}
                      onClick={() => send(text, { layoutId })}
                    >
                      {text}
                    </BubbleSuggestion>
                  )
                })}
              </BubbleSuggestions>
            )}
          </AnimatePresence>
        </BubbleThread>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            const text = draft.trim()
            if (!text) return
            send(text)
            setDraft("")
          }}
          className="flex flex-col gap-2 border-t p-3"
        >
          {replyTo && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
              <span className="line-clamp-1 text-muted-foreground">
                Replying to: <span className="text-foreground">{replyTo.text}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
              >
                <XIcon />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message"
              aria-label="Message"
            />
            <Select
              items={variants}
              value={variant}
              onValueChange={(value) => value && setVariant(value as Variant)}
            >
              <SelectTrigger aria-label="Bubble variant" className="w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
              <ArrowUpIcon />
            </Button>
          </div>
        </form>
      </div>

      <ControlsPanel title="Bubble" {...panel} />
    </section>
  )
}
