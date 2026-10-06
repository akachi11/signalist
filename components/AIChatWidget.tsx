'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Globe, SendHorizontal, ShieldCheck, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/components/ChatProvider'
import { AI_CHAT_SUGGESTED_PROMPTS, type AIChatMessage } from '@/lib/constants'

const API_URL = process.env.NEXT_PUBLIC_STOCKSAGE_API_URL ?? 'http://localhost:3000'

function makeMessage(role: AIChatMessage['role'], content: string, extra?: Partial<AIChatMessage>): AIChatMessage {
    return { id: crypto.randomUUID(), role, content, ...extra }
}

const AIChatWidget = () => {
    const { activeTicker, isOpen, closeChat, toggleChat } = useChatContext()

    const [messages, setMessages] = useState<AIChatMessage[]>([
        makeMessage(
            'assistant',
            "Hi! I'm Signalist AI. Click any stock ticker to have me gather real-time data on it, or ask me a general investing question."
        ),
    ])
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isSeeding, setIsSeeding] = useState(false)
    const [seededTickers, setSeededTickers] = useState<Set<string>>(new Set())

    const scrollAnchorRef = useRef<HTMLDivElement>(null)
    const lastHandledTicker = useRef<string | null>(null)

    useEffect(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isSending, isSeeding])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeChat()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeChat])

    // Kick off (or resume) a ticker-specific conversation whenever the active ticker changes.
    useEffect(() => {
        if (!isOpen || !activeTicker || lastHandledTicker.current === activeTicker) return
        lastHandledTicker.current = activeTicker

        setMessages((prev) => [...prev, makeMessage('system', `Now discussing ${activeTicker}`)])

        if (seededTickers.has(activeTicker)) {
            setMessages((prev) => [
                ...prev,
                makeMessage('assistant', `What would you like to know about ${activeTicker}?`),
            ])
            return
        }

        const seed = async () => {
            setIsSeeding(true)
            setMessages((prev) => [
                ...prev,
                makeMessage('assistant', `🔎 Gathering real-time data on ${activeTicker}...`),
            ])

            try {
                const res = await fetch(`${API_URL}/seed/${activeTicker}`, { method: 'POST' })
                const body = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(body.error || 'Failed to gather data for this ticker.')

                setSeededTickers((prev) => new Set(prev).add(activeTicker))
                setMessages((prev) => [
                    ...prev,
                    makeMessage('assistant', `I've gathered the latest data on ${activeTicker}. What would you like to know?`),
                ])
            } catch (error) {
                setMessages((prev) => [
                    ...prev,
                    makeMessage(
                        'assistant',
                        `I couldn't gather verified data on ${activeTicker} (${
                            error instanceof Error ? error.message : 'unknown error'
                        }). You can still ask me about it and I'll answer from general knowledge.`
                    ),
                ])
            } finally {
                setIsSeeding(false)
            }
        }

        seed()
    }, [isOpen, activeTicker, seededTickers])

    const sendMessage = async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed || isSending || isSeeding) return

        setMessages((prev) => [...prev, makeMessage('user', trimmed)])
        setInput('')
        setIsSending(true)

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmed, ticker: activeTicker }),
            })
            if (!res.ok) throw new Error('Request failed')

            const data = await res.json()
            setMessages((prev) => [
                ...prev,
                makeMessage('assistant', data.answer, { sources: data.sources, grounded: data.grounded }),
            ])
        } catch {
            setMessages((prev) => [
                ...prev,
                makeMessage('assistant', "Sorry, I couldn't reach StockSage just now. Please try again in a moment."),
            ])
        } finally {
            setIsSending(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    const busy = isSending || isSeeding

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-gray-600 bg-gray-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-gray-600 bg-gray-700/40 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-yellow-400 to-yellow-500">
                                <Bot className="h-5 w-5 text-gray-900" />
                                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-teal-400 ring-2 ring-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-100">Signalist AI</span>
                                <span className="text-xs text-gray-500">
                                    {activeTicker ? `Discussing ${activeTicker}` : 'Ask about any stock'}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={closeChat}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-gray-100"
                            aria-label="Close chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="scrollbar-hide-default min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                        {messages.map((message) => {
                            if (message.role === 'system') {
                                return (
                                    <div key={message.id} className="flex justify-center">
                                        <span className="rounded-full bg-gray-700/60 px-3 py-1 text-[11px] font-medium text-gray-400">
                                            {message.content}
                                        </span>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={message.id}
                                    className={cn('flex flex-col gap-1.5', message.role === 'user' ? 'items-end' : 'items-start')}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                                            message.role === 'user'
                                                ? 'rounded-br-sm bg-yellow-500 text-gray-900'
                                                : 'rounded-bl-sm bg-gray-700 text-gray-100'
                                        )}
                                    >
                                        {message.content}
                                    </div>
                                    {message.role === 'assistant' && message.grounded !== undefined && (
                                        <div className="flex flex-wrap items-center gap-1.5 px-1">
                                            <span
                                                className={cn(
                                                    'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium',
                                                    message.grounded ? 'bg-teal-400/10 text-teal-400' : 'bg-gray-600/60 text-gray-400'
                                                )}
                                            >
                                                {message.grounded ? (
                                                    <>
                                                        <ShieldCheck className="h-3 w-3" /> Verified data
                                                    </>
                                                ) : (
                                                    <>
                                                        <Globe className="h-3 w-3" /> General knowledge
                                                    </>
                                                )}
                                            </span>
                                            {message.sources?.map((ticker) => (
                                                <span
                                                    key={ticker}
                                                    className="rounded bg-gray-600/60 px-2 py-0.5 font-mono text-[11px] font-medium text-gray-300"
                                                >
                                                    {ticker}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {busy && (
                            <div className="flex items-start">
                                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-700 px-4 py-3">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                                </div>
                            </div>
                        )}

                        <div ref={scrollAnchorRef} />
                    </div>

                    {/* Suggested prompts (general chat only) */}
                    {!activeTicker && messages.length <= 1 && (
                        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-gray-600 px-4 py-3">
                            {AI_CHAT_SUGGESTED_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => sendMessage(prompt)}
                                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-600 bg-gray-700/50 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-yellow-500/40 hover:text-yellow-500 cursor-pointer"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-600 p-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={busy}
                            placeholder={activeTicker ? `Ask about ${activeTicker}...` : 'Ask about any stock...'}
                            className="h-10 flex-1 rounded-full border border-gray-600 bg-gray-700 px-4 text-sm text-white placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || busy}
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-yellow-500 text-gray-900 transition-opacity hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Send message"
                        >
                            <SendHorizontal className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating trigger */}
            <button
                type="button"
                onClick={toggleChat}
                className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-yellow-400 to-yellow-500 shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
            >
                {!isOpen && <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-30" />}
                {isOpen ? <X className="h-6 w-6 text-gray-900" /> : <Bot className="h-6 w-6 text-gray-900" />}
            </button>
        </div>
    )
}

export default AIChatWidget
