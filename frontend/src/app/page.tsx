'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ChatbotWidget from '@/components/ChatbotWidget'

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
}

const floatAnimation = {
    animate: {
        y: [0, -15, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }
    }
}

const pulseGlow = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.8, 0.5],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
    }
}

export default function Home() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="FinLapor Logo"
                                width={40}
                                height={40}
                                className="rounded-xl shadow-lg shadow-blue-500/25"
                            />
                            <span className="text-xl font-bold text-slate-900 dark:text-white">FinLapor</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {mounted && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {resolvedTheme === 'dark' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                            <Link
                                href="/login"
                                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                            >
                                Daftar Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-28 px-4 relative">
                {/* Floating Decorative Elements */}
                <motion.div
                    className="absolute top-20 left-10 text-6xl opacity-20"
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    💰
                </motion.div>
                <motion.div
                    className="absolute top-40 right-20 text-5xl opacity-20"
                    animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                    📊
                </motion.div>
                <motion.div
                    className="absolute bottom-20 left-1/4 text-4xl opacity-15"
                    animate={{ y: [0, -25, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                >
                    🧾
                </motion.div>
                <motion.div
                    className="absolute top-60 right-1/3 text-3xl opacity-10"
                    animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                    🤖
                </motion.div>

                {/* Animated Background Blobs */}
                <motion.div
                    className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                    variants={pulseGlow}
                    animate="animate"
                />
                <motion.div
                    className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        className="grid lg:grid-cols-2 gap-12 items-center"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Left Content */}
                        <motion.div variants={fadeInUp}>
                            <motion.div
                                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    AI-Powered Financial Management
                                </span>
                            </motion.div>

                            <motion.h1
                                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
                                variants={fadeInUp}
                            >
                                Kelola Keuangan
                                <motion.span
                                    className="block text-blue-500"
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                    }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    style={{
                                        background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #3B82F6)',
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    Lebih Cerdas dengan AI
                                </motion.span>
                            </motion.h1>

                            <motion.p
                                className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg"
                                variants={fadeInUp}
                            >
                                Platform manajemen keuangan berbasis AI yang membantu Anda mencatat transaksi otomatis, menganalisis pengeluaran, dan membuat keputusan finansial yang lebih baik.
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                variants={fadeInUp}
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                                    >
                                        Mulai Gratis
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        href="#features"
                                        className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-semibold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Pelajari Lebih
                                    </Link>
                                </motion.div>
                            </motion.div>

                            {/* Trust badges with animation */}
                            <motion.div
                                className="mt-12 flex items-center gap-8"
                                variants={fadeInUp}
                            >
                                <motion.div
                                    className="text-center"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">10K+</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Pengguna Aktif</p>
                                </motion.div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                                <motion.div
                                    className="text-center"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">24/7</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">AI Assistant</p>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Right - Dashboard Preview with Animation */}
                        <motion.div
                            className="relative hidden lg:block"
                            variants={fadeInUp}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <motion.div
                                className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
                                variants={floatAnimation}
                                animate="animate"
                            >
                                <div className="bg-slate-900 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs mb-1">Pemasukan</p>
                                            <p className="text-emerald-400 text-xl font-bold">Rp 25.000.000</p>
                                        </div>
                                        <div className="bg-slate-800 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs mb-1">Pengeluaran</p>
                                            <p className="text-red-400 text-xl font-bold">Rp 12.500.000</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-slate-800 rounded-xl p-4 h-32 flex items-end gap-2">
                                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                            <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                            <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Cara Kerja FinLapor
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Mulai kelola keuangan Anda dalam 3 langkah mudah
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', icon: '📝', title: 'Daftar Akun', desc: 'Buat akun gratis dalam hitungan detik. Tidak perlu kartu kredit.' },
                            { step: '02', icon: '📷', title: 'Catat Transaksi', desc: 'Input manual atau scan struk otomatis dengan AI OCR. 🚧 Fitur OCR dalam pengembangan.' },
                            { step: '03', icon: '📊', title: 'Analisis & Laporan', desc: 'Dapatkan insight cerdas dan laporan keuangan profesional.' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="card p-8 text-center hover:shadow-lg transition-shadow">
                                    <div className="text-5xl mb-4">{item.icon}</div>
                                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                                        Step {item.step}
                                    </span>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Fitur Unggulan
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Semua yang Anda butuhkan untuk mengelola keuangan dengan lebih efisien dan profesional
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '📷',
                                title: 'Smart OCR Scanner',
                                description: 'Teknologi AI yang mampu mengekstrak data dari struk belanja secara otomatis. Cukup foto, biarkan AI bekerja.',
                                color: 'blue'
                            },
                            {
                                icon: '🤖',
                                title: 'Asisten AI Personal',
                                description: 'Chat dengan AI untuk analisis keuangan, saran penghematan, dan tips mengelola budget sesuai kebutuhan Anda.',
                                color: 'purple'
                            },
                            {
                                icon: '📊',
                                title: 'Dashboard Interaktif',
                                description: 'Visualisasi data keuangan dengan grafik modern. Pantau cashflow, trend pengeluaran, dan rasio tabungan real-time.',
                                color: 'emerald'
                            },
                            {
                                icon: '📈',
                                title: 'Laporan Profesional',
                                description: 'Generate laporan keuangan lengkap dalam format PDF atau Excel. Cocok untuk keperluan pribadi maupun bisnis UMKM.',
                                color: 'orange'
                            },
                            {
                                icon: '🏷️',
                                title: 'Kategori Cerdas',
                                description: 'AI akan mengkategorikan transaksi secara otomatis berdasarkan pola pengeluaran Anda.',
                                color: 'pink'
                            },
                            {
                                icon: '🔒',
                                title: 'Keamanan Terjamin',
                                description: 'Data terenkripsi dengan standar industri. Infrastruktur cloud AWS yang aman dan terpercaya.',
                                color: 'slate'
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="card p-6 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <span className="text-3xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials / Trust Section */}
            <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Dipercaya oleh Ribuan Pengguna
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
                        Dari individu hingga pelaku UMKM, FinLapor membantu mengelola keuangan dengan lebih baik
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {[
                            { name: 'Andi S.', role: 'Pemilik Toko Online', text: 'FinLapor sangat membantu bisnis saya. Laporan keuangan jadi lebih rapi dan profesional.' },
                            { name: 'Siti R.', role: 'Freelancer', text: 'Fitur scan struk sangat memudahkan. Tidak perlu input manual lagi, hemat waktu banget!' },
                            { name: 'Budi P.', role: 'Karyawan Swasta', text: 'AI assistant-nya keren! Bisa kasih saran penghematan yang relevan sama kebiasaan belanja saya.' },
                        ].map((testimonial, i) => (
                            <div key={i} className="card p-6 text-left">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-4 italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center items-center gap-8">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Powered by:</span>
                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">AWS</span>
                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">Cloudflare</span>
                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">🤗 HuggingFace</span>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-10 md:p-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/25">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Siap Mengelola Keuangan Lebih Baik?
                        </h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                            Bergabung dengan ribuan pengguna yang sudah merasakan kemudahan FinLapor. Gratis selamanya untuk fitur dasar!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Daftar Sekarang - Gratis!
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 bg-blue-400/20 text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-blue-400/30 transition-all"
                            >
                                Sudah Punya Akun? Masuk
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">F</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">FinLapor</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Platform manajemen keuangan berbasis AI untuk individu dan UMKM Indonesia.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Produk</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link href="#features" className="hover:text-blue-500 transition-colors">Fitur</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Harga</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Integrasi</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Perusahaan</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Tentang Kami</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Karir</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Kebijakan Privasi</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Syarat & Ketentuan</Link></li>
                                <li><Link href="#" className="hover:text-blue-500 transition-colors">Kontak</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            © 2026 FinLapor. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Chatbot Widget */}
            <ChatbotWidget />
        </main >
    )
}
