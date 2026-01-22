'use client'

import { useState } from 'react'

export default function SettingsPage() {
    const [theme, setTheme] = useState('dark')
    const [notifications, setNotifications] = useState({
        email: true,
        budget: true,
        weekly: false,
    })

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Pengaturan ⚙️</h1>
                <p className="text-slate-400">Kelola profil dan preferensi aplikasi</p>
            </div>

            {/* Profile Section */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Profil</h2>

                <div className="flex items-start gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-3xl text-white font-bold">
                            D
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors">
                            📷
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nama</label>
                            <input
                                type="text"
                                defaultValue="Demo User"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                defaultValue="demo@finlapor.com"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                <button className="mt-6 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                    Simpan Perubahan
                </button>
            </div>

            {/* Mode Section */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Mode Aplikasi</h2>

                <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-xl bg-primary-500/20 border-2 border-primary-500 text-left">
                        <span className="text-2xl">👤</span>
                        <p className="font-medium text-white mt-2">Personal</p>
                        <p className="text-xs text-slate-400 mt-1">Untuk keuangan pribadi</p>
                    </button>
                    <button className="p-4 rounded-xl bg-slate-700/50 border-2 border-transparent hover:border-slate-600 text-left transition-all">
                        <span className="text-2xl">🏢</span>
                        <p className="font-medium text-white mt-2">Bisnis/UMKM</p>
                        <p className="text-xs text-slate-400 mt-1">Fitur akuntansi lengkap</p>
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Tampilan</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tema</label>
                        <div className="flex gap-3">
                            {['dark', 'light', 'system'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${theme === t
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {t === 'dark' ? '🌙 Dark' : t === 'light' ? '☀️ Light' : '💻 System'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Bahasa</label>
                        <select className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>🇮🇩 Bahasa Indonesia</option>
                            <option>🇺🇸 English</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mata Uang</label>
                        <select className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>IDR (Rp) - Rupiah Indonesia</option>
                            <option>USD ($) - US Dollar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Notifikasi</h2>

                <div className="space-y-4">
                    {[
                        { key: 'email', label: 'Notifikasi Email', desc: 'Terima update via email' },
                        { key: 'budget', label: 'Alert Budget', desc: 'Notifikasi saat budget terlampaui' },
                        { key: 'weekly', label: 'Laporan Mingguan', desc: 'Ringkasan mingguan via email' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                            <div>
                                <p className="font-medium text-white">{item.label}</p>
                                <p className="text-sm text-slate-400">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                className={`w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-primary-500' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Keamanan</h2>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔑</span>
                            <div>
                                <p className="font-medium text-white">Ganti Password</p>
                                <p className="text-sm text-slate-400">Perbarui password Anda</p>
                            </div>
                        </div>
                        <span className="text-slate-400">→</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📱</span>
                            <div>
                                <p className="font-medium text-white">Two-Factor Authentication</p>
                                <p className="text-sm text-slate-400">Tambahkan lapisan keamanan</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">Nonaktif</span>
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
                <h2 className="text-lg font-semibold text-red-400 mb-4">Zona Berbahaya</h2>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📦</span>
                            <div>
                                <p className="font-medium text-white">Export Data</p>
                                <p className="text-sm text-slate-400">Download semua data Anda</p>
                            </div>
                        </div>
                        <span className="text-slate-400">→</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-left border border-red-500/20">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🗑️</span>
                            <div>
                                <p className="font-medium text-red-400">Hapus Akun</p>
                                <p className="text-sm text-slate-400">Hapus akun dan semua data secara permanen</p>
                            </div>
                        </div>
                        <span className="text-red-400">→</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
