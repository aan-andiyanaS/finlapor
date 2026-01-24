'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '💰', label: 'Transaksi', href: '/dashboard/transactions' },
    { icon: '📷', label: 'Scan Struk', href: '/dashboard/scanner' },
    { icon: '📊', label: 'Laporan', href: '/dashboard/reports' },
    { icon: '💬', label: 'Asisten AI', href: '/dashboard/chat' },
    { icon: '⚙️', label: 'Pengaturan', href: '/dashboard/settings' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('access_token')
        const userData = localStorage.getItem('user')

        if (!token) {
            // No token = not logged in, redirect to login
            router.push('/login')
            return
        }

        if (userData) {
            setUser(JSON.parse(userData))
        } else {
            // Has token but no user data - set minimal user info
            setUser({ name: 'User', email: '' })
        }
        setIsLoading(false)
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-white font-bold text-2xl">F</span>
                    </div>
                    <p className="text-slate-400">Memuat...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-700">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">F</span>
                        </div>
                        <span className="text-xl font-bold text-white">FinLapor</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email || 'email@example.com'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Logout"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white"
                        >
                            ☰
                        </button>

                        <div className="flex-1 max-w-md mx-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari transaksi..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2 text-slate-400 hover:text-white relative">
                                🔔
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white">
                                🌙
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
