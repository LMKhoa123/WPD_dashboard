"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mockCustomers } from "@/src/lib/mock-data"

export default function ChatPage() {
  const [selected, setSelected] = useState<string | null>(mockCustomers[0]?.id ?? null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, { from: string; text: string; ts: number }[]>>({})

  const send = () => {
    if (!selected || !message.trim()) return
    const list = messages[selected] || []
    setMessages({ ...messages, [selected]: [...list, { from: "staff", text: message, ts: Date.now() }] })
    setMessage("")
  }

  const currentMessages = selected ? messages[selected] || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Chat</h1>
        <p className="text-muted-foreground">Chat with customers in real-time (mock)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left p-2 rounded border ${selected === c.id ? "bg-muted" : ""}`}
              >
                <div className="font-medium">{c.customerName}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-auto border rounded p-3 space-y-2 bg-background">
              {currentMessages.length === 0 && (
                <div className="text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
              )}
              {currentMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded px-3 py-2 text-sm ${
                      m.from === "staff" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button onClick={send}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
