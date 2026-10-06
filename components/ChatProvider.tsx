'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface ChatContextValue {
    activeTicker: string | null
    isOpen: boolean
    openChatForTicker: (ticker: string) => void
    openGeneralChat: () => void
    closeChat: () => void
    toggleChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [activeTicker, setActiveTicker] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const openChatForTicker = (ticker: string) => {
        setActiveTicker(ticker.toUpperCase())
        setIsOpen(true)
    }

    const openGeneralChat = () => {
        setActiveTicker(null)
        setIsOpen(true)
    }

    const closeChat = () => setIsOpen(false)
    const toggleChat = () => setIsOpen((prev) => !prev)

    return (
        <ChatContext.Provider
            value={{ activeTicker, isOpen, openChatForTicker, openGeneralChat, closeChat, toggleChat }}
        >
            {children}
        </ChatContext.Provider>
    )
}

export function useChatContext() {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChatContext must be used within a ChatProvider')
    return ctx
}
