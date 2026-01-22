'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const suggestions = [
    'Berapa total pengeluaran bulan ini?',
    'Kategori apa yang paling boros?',
    'Berikan tips menabung',
    'Analisis pola pengeluaran saya',
]

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchChatHistory()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchChatHistory = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/chat/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const history = data.data || []
                if (history.length === 0) {
                    // Add welcome message for new chat
                    setMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: 'Halo! 👋 Saya FinLapor AI Assistant. Saya bisa membantu Anda menganalisis keuangan, memberikan insight pengeluaran, dan saran menabung. Ada yang bisa saya bantu?',
                        timestamp: new Date(),
                    }])
                } else {
                    setMessages(history.map((msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.message,
                        timestamp: new Date(msg.created_at)
                    })))
                }
            }
        } catch (error) {
            console.error('Error fetching chat history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async (text?: string) => {
        const messageText = text || input
        if (!messageText.trim()) return

        const userMessage: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: messageText,
                    context: {}
                })
            })

            if (res.ok) {
                const data = await res.json()
                const aiMessage: Message = {
                    id: data.data.id || `ai-${Date.now()}`,
                    role: 'assistant',
                    content: data.data.response || data.data.message,
                    timestamp: new Date(),
                }
                setMessages(prev => [...prev, aiMessage])
            } else {
                throw new Error('Chat API failed')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            // Fallback response
            const fallbackMessage: Message = {
                id: `fallback-${Date.now()}`,
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi administrator.',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, fallbackMessage])
        } finally {
            setIsTyping(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat chat...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-white">Asisten AI 🤖</h1>
                <p className="text-slate-400">Tanya apa saja tentang keuangan Anda</p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                        ? 'bg-primary-500'
                                        : 'bg-gradient-to-r from-primary-500 to-accent-500'
                                    }`}>
                                    {message.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-700/50 text-slate-200'
                                    }`}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-slate-400'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                                🤖
                            </div>
                            <div className="bg-slate-700/50 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && (
                    <div className="px-4 py-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2">Coba tanyakan:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-600/50 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-slate-700/50">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-3"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ketik pertanyaan Anda..."
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Kirim
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
