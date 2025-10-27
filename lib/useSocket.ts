"use client"

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { loadTokens } from "./api";

const API_BASE: string = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) || "";

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    // helper to create a socket instance with event wiring
    const createSocket = (accessToken: string) => {
        // If API_BASE points to an /api path (e.g. https://host/api), socket.io server is
        // typically mounted on the root origin. Strip trailing /api so client connects to
        // the proper origin.
        let url = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
        try {
            url = url.replace(/\/api\/?$/, "")
        } catch { }
        const s = io(url, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            autoConnect: true,
        });

        const onConnect = () => {
            console.debug("socket connected", s.id)
            setConnected(true)
        }
        const onDisconnect = (reason?: any) => {
            console.debug("socket disconnected", reason)
            setConnected(false)
        }

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("connect_error", (err: any) => console.warn("socket connect_error", err));

        // store
        socketRef.current = s;

        return s;
    };

    useEffect(() => {
        // initialize if token already present
        const tokens = loadTokens();
        if (tokens?.accessToken) {
            createSocket(tokens.accessToken);
        }

        // listen for token changes in same tab (custom event)
        const onTokensChanged = (e: any) => {
            const tokens: any = e?.detail ?? null
            if (!tokens) {
                // tokens cleared -> disconnect
                try {
                    socketRef.current?.disconnect()
                } catch { }
                socketRef.current = null
                setConnected(false)
                return
            }
            const accessToken = tokens.accessToken
            if (!accessToken) return

            // if socket exists, update auth and reconnect
            if (socketRef.current) {
                try {
                    socketRef.current.auth = { token: accessToken } as any
                    socketRef.current.disconnect()
                    socketRef.current.connect()
                } catch (err) {
                    console.warn('socket reconnect with new token failed, recreating', err)
                    try { socketRef.current?.disconnect() } catch { }
                    createSocket(accessToken)
                }
            } else {
                // create new socket with token
                createSocket(accessToken)
            }
        }

        window.addEventListener("ev_tokens_changed", onTokensChanged as EventListener)

        // listen for storage events (cross-tab token updates)
        const onStorage = (ev: StorageEvent) => {
            if (ev.key !== "evsc:tokens") return
            try {
                const tokens = ev.newValue ? JSON.parse(ev.newValue) : null
                onTokensChanged({ detail: tokens })
            } catch (e) {
                // ignore
            }
        }
        window.addEventListener("storage", onStorage)

        return () => {
            window.removeEventListener("ev_tokens_changed", onTokensChanged as EventListener)
            window.removeEventListener("storage", onStorage)
            try {
                socketRef.current?.disconnect()
            } catch { }
            socketRef.current = null
        }
    }, []);

    const emit = (event: string, data?: any) => socketRef.current?.emit(event, data);
    const on = (event: string, cb: (...args: any[]) => void) => socketRef.current?.on(event, cb);
    const off = (event: string, cb?: (...args: any[]) => void) => socketRef.current?.off(event, cb);

    const joinConversation = (conversationId: string) => emit("conversation:join", { conversationId });
    const leaveConversation = (conversationId: string) => emit("conversation:leave", { conversationId });

    const reconnectWithToken = (accessToken: string) => {
        if (!accessToken) return
        if (socketRef.current) {
            try {
                socketRef.current.auth = { token: accessToken } as any;
                socketRef.current.disconnect();
                socketRef.current.connect();
                return
            } catch (e) {
                console.warn("Failed to reconnect socket with new token", e);
                try { socketRef.current.disconnect() } catch { }
                socketRef.current = null
            }
        }
        // create a new socket if none exists
        try {
            createSocket(accessToken)
        } catch (e) {
            console.warn("Failed to create socket with new token", e)
        }
    };

    return {
        socket: socketRef.current,
        connected,
        emit,
        on,
        off,
        joinConversation,
        leaveConversation,
        reconnectWithToken,
    } as const;
}
