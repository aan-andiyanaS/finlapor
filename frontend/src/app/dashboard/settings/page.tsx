'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [notifications, setNotifications] = useState({
        email: true,
        budget: true,
        weekly: false,
    })

    useEffect(() => {
        setMounted(true)
        // Get user from auth state
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
    }, [])

    if (!mounted) return null

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan ⚙️</h1>
                <p className="text-slate-500 dark:text-slate-400">Kelola profil dan preferensi aplikasi</p>
            </div>

            {/* Profile Section */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profil</h2>

                <div className="flex items-start gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-3xl text-white font-bold">
                            D
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                            📷
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="label">Nama</label>
                            <input
                                type="text"
                                defaultValue={user?.name || 'User'}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ''}
                                disabled
                                className="input bg-slate-100 dark:bg-slate-700/30 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Email tidak dapat diubah</p>
                        </div>
                    </div>
                </div>

                <button className="btn-primary mt-6">
                    Simpan Perubahan
                </button>
            </div>

            {/* Mode Section */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mode Aplikasi</h2>

                <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/20 border-2 border-blue-500 text-left">
                        <span className="text-2xl">👤</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-2">Personal</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Untuk keuangan pribadi</p>
                    </button>
                    <button className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-left transition-all">
                        <span className="text-2xl">🏢</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-2">Bisnis/UMKM</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fitur akuntansi lengkap</p>
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tampilan</h2>

                <div className="space-y-4">
                    <div>
                        <label className="label">Tema</label>
                        <div className="flex gap-3">
                            {['dark', 'light', 'system'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${theme === t
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t === 'dark' ? '🌙 Dark' : t === 'light' ? '☀️ Light' : '💻 System'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label">Bahasa</label>
                        <select className="input">
                            <option>🇮🇩 Bahasa Indonesia</option>
                            <option>🇺🇸 English</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Mata Uang</label>
                        <select className="input">
                            <option>IDR (Rp) - Rupiah Indonesia</option>
                            <option>USD ($) - US Dollar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notifikasi</h2>

                <div className="space-y-4">
                    {[
                        { key: 'email', label: 'Notifikasi Email', desc: 'Terima update via email' },
                        { key: 'budget', label: 'Alert Budget', desc: 'Notifikasi saat budget terlampaui' },
                        { key: 'weekly', label: 'Laporan Mingguan', desc: 'Ringkasan mingguan via email' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                className={`w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
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
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Keamanan</h2>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔑</span>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Ganti Password</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Perbarui password Anda</p>
                            </div>
                        </div>
                        <span className="text-slate-400">→</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📱</span>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Tambahkan lapisan keamanan</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">Nonaktif</span>
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-6 border border-red-200 dark:border-red-500/20">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Zona Berbahaya</h2>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📦</span>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Export Data</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Download semua data Anda</p>
                            </div>
                        </div>
                        <span className="text-slate-400">→</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors text-left border border-red-200 dark:border-red-500/20">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🗑️</span>
                            <div>
                                <p className="font-medium text-red-600 dark:text-red-400">Hapus Akun</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Hapus akun dan semua data secara permanen</p>
                            </div>
                        </div>
                        <span className="text-red-500 dark:text-red-400">→</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
