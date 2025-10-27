"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
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
  FileText,
  Link,
} from "lucide-react"
import { getApiClient, type ChatConversationRecord, type MessageRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/lib/useSocket"

type Msg =
  | { id: string; from: "me" | "them"; ts: number; type: "text"; text: string }
  | { id: string; from: "me" | "them"; ts: number; type: "image"; caption?: string; src?: string }
  | { id: string; from: "me" | "them"; ts: number; type: "file"; filename?: string; src?: string }

function initials(name: string) {
  const parts = name.trim().split(" ")
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
}

export default function ChatDashboardPage() {
  const [tab, setTab] = useState<"my" | "waiting">("my")
  const [myChats, setMyChats] = useState<ChatConversationRecord[]>([])
  const [waitingChats, setWaitingChats] = useState<ChatConversationRecord[]>([])
  const [selected, setSelected] = useState<string>("")
  const [selectedIsWaiting, setSelectedIsWaiting] = useState(false)
  const [query, setQuery] = useState("")
  const [composer, setComposer] = useState("")
  const [conversations, setConversations] = useState<Record<string, Msg[]>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>("")
  const [isListening, setIsListening] = useState(false)
  const [attachment, setAttachment] = useState<{
    data: string
    name: string
    type: string
  } | null>(null)
  const [expandedFile, setExpandedFile] = useState<string | null>("photos")
  const { toast } = useToast()
  const [staffId, setStaffId] = useState<string | null>(null)
  const [taking, setTaking] = useState(false)
  const prevConversationRef = useRef<string | null>(null)
  const { socket, joinConversation, leaveConversation, on, off } = useSocket()
  // Track last read message index per conversation to support "new messages" UX
  const [readIndexMap, setReadIndexMap] = useState<Record<string, number>>({})
  const prevListLengthRef = useRef<number>(0)

  const isImageLike = (s?: string | null, mimeHint?: string) => {
    if (!s) return false
    if (mimeHint && mimeHint.startsWith("image/")) return true
    if (s.startsWith("data:image/")) return true
    return /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)(\?|#|$)/i.test(s)
  }

  const extractLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    return Array.from(text.matchAll(urlRegex)).map((m) => m[0])
  }

  const list = useMemo<Msg[]>(() => conversations[selected] ?? [], [conversations, selected])
  const lastReadIndex = readIndexMap[selected] ?? -1
  const unreadCount = Math.max(0, list.length - (lastReadIndex + 1))
  const firstUnreadIndex = unreadCount > 0 ? lastReadIndex + 1 : -1

  // Derive photos, files, and links from current conversation
  const photos = useMemo(() => list.filter((m) => m.type === "image" && m.src), [list])
  const fileItems = useMemo(() => list.filter((m) => m.type === "file" && m.src), [list])
  const linkItems = useMemo(() => {
    const links: string[] = []
    list.forEach((m) => {
      if (m.type === "text") {
        const found = extractLinks(m.text)
        links.push(...found)
      }
      if (m.type === "image" && m.caption) {
        const found = extractLinks(m.caption)
        links.push(...found)
      }
    })
    return links
  }, [list])

  const uiChats = useMemo(() => (tab === "my" ? myChats : waitingChats), [tab, myChats, waitingChats])
  const filteredChats = useMemo(() => {
    const q = query.toLowerCase()
    return uiChats.filter((c) => {
      const name = typeof c.customerId === "object" ? (c.customerId.customerName || "") : ""
      return name.toLowerCase().includes(q) || c._id.toLowerCase().includes(q)
    })
  }, [uiChats, query])

  useEffect(() => {
    const load = async () => {
      try {
        const api = getApiClient()
        const prof = await api.getProfile()
        setStaffId(prof.data._id)
        const [my, waiting] = await Promise.all([
          api.getStaffConversations(prof.data._id),
          api.getChatWaiting({ limit: 100 }),
        ])
        setMyChats(my.data)
        setWaitingChats(waiting.data.conversations)
        const initial = (my.data[0]?._id || waiting.data.conversations[0]?._id) ?? ""
        const isWaiting = initial ? waiting.data.conversations.some((c) => c._id === initial) : false
        setSelected(initial)
        setSelectedIsWaiting(isWaiting)
        if (initial) await loadConversation(initial)
      } catch (e: any) {
        toast({ title: "Không tải được dữ liệu chat", description: e?.message || "Failed to load chats", variant: "destructive" })
      }
    }
    load()
  }, [])

  const mapMessages = (arr: MessageRecord[]): Msg[] =>
    arr.map((m) => {
      const from = m.senderRole === "user" ? ("them" as const) : ("me" as const)
      const ts = new Date(m.createdAt).getTime()
      if (m.attachment && isImageLike(m.attachment)) {
        return { id: m._id, from, ts, type: "image", caption: m.content || undefined, src: m.attachment }
      }
      if (m.attachment && !isImageLike(m.attachment)) {
        return { id: m._id, from, ts, type: "file", filename: undefined, src: m.attachment }
      }
      return { id: m._id, from, ts, type: "text", text: m.content }
    })

  const mapSocketMessage = (m: any): Msg => {
    const from = m.senderRole === "user" ? ("them" as const) : ("me" as const)
    const ts = m.createdAt ? new Date(m.createdAt).getTime() : Date.now()
    if (m.attachment && isImageLike(m.attachment)) {
      return { id: m.id || m._id || crypto.randomUUID(), from, ts, type: "image", caption: m.content || undefined, src: m.attachment }
    }
    if (m.attachment && !isImageLike(m.attachment)) {
      return { id: m.id || m._id || crypto.randomUUID(), from, ts, type: "file", filename: undefined, src: m.attachment }
    }
    return { id: m.id || m._id || crypto.randomUUID(), from, ts, type: "text", text: m.content }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const api = getApiClient()
      // leave previous joined conversation room
      if (prevConversationRef.current && prevConversationRef.current !== conversationId) {
        try {
          leaveConversation(prevConversationRef.current)
        } catch { }
      }

      const detail = await api.getConversationDetail(conversationId)
      setConversations((prev) => ({ ...prev, [conversationId]: mapMessages(detail.data.messages) }))
      // Mark all as read on initial open
      setReadIndexMap((prev) => ({ ...prev, [conversationId]: Math.max(0, detail.data.messages.length - 1) }))
      setTimeout(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, 30)
      // join conversation room on socket so we receive realtime messages
      try {
        joinConversation(conversationId)
        prevConversationRef.current = conversationId
      } catch { }

      await api.markConversationRead(conversationId)
    } catch (e: any) {
      toast({ title: "Không tải được hội thoại", description: e?.message || "Failed to load conversation", variant: "destructive" })
    }
  }

  // Socket listeners: handle incoming messages and new waiting chats
  useEffect(() => {
    if (!socket) return

    const onMessageNew = (msg: any) => {
      try {
        const convId = msg.conversationId
        const mapped = mapSocketMessage(msg)
        if (!convId) return
        // If currently viewing this conversation, append message
        if (convId === selected) {
          setConversations((prev) => ({ ...prev, [convId]: [...(prev[convId] ?? []), mapped] }))
          // auto-scroll if at bottom
          setTimeout(() => {
            const el = scrollRef.current
            if (el) el.scrollTop = el.scrollHeight
          }, 20)
        } else {
          // message for other conversation: ensure we keep it in memory for later
          setConversations((prev) => ({ ...prev, [convId]: [...(prev[convId] ?? []), mapped] }))
        }
      } catch (err) {
        console.warn("onMessageNew error", err)
      }
    }

    const onChatWaiting = (data: any) => {
      try {
        if (!data || !data.conversationId) return
        const exists = waitingChats.some((c) => c._id === data.conversationId)
        if (!exists) {
          const stub: ChatConversationRecord = {
            _id: data.conversationId,
            customerId: (data.customerId && typeof data.customerId === 'object') ? data.customerId : { _id: data.customerId || data.customerId, customerName: data.customerName || 'Customer' },
            assignedStaffId: null,
            lastAssignedStaff: null,
            status: "waiting",
            assignmentHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setWaitingChats((prev) => [stub, ...prev])
        }
      } catch (err) {
        console.warn("onChatWaiting error", err)
      }
    }

    socket.on("message:new", onMessageNew)
    socket.on("chat:waiting", onChatWaiting)

    return () => {
      socket.off("message:new", onMessageNew)
      socket.off("chat:waiting", onChatWaiting)
    }
  }, [socket, selected, waitingChats])

  // Whenever we are at the bottom and the list changes, advance read pointer
  useEffect(() => {
    if (!selected) return
    if (atBottom) {
      setReadIndexMap((prev) => ({ ...prev, [selected]: Math.max(0, list.length - 1) }))
    }
  }, [atBottom, list.length, selected])

  // Remember previous length (used to detect newly appended messages while scrolled up)
  useEffect(() => {
    prevListLengthRef.current = list.length
  }, [list.length, selected])

  const send = async (overrideText?: string) => {
    const hasText = !!(overrideText ?? composer).trim()
    const hasAttachment = !!attachment?.data
    if ((!hasText && !hasAttachment) || !selected || !staffId) return
    if (selectedIsWaiting) {
      toast({ title: "Chưa nhận đối thoại", description: "Hãy nhấn 'Nhận đối thoại' trước khi trả lời", variant: "destructive" })
      return
    }
    const text = (overrideText ?? composer).trim()
    try {
      const api = getApiClient()
      await api.sendStaffMessage(selected, { staffId, content: text, attachment: attachment?.data || null })
      const newMsgs: Msg[] = []
      if (attachment?.data && isImageLike(attachment.data, attachment.type)) {
        newMsgs.push({ id: crypto.randomUUID(), from: "me", ts: Date.now(), type: "image", caption: text || undefined, src: attachment.data })
      } else if (attachment?.data) {
        newMsgs.push({ id: crypto.randomUUID(), from: "me", ts: Date.now(), type: "file", filename: attachment.name, src: attachment.data })
      } else if (hasText) {
        newMsgs.push({ id: crypto.randomUUID(), from: "me", ts: Date.now(), type: "text", text })
      }
      setConversations((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), ...newMsgs] }))
      setComposer("")
      setAttachment(null)
      setTimeout(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, 20)
    } catch (e: any) {
      toast({ title: "Gửi tin nhắn thất bại", description: e?.message || "Failed to send message", variant: "destructive" })
    }
  }

  const startListening = () => {
    try {
      if (typeof window === "undefined") return
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) {
        toast({ title: "Trình duyệt không hỗ trợ STT", description: "Web Speech API không khả dụng", variant: "destructive" })
        return
      }
      const rec = new SR()
      rec.lang = "vi-VN"
      rec.interimResults = true
      rec.continuous = true
      transcriptRef.current = ""
      rec.onresult = (e: any) => {
        let interim = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (res.isFinal) transcriptRef.current += res[0].transcript + " "
          else interim += res[0].transcript
        }
        setComposer((prev) => (prev.trim().length > 0 ? prev : (transcriptRef.current + interim).trim()))
      }
      rec.onerror = () => setIsListening(false)
      rec.onend = async () => {
        const finalText = transcriptRef.current.trim()
        setIsListening(false)
        if (finalText) {
          if (selectedIsWaiting) {
            setComposer(finalText)
            toast({ title: "Chưa nhận đối thoại", description: "Hãy nhận đối thoại trước khi gửi", variant: "destructive" })
          } else {
            await send(finalText)
          }
        }
      }
      recognitionRef.current = rec
      rec.start()
      setIsListening(true)
    } catch (err: any) {
      toast({ title: "Không thể bật micro", description: err?.message || "Kiểm tra quyền micro của trình duyệt", variant: "destructive" })
      setIsListening(false)
    }
  }

  const stopListening = () => {
    const rec = recognitionRef.current
    if (rec) {
      try { rec.stop() } catch { }
    }
  }

  const takeChat = async () => {
    if (!selected || !staffId) return
    try {
      setTaking(true)
      const api = getApiClient()
      await api.takeConversation(selected, staffId)
      // move from waiting to my
      const conv = waitingChats.find((c) => c._id === selected)
      if (conv) {
        setWaitingChats((prev) => prev.filter((c) => c._id !== selected))
        setMyChats((prev) => [{ ...conv, status: "active", assignedStaffId: staffId }, ...prev])
        setTab("my")
        setSelectedIsWaiting(false)
      }
      toast({ title: "Đã nhận đối thoại" })
    } catch (e: any) {
      toast({ title: "Nhận đối thoại thất bại", description: e?.message || "Failed to take chat", variant: "destructive" })
    } finally {
      setTaking(false)
    }
  }

  return (

    <div className="dark:bg-gray-900 " style={{ backgroundColor: "#fff" }}>
      <div className="mx-auto  bg-white/90 dark:bg-gray-800/90 p-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10 pb-10">
        {/* 4 columns layout on xl (nav rail + 3 panes) */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)_280px] ">

          {/* Left: Chat list */}
          <aside className="rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            {/* Tabs */}
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                className={`rounded-xl px-3 py-2 text-sm border ${tab === "my" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 dark:border-gray-700"}`}
                onClick={() => setTab("my")}
              >
                Đã nhận
              </button>
              <button
                className={`rounded-xl px-3 py-2 text-sm border ${tab === "waiting" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 dark:border-gray-700"}`}
                onClick={() => setTab("waiting")}
              >
                Đang chờ
              </button>
            </div>

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
                const active = selected === c._id
                const name = typeof c.customerId === "object" ? (c.customerId.customerName || "—") : "—"
                return (
                  <button
                    key={c._id}
                    onClick={async () => {
                      setSelected(c._id)
                      const isWaiting = tab === "waiting"
                      setSelectedIsWaiting(isWaiting)
                      await loadConversation(c._id)
                    }}
                    className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-primary/40 bg-primary/10 dark:border-primary/60 dark:bg-primary/20" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {initials(name || "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold leading-tight dark:text-white">{name}</p>
                        {tab === "waiting" ? (
                          <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-tight text-gray-500 dark:text-gray-400">#{c._id.slice(-6)}</p>
                    </div>

                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{new Date(c.updatedAt).toLocaleTimeString()}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Center: Main chat */}
          <section className="flex h-[82vh] flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b dark:border-gray-700 px-4 py-3 md:items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight dark:text-white">
                  {selected ? (uiChats.find((c) => c._id === selected) ? (typeof uiChats.find((c) => c._id === selected)!.customerId === 'object' ? (uiChats.find((c) => c._id === selected)!.customerId as any).customerName : 'Conversation') : 'Conversation') : 'No selection'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedIsWaiting ? 'Waiting for staff to take this chat' : 'Active conversation'}
                </p>
              </div>
              <div className="hidden gap-2 md:flex items-center">
                {selected && selectedIsWaiting ? (
                  <button
                    onClick={takeChat}
                    disabled={taking}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    <Star className="h-4 w-4" />
                    {taking ? 'Đang nhận…' : 'Nhận đối thoại'}
                  </button>
                ) : null}
                {/* <IconButton icon={<Search className="h-4 w-4" />} />
                <IconButton icon={<Phone className="h-4 w-4" />} />
                <IconButton icon={<Video className="h-4 w-4" />} />
                <IconButton icon={<MoreVertical className="h-4 w-4" />} /> */}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-5 md:px-8 scroll-smooth"
              onScroll={(e) => {
                const el = e.currentTarget
                const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
                setAtBottom(nearBottom)
              }}
            >
              <div className="mx-auto space-y-5">
                {list.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No messages yet. Start the conversation.</p>
                ) : null}

                {list.map((m, idx) => (
                  <React.Fragment key={m.id}>
                    {firstUnreadIndex === idx && unreadCount > 0 ? (
                      <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-primary/30 dark:bg-primary/40" />
                        <span className="text-xs px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium">Tin nhắn mới</span>
                        <div className="h-px flex-1 bg-primary/30 dark:bg-primary/40" />
                      </div>
                    ) : null}
                    <div id={`msg-${m.id}`} data-mid={m.id}>
                      <MessageBubble msg={m} />
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {!atBottom && unreadCount > 0 ? (
                <div className="sticky bottom-3 flex justify-center">
                  <button
                    className="rounded-full bg-primary text-primary-foreground text-sm px-4 py-2 shadow-lg hover:shadow-xl transition-shadow font-medium"
                    onClick={() => {
                      const el = scrollRef.current
                      const firstUnread = list[firstUnreadIndex]
                      if (el && firstUnread) {
                        const anchor = el.querySelector(`#msg-${firstUnread.id}`) as HTMLElement | null
                        if (anchor) {
                          anchor.scrollIntoView({ behavior: "smooth", block: "center" })
                        } else {
                          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
                        }
                      }
                    }}
                  >
                    Tin nhắn mới ({unreadCount})
                  </button>
                </div>
              ) : null}
              {!atBottom && unreadCount === 0 ? (
                <div className="sticky bottom-3 flex justify-center">
                  <button
                    className="rounded-full bg-primary text-primary-foreground text-sm px-4 py-2 shadow-lg hover:shadow-xl transition-shadow font-medium"
                    onClick={() => {
                      const el = scrollRef.current
                      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
                    }}
                  >
                    Scroll to latest
                  </button>
                </div>
              ) : null}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 px-4 py-4 backdrop-blur md:px-8">
              <div className="flex items-end gap-3">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      const result = typeof reader.result === "string" ? reader.result : ""
                      setAttachment({ data: result, name: f.name, type: f.type || "application/octet-stream" })
                    }
                    reader.readAsDataURL(f)
                  }}
                />
                <IconButton
                  className="rounded-xl h-11 w-10"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "*/*"
                      fileInputRef.current.click()
                    }
                  }}
                  icon={<Paperclip className="h-4 w-4" />} />
                <IconButton
                  className="rounded-xl h-11 w-10"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*"
                      fileInputRef.current.click()
                    }
                  }}
                  icon={<ImageIcon className="h-4 w-4" />} />
                <div className="relative flex-1">
                  {attachment ? (
                    <div className="mb-2 flex items-center gap-2">
                      {isImageLike(attachment.data, attachment.type) ? (
                        <img src={attachment.data} alt={attachment.name} className="h-12 w-12 rounded-md object-cover border" />
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                          <Paperclip className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{attachment.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Your message"
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={() => send()}
                  disabled={selectedIsWaiting || (!composer.trim() && !attachment)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
                <IconButton
                  className={`rounded-xl h-11 w-10 ${isListening ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
                  variant="secondary"
                  onClick={() => (isListening ? stopListening() : startListening())}
                  icon={<Mic className="h-4 w-4" />} />
              </div>
              {isListening ? (
                <div className="mt-2 text-xs text-red-600">Đang nghe… nhấn mic để dừng</div>
              ) : null}
            </div>
          </section>

          {/* Right: Group info */}
          <aside className="hidden rounded-2xl bg-primary/10 dark:bg-gray-800/50 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10 lg:block">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Group Info</h3>
              {/* <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </button> */}
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
                    <span className="text-sm font-medium dark:text-white">{photos.length} photos</span>
                  </div>
                  {expandedFile === "photos" ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {expandedFile === "photos" && (
                  <div className="max-h-[240px] overflow-y-auto px-4 py-3 bg-gray-50/30 dark:bg-gray-900/30">
                    {photos.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No photos yet</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {photos.map((photo) => (
                          <a
                            key={photo.id}
                            href={(photo as any).src}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-video overflow-hidden rounded-lg bg-gray-300 dark:bg-gray-700 hover:opacity-80 transition"
                          >
                            <img src={(photo as any).src} alt={(photo as any).caption || "Photo"} className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Files */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "files" ? null : "files")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">{fileItems.length} files</span>
                  </div>
                  {expandedFile === "files" ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {expandedFile === "files" && (
                  <div className="max-h-[240px] overflow-y-auto px-4 py-3 bg-gray-50/30 dark:bg-gray-900/30">
                    {fileItems.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No files yet</p>
                    ) : (
                      <div className="space-y-2">
                        {fileItems.map((file) => (
                          <a
                            key={file.id}
                            href={(file as any).src}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate flex-1">{(file as any).filename || "File"}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Shared links */}
                <button
                  onClick={() => setExpandedFile(expandedFile === "links" ? null : "links")}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Link className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-white">{linkItems.length} shared links</span>
                  </div>
                  {expandedFile === "links" ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {expandedFile === "links" && (
                  <div className="max-h-[240px] overflow-y-auto px-4 py-3 bg-gray-50/30 dark:bg-gray-900/30">
                    {linkItems.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No links yet</p>
                    ) : (
                      <div className="space-y-2">
                        {linkItems.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            <Link className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate flex-1">{url}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Members */}
            {/* <div className="mt-4 rounded-2xl border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
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
            </div> */}
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
  onClick,
}: {
  icon: React.ReactNode
  className?: string
  variant?: "outline" | "secondary"
  onClick?: () => void
}) {
  return (
    <button
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 transition",
        variant === "outline" ? "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
        className,
      ].join(" ")}
      onClick={onClick}
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
      <div className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <AvatarCircle name="Alex Hunt" avatar="https://i.pravatar.cc/150?img=33" />}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div
            className={[
              "min-w-[200px] max-w-[500px] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm",
              isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md",
            ].join(" ")}
          >
            {msg.text}
          </div>
          <MetaRow isMe={isMe} timestamp={msg.ts} />
        </div>
        {isMe && <MiniAvatarRight />}
      </div>
    )
  }

  if (msg.type === "image") {
    return (
      <div className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <AvatarCircle name="Jessie Rollins" avatar="https://i.pravatar.cc/150?img=5" />}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div className="w-[350px] overflow-hidden rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
            {msg.src ? (
              <img src={msg.src} alt={msg.caption || "attachment"} className="w-full h-auto object-cover" />
            ) : (
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800" />
            )}
            {msg.caption ? <div className="px-4 py-3 text-[15px] dark:text-white">{msg.caption}</div> : null}
          </div>
          <MetaRow isMe={isMe} timestamp={msg.ts} withMedia />
        </div>
      </div>
    )
  }

  if (msg.type === "file") {
    return (
      <div className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <AvatarCircle name="Jessie Rollins" avatar="https://i.pravatar.cc/150?img=5" />}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div className={[
            "flex max-w-[90%] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
            isMe ? "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          ].join(" ")}>
            <FileText className="h-5 w-5 shrink-0" />
            {msg.src ? (
              <a href={msg.src} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline dark:text-white">
                {msg.filename || "File attachment"}
              </a>
            ) : (
              <span className="text-sm font-medium dark:text-white">{msg.filename || "File attachment"}</span>
            )}
          </div>
          <MetaRow isMe={isMe} timestamp={msg.ts} />
        </div>
      </div>
    )
  }

  return null
}

function AvatarCircle({ name, avatar }: { name: string; avatar?: string }) {
  return avatar ? (
    <img src={avatar} alt={name} className="mt-1 h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700" />
  ) : (
    <div className="mt-1 flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 ring-2 ring-gray-100 dark:ring-gray-700">
      {initials(name)}
    </div>
  )
}

function MiniAvatarRight() {
  return (
    <img
      src="https://i.pravatar.cc/150?img=45"
      alt="You"
      className="mt-1 ml-1 hidden h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 md:flex"
    />
  )
}

function MetaRow({ isMe, timestamp, withMedia = false }: { isMe: boolean; timestamp: number; withMedia?: boolean }) {
  const time = new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`mt-1.5 flex items-center gap-3 ${isMe ? "justify-end" : "justify-start"} text-xs text-gray-500 dark:text-gray-400`}>
      <span>{time}</span>
    </div>
  )
}
