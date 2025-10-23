"use client"

import React, { useMemo, useRef, useState } from "react"
import {
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Eye,
  Heart,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Star,
  X,
  Video,
  FileText,
  Link,
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
  { id: "g1", name: "Design chat", last: "Jessie Rollins sent a voice…", time: "4m", unread: 1, avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "c1", name: "Osman Campos", last: "You: Hey! We are ready to…", time: "20m", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "c2", name: "Jayden Church", last: "I prepared some varia…", time: "1h", avatar: "https://i.pravatar.cc/150?img=13" },
  { id: "c3", name: "Jacob Mcleod", last: "And send me the proto…", time: "10m", unread: 3, avatar: "https://i.pravatar.cc/150?img=14" },
  { id: "c4", name: "Jasmin Lowery", last: "You: Ok! Let's discuss it on th…", time: "20m", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "c5", name: "Zaid Myers", last: "You: Hey! We are ready to in…", time: "45m", avatar: "https://i.pravatar.cc/150?img=15" },
  { id: "c6", name: "Anthony Cordanes", last: "What do you think?", time: "1d", avatar: "https://i.pravatar.cc/150?img=16" },
  { id: "c7", name: "Conner Garcia", last: "You: I think it would be perfe…", time: "2d", avatar: "https://i.pravatar.cc/150?img=17" },
  { id: "c8", name: "Vanessa Cox", last: "Voice message", time: "2d", avatar: "https://i.pravatar.cc/150?img=9" },
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
  const [conversations, setConversations] = useState<Record<string, Msg[]>>(seedConversation)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [expandedFile, setExpandedFile] = useState<string | null>("photos")

  const list = useMemo<Msg[]>(() => conversations[selected] ?? [], [conversations, selected])
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
    <div className="dark:bg-gray-900" style={{ backgroundColor: "#fff" }}>
      <div className="mx-auto  bg-white/90 dark:bg-gray-800/90 p-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10 pb-10">
        {/* 4 columns layout on xl (nav rail + 3 panes) */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)_280px] ">
          
          {/* Left: Chat list */}
          <aside className="rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white"
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
                      active ? "border-primary/40 bg-primary/10 dark:border-primary/60 dark:bg-primary/20" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {initials(c.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold leading-tight dark:text-white">{c.name}</p>
                        
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-tight text-gray-500 dark:text-gray-400">{c.last}</p>
                    </div>
                  
                    {/* Seen / pin indicators */}
                    {c.id === "c4" || c.id === "c7" ? (
                      <CheckCheck className="h-4 w-4 shrink-0 text-primary" />
                    ) : c.id === "g1" ? (
                      <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                    ) : null}
                    {c.unread ? (
                      <span className="shrink-0 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
                        {c.unread}
                      </span>
                    ) : null}
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{c.time}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Center: Main chat */}
          <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            {/* Header */}
            <div className="flex items-start justify-between border-b dark:border-gray-700 px-4 py-3 md:items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight dark:text-white">Design chat</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">23 members, 10 online</p>
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
              <div className="mx-auto  space-y-4">
                {list.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No messages yet. Start the conversation.</p>
                ) : null}

                {list.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </div>
            </div>

            {/* Composer */}
            <div className="border-t bg-white/80 dark:bg-gray-800/80 px-3 py-3 backdrop-blur md:px-6">
              <div className="flex items-end gap-2">
                <IconButton className="rounded-xl h-11 w-10" icon={<Paperclip className="h-4 w-4" />} />
                <IconButton className="rounded-xl h-11 w-10" icon={<ImageIcon className="h-4 w-4" />} />
                <div className="relative flex-1">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Your message"
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={send}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
                <IconButton className="rounded-xl h-11 w-10" variant="secondary" icon={<Mic className="h-4 w-4" />} />
              </div>
            </div>
          </section>

          {/* Right: Group info */}
          <aside className="hidden rounded-2xl bg-primary/10 dark:bg-gray-800/50 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10 lg:block">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Group Info</h3>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Files */}
            <div className="mt-4 rounded-2xl border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
              <div className="border-b dark:border-gray-700 px-4 py-3 text-base font-semibold dark:text-white">
                Files
              </div>
              <div className="divide-y dark:divide-gray-700">
                {/* Photos */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "photos" ? null : "photos")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">265 photos</span>
                  </div>
                  {expandedFile === "photos" ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {expandedFile === "photos" && (
                  <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50/30 dark:bg-gray-900/30">
                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-300 dark:bg-gray-700">
                      <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300" alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-300 dark:bg-gray-700">
                      <img src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=300" alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Videos */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "videos" ? null : "videos")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">13 videos</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Files */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "files" ? null : "files")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">378 files</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Audio files */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "audio" ? null : "audio")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">21 audio files</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Shared links */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "links" ? null : "links")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Link className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">45 shared links</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Voice messages */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "voice" ? null : "voice")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">2 589 voice messages</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="mt-4 rounded-2xl border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
              <div className="flex items-center justify-between border-b dark:border-gray-700 px-3 py-2">
                <div className="text-sm font-medium dark:text-white">23 members</div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">10 online</span>
              </div>
              <div className="h-[360px] overflow-y-auto p-2 pr-1">
                {["Tanisha Combs", "Alex Hunt", "Jasmin Lowery", "Max Padilla", "Jessie Rollins", "Lukas Mcgowan"].map((n, i) => (
                  <div key={n} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <img 
                      src={`https://i.pravatar.cc/150?img=${20 + i}`} 
                      alt={n} 
                      className="h-8 w-8 shrink-0 rounded-full object-cover" 
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="font-medium leading-tight dark:text-white">{n}</div>
                      <div className="text-xs leading-tight text-gray-500 dark:text-gray-400">{i === 0 ? "admin" : "member"}</div>
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
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 transition",
        variant === "outline" ? "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
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
      <div className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <AvatarCircle name="Alex Hunt" avatar="https://i.pravatar.cc/150?img=33" />}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div
            className={[
              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
              isMe ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white",
            ].join(" ")}
          >
            {msg.text}
          </div>
          <MetaRow isMe={isMe} />
        </div>
        {isMe && <MiniAvatarRight />}
      </div>
    )
  }

  if (msg.type === "image") {
    return (
      <div className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <AvatarCircle name="Jessie Rollins" avatar="https://i.pravatar.cc/150?img=5" />}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div className="w-[300px] overflow-hidden rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800" />
            {msg.caption ? <div className="px-3 py-2 text-sm dark:text-white">{msg.caption}</div> : null}
          </div>
          <MetaRow isMe={isMe} withMedia />
        </div>
      </div>
    )
  }

  // audio mock
  return (
    <div className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <AvatarCircle name="Jessie Rollins" avatar="https://i.pravatar.cc/150?img=5" />}
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div className="flex max-w-[90%] items-center gap-3 rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm">
          <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mic className="h-4 w-4" />
          </button>
          <div className="h-1 w-40 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1 w-1/3 rounded-full bg-primary" />
          </div>
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{msg.duration}</span>
        </div>
        <MetaRow isMe={isMe} />
      </div>
    </div>
  )
}

function AvatarCircle({ name, avatar }: { name: string; avatar?: string }) {
  return avatar ? (
    <img src={avatar} alt={name} className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
      {initials(name)}
    </div>
  )
}

function MiniAvatarRight() {
  return (
    <img 
      src="https://i.pravatar.cc/150?img=45" 
      alt="You" 
      className="mt-0.5 ml-1 hidden h-6 w-6 shrink-0 rounded-full object-cover md:flex" 
    />
  )
}

function MetaRow({ isMe, withMedia = false }: { isMe: boolean; withMedia?: boolean }) {
  return (
    <div className={`mt-1 flex items-center gap-2.5 ${isMe ? "justify-end" : "justify-start"} text-[11px] text-gray-500 dark:text-gray-400`}>
      <div className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3" />
        <span>5</span>
      </div>
      <div className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" />
        <span>{withMedia ? 10 : 16}</span>
      </div>
      <span>09:24</span>
    </div>
  )
}
