import Link from 'next/link'

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold">F</span>
                            </div>
                            <span className="text-xl font-bold text-white">FinLapor</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:shadow-glow transition-all hover:scale-105"
                            >
                                Daftar Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
                        <span className="text-primary-300 text-sm font-medium">
                            ✨ AI-Powered Financial Management
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Kelola Keuangan
                        <span className="block text-gradient">Lebih Cerdas dengan AI</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                        Scan struk, catat transaksi otomatis, dan dapatkan insight keuangan cerdas.
                        Cocok untuk pribadi maupun UMKM.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="group bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-glow transition-all hover:scale-105"
                        >
                            Mulai Gratis
                            <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                        </Link>
                        <Link
                            href="#features"
                            className="bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
                        >
                            Pelajari Lebih
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '10K+', label: 'Pengguna Aktif' },
                            { value: '500K+', label: 'Transaksi Tercatat' },
                            { value: '95%', label: 'Akurasi OCR' },
                            { value: '24/7', label: 'AI Assistant' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                                <div className="text-slate-400 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Fitur Unggulan
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Semua yang Anda butuhkan untuk mengelola keuangan dengan lebih efisien
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '📷',
                                title: 'Scan Struk Otomatis',
                                description: 'Upload foto struk, AI akan mengekstrak data secara otomatis. Tidak perlu input manual!'
                            },
                            {
                                icon: '🤖',
                                title: 'Asisten AI Cerdas',
                                description: 'Tanya apa saja tentang keuangan Anda. Dapatkan insight dan saran personal.'
                            },
                            {
                                icon: '📊',
                                title: 'Dashboard Interaktif',
                                description: 'Visualisasi keuangan yang mudah dipahami dengan grafik dan chart modern.'
                            },
                            {
                                icon: '📈',
                                title: 'Laporan Profesional',
                                description: 'Generate laporan keuangan standar akuntansi. Export ke PDF atau Excel.'
                            },
                            {
                                icon: '🎯',
                                title: 'Budgeting & Goals',
                                description: 'Set budget per kategori dan target menabung. AI akan membantu track progress.'
                            },
                            {
                                icon: '🔒',
                                title: 'Aman & Privat',
                                description: 'Data Anda terenkripsi dan aman. Kami tidak pernah membagikan data Anda.'
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-primary-500/50 card-hover"
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 animate-gradient">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Siap Mengelola Keuangan Lebih Baik?
                        </h2>
                        <p className="text-primary-100 text-lg mb-8">
                            Bergabung dengan ribuan pengguna yang sudah merasakan kemudahan FinLapor
                        </p>
                        <Link
                            href="/register"
                            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all hover:scale-105"
                        >
                            Daftar Sekarang - Gratis!
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">F</span>
                        </div>
                        <span className="text-slate-400">© 2026 FinLapor. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-slate-400">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </main>
    )
}
