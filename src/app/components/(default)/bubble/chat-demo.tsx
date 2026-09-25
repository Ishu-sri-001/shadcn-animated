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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  at: number
  variant?: Variant
  status?: BubbleStatusValue
  reactions: Record<string, number>
  mine?: string[]
  typing?: boolean
  replyTo?: string
  /** Seeded messages don't animate in. */
  seed?: boolean
  flyFrom?: { x: number; y: number; width: number; height: number }
  layoutId?: string
  stream?: boolean
}

const seed: Message[] = [
  { id: "s1", at: 0, from: "them", text: "Morning! Did the new beans arrive?", time: "9:38 AM", reactions: {}, seed: true },
  { id: "s2", at: 0, from: "them", text: "The Ethiopian roast, I mean. I want to try it for Saturday.", time: "9:38 AM", reactions: {}, seed: true },
  { id: "s3", at: 120000, from: "me", text: "They did, two bags this morning ☕", time: "9:40 AM", reactions: {}, seed: true },
  { id: "s4", at: 120000, from: "me", text: "Roasted on Monday, so they're at their best this week.", time: "9:40 AM", reactions: { "❤️": 2 }, status: "read", seed: true },
  {
    id: "s5",
    at: 240000,
    from: "them",
    text: "Perfect. Here's the plan for Saturday: we open at eight, so I'll come in at seven to dial in the grinder. The Ethiopian goes on filter first, then we'll try it as espresso around ten once the morning rush dies down. If it's too bright as espresso we'll keep it on filter all day and put the house blend back on the machine. I'll write tasting notes for the board, and could you print a few cards for the counter? Oh, and remind me to order more oat milk, we ran out twice last week.",
    time: "9:42 AM",
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
  typing: { group: "Arriving", type: "checkbox", label: "Typing indicator", value: true },
  streaming: { group: "Arriving", type: "checkbox", label: "Stream text (bubble grows)", value: false },

  flyIn: { group: "Sending", type: "checkbox", label: "Fly from input", value: false },
  status: { group: "Sending", type: "checkbox", label: "Delivery status", value: true },
  shake: { group: "Sending", type: "checkbox", label: "Error shake", value: true },
  failures: { group: "Sending", type: "checkbox", label: "Simulate failures", value: true },

  pop: { group: "Reactions", type: "checkbox", label: "Reaction pop", value: true },
  rolling: { group: "Reactions", type: "checkbox", label: "Rolling count", value: true },
  doubleClick: { group: "Reactions", type: "checkbox", label: "Double-click to react", value: true },
  picker: { group: "Reactions", type: "checkbox", label: "Reaction picker", value: true },
  magnify: { group: "Reactions", type: "checkbox", label: "Magnify emojis", value: false },

  lift: { group: "Interaction", type: "checkbox", label: "Hover lift", value: false },
  selectable: { group: "Interaction", type: "checkbox", label: "Selectable text", value: true },
  swipe: { group: "Interaction", type: "checkbox", label: "Swipe to reply", value: true },
  suggestions: { group: "Interaction", type: "checkbox", label: "Suggested replies", value: true },
  readMore: { group: "Interaction", type: "checkbox", label: "Read more", value: true },

  joined: { group: "Grouping", type: "checkbox", label: "Joined corners", value: false },
} satisfies ControlSchema

const FAIL_CHANCE = 0.25

function now() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

const GROUP_GAP_MS = 60_000

function groupMessages(messages: Message[]) {
  const groups: { id: string; from: Message["from"]; messages: Message[] }[] = []
  for (const message of messages) {
    const last = groups[groups.length - 1]
    const previous = last?.messages[last.messages.length - 1]
    if (last && previous && last.from === message.from && message.at - previous.at < GROUP_GAP_MS) {
      last.messages.push(message)
    } else {
      groups.push({ id: message.id, from: message.from, messages: [message] })
    }
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
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [autoReply, setAutoReply] = React.useState(true)
  const autoReplyRef = React.useRef(autoReply)
  React.useEffect(() => {
    autoReplyRef.current = autoReply
  })
  const replyIndex = React.useRef(0)
  const pendingSuggestions = React.useRef(new Map<string, () => void>())
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

  function unreact(id: string, emoji: string) {
    setMessages((current) =>
      current.map((m) => {
        if (m.id !== id || !m.mine?.includes(emoji)) return m
        const { [emoji]: count = 0, ...others } = m.reactions
        return {
          ...m,
          reactions: count > 1 ? { ...others, [emoji]: count - 1 } : others,
          mine: m.mine.filter((e) => e !== emoji),
        }
      })
    )
  }

  function react(id: string, emoji: string) {
    setMessages((current) =>
      current.map((m) => {
        if (m.id !== id || m.mine?.includes(emoji)) return m
        return {
          ...m,
          reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] ?? 0) + 1 },
          mine: [...(m.mine ?? []), emoji],
        }
      })
    )
  }

  function botReply() {
    const id = crypto.randomUUID()
    const text = replies[replyIndex.current % replies.length]
    const nextSuggestions = suggestionSets[replyIndex.current % suggestionSets.length]
    replyIndex.current += 1
    const stream = values.streaming
    const showSuggestions = () => setSuggestions({ id: crypto.randomUUID(), texts: nextSuggestions })
    if (stream) pendingSuggestions.current.set(id, showSuggestions)

    setMessages((current) => [
      ...current,
      { id, from: "them", text, time: now(), at: Date.now(), reactions: {}, typing: values.typing, stream },
    ])
    const reveal = () => {
      update(id, { typing: false })
      if (!stream) later(showSuggestions, 300)
    }
    if (values.typing) later(reveal, 1400)
    else if (!stream) later(showSuggestions, 300)
  }

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
        if (autoReplyRef.current) botReply()
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
        at: Date.now(),
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
    incoming.forEach((text, i) =>
      later(
        () =>
          setMessages((current) => [
            ...current,
            { id: crypto.randomUUID(), from: "them", text, time: now(), at: Date.now(), reactions: {} },
          ]),
        i * 700
      )
    )
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
        enterFrom={message.flyFrom}
        shake={values.shake}
        lift={values.lift}
        selectable={values.selectable}
        swipeToReply={values.swipe}
        onReply={() => {
          setReplyTo(message)
          inputRef.current?.focus()
        }}
        onReact={(emoji) => react(message.id, emoji)}
        onUnreact={(emoji) => unreact(message.id, emoji)}
        reacted={message.mine}
        doubleClickReact={values.doubleClick}
        picker={values.picker}
        magnify={values.magnify}
      >
        <BubbleContent typing={message.typing} grow={message.stream} layoutId={message.layoutId}>
          {message.replyTo && (
            <span className="line-clamp-1 border-l-2 border-current/40 px-2 text-xs opacity-80">
              {message.replyTo}
            </span>
          )}
          <BubbleText
            text={message.text}
            time={message.time}
            stream={message.stream}
            onStreamEnd={() => {
              const show = pendingSuggestions.current.get(message.id)
              pendingSuggestions.current.delete(message.id)
              if (show) later(show, 300)
            }}
            collapsible={values.readMore}
          />
        </BubbleContent>
        <AnimatePresence initial={false}>
          {total > 0 && (
            <BubbleReactions
              key="reactions"
              align={mine ? "end" : "start"}
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
      <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
        <h2 className="text-sm font-medium text-muted-foreground">
          Send a message, double-click or hover a bubble to react, swipe one to reply.
        </h2>
        <div className="flex shrink-0 items-center gap-4">
          <Label className="text-sm font-normal text-muted-foreground">
            <Checkbox checked={autoReply} onCheckedChange={setAutoReply} />
            Auto reply
          </Label>
          <Button variant="outline" size="sm" onClick={simulateIncoming}>
            <MessageSquarePlusIcon />
            Receive messages
          </Button>
        </div>
      </div>
      <div className="flex h-[75vh] flex-col overflow-hidden rounded-lg border max-md:mx-[calc(50%-46vw)]">
        <BubbleThread className="min-h-0 flex-1 px-6 py-6 max-md:px-4">
          {groupMessages(messages).map((group) => (
            <BubbleGroup key={group.id} joined={values.joined}>
              {group.messages.map(renderMessage)}
            </BubbleGroup>
          ))}
          <AnimatePresence mode="popLayout">
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
         
          <div className="flex items-end gap-2 max-md:flex-wrap">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }}
              placeholder="Message"
              aria-label="Message"
              className="max-h-24 min-h-8 w-full max-md:flex-1 min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base leading-snug transition-colors outline-none field-sizing-content placeholder:text-muted-foreground focus-visible:border-primary md:text-sm dark:bg-input/30"
            />
            <Select
              items={variants}
              value={variant}
              onValueChange={(value) => value && setVariant(value as Variant)}
            >
              <SelectTrigger aria-label="Bubble variant" className="w-32 shrink-0 max-md:order-last max-md:w-full">
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
