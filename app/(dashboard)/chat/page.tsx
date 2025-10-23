"use client"

import React, { useMemo, useRef, useState } from "react"
import {
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react"

type Msg =
  | { id: string; from: "me" | "them"; ts: number; type: "text"; text: string }
  | { id: string; from: "me" | "them"; ts: number; type: "image"; caption?: string; src?: string }
  | { id: string; from: "me" | "them"; ts: number; type: "audio"; duration: string }

type Chat = {
  id: string
  name: string
  last: string
  time: string
  unread?: number
  avatar?: string // optional url; we’ll fallback to initials
}

const chats: Chat[] = [
  { id: "g1", name: "Design chat", last: "Jessie Rollins sent a voice…", time: "4m", unread: 1 },
  { id: "c1", name: "Osman Campos", last: "You: Hey! We are ready to…", time: "20m" },
  { id: "c2", name: "Jayden Church", last: "I prepared some varia…", time: "1h" },
  { id: "c3", name: "Jacob Mcleod", last: "And send me the proto…", time: "10m", unread: 3 },
  { id: "c4", name: "Jasmin Lowery", last: "You: Ok! Let’s discuss it on th…", time: "20m" },
  { id: "c5", name: "Zaid Myers", last: "You: Hey! We are ready to in…", time: "45m" },
  { id: "c6", name: "Anthony Cordanes", last: "What do you think?", time: "1d" },
  { id: "c7", name: "Conner Garcia", last: "You: I think it would be perfe…", time: "2d" },
  { id: "c8", name: "Vanessa Cox", last: "Voice message", time: "2d" },
]

const seedConversation: Record<string, Msg[]> = {
  g1: [
    {
      id: "m1",
      from: "them",
      type: "text",
      text: "I added new flows to our design system. Now you can use them for your projects!",
      ts: Date.now() - 1000 * 60 * 50,
    },
    { id: "m2", from: "them", type: "text", text: "Hey guys! Important news!", ts: Date.now() - 1000 * 60 * 46 },
    {
      id: "m3",
      from: "them",
      type: "text",
      text: "Our intern @jchurch has successfully completed his probationary period and is now part of our team!",
      ts: Date.now() - 1000 * 60 * 42,
    },
    {
      id: "m4",
      from: "me",
      type: "text",
      text: "Jaden, my congratulations! I will be glad to work with you on a new project 😌",
      ts: Date.now() - 1000 * 60 * 40,
    },
    { id: "m5", from: "them", type: "image", caption: "Kickoff meeting", ts: Date.now() - 1000 * 60 * 38 },
    { id: "m6", from: "them", type: "audio", duration: "0:30", ts: Date.now() - 1000 * 60 * 35 },
  ],
}

function initials(name: string) {
  const parts = name.trim().split(" ")
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
}

export default function ChatDashboardPage() {
  const [selected, setSelected] = useState<string>(chats[0].id)
  const [query, setQuery] = useState("")
  const [composer, setComposer] = useState("")
  const [conversations, setConversations] = useState<Record<string, Msg>>(seedConversation)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const list = useMemo(() => conversations[selected] ?? [], [conversations, selected])
  const filteredChats = useMemo(
    () =>
      chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.last.toLowerCase().includes(query.toLowerCase())),
    [query]
  )

  const send = () => {
    if (!composer.trim()) return
    const msg: Msg = { id: crypto.randomUUID(), from: "me", ts: Date.now(), type: "text", text: composer.trim() }
    setConversations((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), msg] }))
    setComposer("")
    setTimeout(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 20)
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "#E7E3FF" }}>
      <div className="mx-auto max-w-[1400px] rounded-3xl bg-white/90 p-3 shadow-xl ring-1 ring-black/5">
        {/* 3 columns layout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          {/* Left: Chat list */}
          <aside className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
              />
            </div>

            <div className="mt-3 h-[72vh] overflow-y-auto pr-1">
              {filteredChats.map((c) => {
                const active = selected === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      active ? "border-violet-300 bg-violet-50" : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-sm font-semibold text-gray-600">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-[15px] font-semibold">{c.name}</p>
                        <span className="ml-2 shrink-0 text-xs text-gray-500">{c.time}</span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{c.last}</p>
                    </div>
                    {c.unread ? (
                      <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-2 text-xs font-medium text-white">
                        {c.unread}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Center: Main chat */}
          <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {/* Header */}
            <div className="flex items-start justify-between border-b px-4 py-3 md:items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Design chat</h2>
                <p className="text-xs text-gray-500">23 members, 10 online</p>
              </div>
              <div className="hidden gap-2 md:flex">
                <IconButton icon={<Search className="h-4 w-4" />} />
                <IconButton icon={<Phone className="h-4 w-4" />} />
                <IconButton icon={<Video className="h-4 w-4" />} />
                <IconButton icon={<MoreVertical className="h-4 w-4" />} />
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
              <div className="mx-auto max-w-3xl space-y-3">
                {list.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No messages yet. Start the conversation.</p>
                ) : null}

                {list.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </div>
            </div>

            {/* Composer */}
            <div className="border-t bg-white/80 px-3 py-3 backdrop-blur md:px-6">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <IconButton className="rounded-xl" icon={<Paperclip className="h-4 w-4" />} />
                <IconButton className="rounded-xl" icon={<ImageIcon className="h-4 w-4" />} />
                <div className="relative flex-1">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Your message"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
                  />
                </div>
                <button
                  onClick={send}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
                <IconButton className="rounded-xl" variant="secondary" icon={<Mic className="h-4 w-4" />} />
              </div>
            </div>
          </section>

          {/* Right: Group info */}
          <aside className="hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:block">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Group Info</h3>
            </div>

            {/* Files */}
            <div className="mt-4 rounded-xl border">
              <div className="border-b px-3 py-2 text-sm font-medium">Files</div>
              <div className="grid grid-cols-2 gap-3 p-3 text-xs text-gray-600">
                <Stat label="265 photos" />
                <Stat label="13 videos" />
                <Stat label="378 files" />
                <Stat label="21 audio files" />
                <Stat label="45 shared links" />
                <Stat label="2 589 voice messages" />
              </div>
              <div className="flex gap-3 px-3 pb-3">
                <div className="aspect-video w-1/2 overflow-hidden rounded-xl bg-gray-200" />
                <div className="aspect-video w-1/2 overflow-hidden rounded-xl bg-gray-200" />
              </div>
            </div>

            {/* Members */}
            <div className="mt-4 rounded-xl border">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-medium">23 members</div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">10 online</span>
              </div>
              <div className="h-[360px] overflow-y-auto p-2 pr-1">
                {["Tanisha Combs", "Alex Hunt", "Jasmin Lowery", "Max Padilla", "Jessie Rollins", "Lukas Mcgowan"].map((n, i) => (
                  <div key={n} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                      {initials(n)}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium leading-none">{n}</div>
                      <div className="text-xs text-gray-500">{i === 0 ? "admin" : "member"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ---------- UI bits ---------- */

function IconButton({
  icon,
  className = "",
  variant = "outline",
}: {
  icon: React.ReactNode
  className?: string
  variant?: "outline" | "secondary"
}) {
  return (
    <button
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition",
        variant === "outline" ? "border border-gray-200 bg-white hover:bg-gray-50" : "bg-gray-100 hover:bg-gray-200",
        className,
      ].join(" ")}
      type="button"
    >
      {icon}
    </button>
  )
}

function Stat({ label }: { label: string }) {
  return <div className="rounded-lg border bg-white px-3 py-2 text-center">{label}</div>
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isMe = msg.from === "me"

  if (msg.type === "text") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={[
            "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
            isMe ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-800",
          ].join(" ")}
        >
          {msg.text}
        </div>
      </div>
    )
  }

  if (msg.type === "image") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="w-[260px] overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-200 to-gray-100" />
          {msg.caption ? <div className="px-3 py-2 text-sm">{msg.caption}</div> : null}
        </div>
      </div>
    )
  }

  // audio mock
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[90%] items-center gap-3 rounded-2xl border bg-white px-3 py-2 shadow-sm">
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white">
          <Mic className="h-4 w-4" />
        </button>
        <div className="h-1 w-40 rounded-full bg-gray-200">
          <div className="h-1 w-1/3 rounded-full bg-violet-600" />
        </div>
        <span className="text-xs text-gray-500">{msg.duration}</span>
      </div>
    </div>
  )
}
