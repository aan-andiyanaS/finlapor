'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
    id: number
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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: 'assistant',
            content: 'Halo! 👋 Saya FinLapor AI Assistant. Saya bisa membantu Anda menganalisis keuangan, memberikan insight pengeluaran, dan saran menabung. Ada yang bisa saya bantu?',
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (text?: string) => {
        const messageText = text || input
        if (!messageText.trim()) return

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1500))

        const aiResponses: Record<string, string> = {
            'pengeluaran': 'Total pengeluaran Anda bulan ini adalah **Rp 2.480.000**. Ini 8% lebih rendah dibanding bulan lalu! 📉\n\nBreakdown per kategori:\n- 🍔 Makan & Minum: Rp 850.000 (34%)\n- 📄 Tagihan: Rp 500.000 (20%)\n- 🚗 Transportasi: Rp 500.000 (20%)\n- 🛒 Belanja: Rp 350.000 (14%)\n- 📦 Lainnya: Rp 280.000 (12%)',
            'boros': 'Kategori dengan pengeluaran tertinggi adalah **Makan & Minum** (Rp 850.000 atau 34% dari total).\n\n💡 **Tips**: Rata-rata orang Indonesia menghabiskan 30% dari pendapatan untuk makan. Anda sedikit di atas rata-rata. Pertimbangkan untuk:\n- Memasak di rumah 2-3x seminggu\n- Membawa bekal ke kantor\n- Mencari promo atau diskon',
            'tips': '**5 Tips Menabung untuk Anda:**\n\n1️⃣ **Gunakan aturan 50/30/20**: 50% kebutuhan, 30% keinginan, 20% tabungan\n\n2️⃣ **Otomatisasi tabungan**: Set auto-debit ke rekening tabungan setiap gajian\n\n3️⃣ **Track pengeluaran kecil**: Kopi Rp 25.000/hari = Rp 750.000/bulan!\n\n4️⃣ **Tunggu 24 jam** sebelum beli barang non-esensial\n\n5️⃣ **Buat emergency fund** = 3-6 bulan pengeluaran',
            'pola': '**Analisis Pola Pengeluaran Anda:**\n\n📊 **Tren**:\n- Pengeluaran tertinggi di akhir pekan (Sabtu-Minggu)\n- Kategori Hiburan melonjak 45% di weekend\n- Pengeluaran Makan naik saat tanggal muda\n\n⚠️ **Perhatian**:\n- 3 transaksi besar minggu ini (di atas Rp 200.000)\n- Subscription yang bisa di-review: Netflix, Spotify\n\n✅ **Good news**:\n- Rasio tabungan Anda 69% (sangat baik!)\n- Tidak ada pengeluaran anomali terdeteksi',
        }

        let response = 'Terima kasih atas pertanyaannya! Berdasarkan data keuangan Anda, saya sarankan untuk terus memantau pengeluaran harian dan menetapkan budget untuk setiap kategori. Ada yang ingin ditanyakan lebih lanjut?'

        for (const [key, value] of Object.entries(aiResponses)) {
            if (messageText.toLowerCase().includes(key)) {
                response = value
                break
            }
        }

        const aiMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
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
                {messages.length <= 2 && (
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
