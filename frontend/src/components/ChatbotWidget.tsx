'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Knowledge base about FinLapor - only answer questions about this
const FINLAPOR_KNOWLEDGE = {
    about: `FinLapor adalah platform manajemen keuangan berbasis AI yang membantu Anda mencatat transaksi otomatis, menganalisis pengeluaran, dan membuat keputusan finansial yang lebih baik. FinLapor cocok untuk individu maupun pelaku UMKM di Indonesia.`,

    features: `Fitur unggulan FinLapor:
• 📷 Smart OCR Scanner - Scan struk otomatis dengan AI
• 🤖 Asisten AI Personal - Chat dengan AI untuk analisis keuangan
• 📊 Dashboard Interaktif - Visualisasi data keuangan real-time
• 📈 Laporan Profesional - Export PDF/Excel untuk keperluan bisnis
• 🏷️ Kategori Cerdas - Kategorisasi transaksi otomatis
• 🔒 Keamanan Terjamin - Data terenkripsi dengan standar industri`,

    pricing: `FinLapor GRATIS untuk fitur dasar! Anda bisa mendaftar tanpa kartu kredit dan langsung menggunakan semua fitur utama tanpa biaya.`,

    howToStart: `Cara memulai dengan FinLapor:
1. Klik "Daftar Gratis" di halaman ini
2. Isi data diri dan buat password
3. Mulai catat transaksi atau scan struk
4. Lihat analisis dan laporan keuangan Anda`,

    security: `Keamanan FinLapor:
• Data terenkripsi dengan standar industri
• Infrastruktur cloud AWS yang aman
• Password di-hash dengan bcrypt
• JWT authentication untuk keamanan session`,

    support: `Untuk bantuan, Anda bisa:
• Gunakan Asisten AI di dalam dashboard
• Hubungi tim support melalui halaman Kontak
• Baca FAQ di halaman Bantuan`,

    target: `FinLapor cocok untuk:
• Individu yang ingin mengelola keuangan pribadi
• Freelancer yang perlu tracking income/expense
• Pemilik UMKM untuk laporan keuangan bisnis
• Siapa saja yang ingin financial awareness lebih baik`,
}

// Simple keyword matching for responses
function getResponse(question: string): string {
    const q = question.toLowerCase()

    // Check for off-topic questions
    const offTopicKeywords = ['cuaca', 'weather', 'politik', 'berita', 'game', 'film', 'movie', 'musik', 'resep', 'masak', 'covid', 'corona', 'olahraga', 'sport', 'crypto', 'bitcoin', 'saham', 'stock']
    if (offTopicKeywords.some(k => q.includes(k))) {
        return `Maaf, saya hanya bisa menjawab pertanyaan seputar FinLapor dan fitur-fiturnya. Silakan tanyakan tentang:
• Apa itu FinLapor
• Fitur-fitur FinLapor
• Cara mendaftar
• Harga/biaya
• Keamanan data`
    }

    // FinLapor related responses
    if (q.includes('apa itu') || q.includes('finlapor') && (q.includes('apa') || q.includes('tentang'))) {
        return FINLAPOR_KNOWLEDGE.about
    }

    if (q.includes('fitur') || q.includes('bisa apa') || q.includes('fungsi') || q.includes('kegunaan')) {
        return FINLAPOR_KNOWLEDGE.features
    }

    if (q.includes('harga') || q.includes('biaya') || q.includes('gratis') || q.includes('bayar') || q.includes('pricing')) {
        return FINLAPOR_KNOWLEDGE.pricing
    }

    if (q.includes('daftar') || q.includes('mulai') || q.includes('cara') || q.includes('register') || q.includes('sign up')) {
        return FINLAPOR_KNOWLEDGE.howToStart
    }

    if (q.includes('aman') || q.includes('keamanan') || q.includes('security') || q.includes('data') || q.includes('privasi')) {
        return FINLAPOR_KNOWLEDGE.security
    }

    if (q.includes('bantuan') || q.includes('support') || q.includes('hubungi') || q.includes('kontak')) {
        return FINLAPOR_KNOWLEDGE.support
    }

    if (q.includes('siapa') || q.includes('untuk') || q.includes('cocok') || q.includes('target')) {
        return FINLAPOR_KNOWLEDGE.target
    }

    if (q.includes('scan') || q.includes('struk') || q.includes('ocr') || q.includes('foto')) {
        return `Fitur Smart OCR Scanner memungkinkan Anda untuk:
• Foto struk belanja dengan kamera
• AI akan membaca dan mengekstrak data otomatis
• Data transaksi langsung tersimpan
• Tidak perlu input manual!

⚠️ Fitur OCR saat ini dalam tahap pengembangan.`
    }

    if (q.includes('ai') || q.includes('asisten') || q.includes('chat')) {
        return `Asisten AI Personal FinLapor dapat:
• Menganalisis pola pengeluaran Anda
• Memberikan saran penghematan
• Menjawab pertanyaan tentang keuangan Anda
• Membantu membuat budget

Akses Asisten AI setelah login ke dashboard!`
    }

    if (q.includes('laporan') || q.includes('report') || q.includes('pdf') || q.includes('excel')) {
        return `Fitur Laporan Profesional:
• Export laporan dalam format PDF atau Excel
• Laporan mutasi seperti statement bank
• Grafik dan visualisasi data
• Cocok untuk keperluan pribadi maupun bisnis`
    }

    if (q.includes('halo') || q.includes('hai') || q.includes('hi') || q.includes('hello')) {
        return `Halo! 👋 Selamat datang di FinLapor!

Saya adalah asisten virtual yang siap membantu menjawab pertanyaan seputar FinLapor. Silakan tanyakan tentang:
• Fitur-fitur FinLapor
• Cara mendaftar
• Harga dan biaya
• Keamanan data
• Dan lainnya terkait FinLapor`
    }

    // Default response
    return `Terima kasih atas pertanyaannya! Saya adalah asisten FinLapor yang hanya bisa menjawab pertanyaan seputar platform ini.

Beberapa topik yang bisa saya bantu:
• Apa itu FinLapor
• Fitur-fitur yang tersedia
• Cara mendaftar dan memulai
• Harga dan biaya
• Keamanan data

Silakan tanyakan salah satu topik di atas atau klik "Daftar Gratis" untuk langsung mencoba!`
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Halo! 👋 Saya asisten FinLapor. Ada yang bisa saya bantu tentang platform kami?'
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        // Simulate typing
        setIsTyping(true)
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

        const response = getResponse(userMessage)
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Quick action buttons
    const quickActions = [
        { label: 'Apa itu FinLapor?', query: 'Apa itu FinLapor?' },
        { label: 'Fitur apa saja?', query: 'Fitur apa saja yang ada?' },
        { label: 'Apakah gratis?', query: 'Apakah FinLapor gratis?' },
    ]

    return (
        <>
            {/* Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:shadow-blue-500/50 transition-shadow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 0 : [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: isOpen ? 0 : Infinity, repeatDelay: 5 }}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </motion.button>

            {/* Notification badge */}
            {!isOpen && (
                <motion.div
                    className="fixed bottom-16 right-4 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2 }}
                >
                    Tanya kami!
                </motion.div>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Asisten FinLapor</h3>
                                    <p className="text-blue-100 text-xs">Tanya seputar FinLapor</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-sm'
                                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    className="flex justify-start"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(action.query)
                                            setTimeout(() => handleSend(), 100)
                                        }}
                                        className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ketik pertanyaan..."
                                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="p-2 rounded-xl bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
