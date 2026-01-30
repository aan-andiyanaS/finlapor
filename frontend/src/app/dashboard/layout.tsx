'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '💰', label: 'Transaksi', href: '/dashboard/transactions' },
    { icon: '📷', label: 'Scan Struk', href: '/dashboard/scanner' },
    { icon: '📊', label: 'Laporan', href: '/dashboard/reports' },
    { icon: '💬', label: 'Asisten AI', href: '/dashboard/chat' },
    { icon: '⚙️', label: 'Pengaturan', href: '/dashboard/settings' },
]

// Pages where search is enabled
const searchEnabledPages = ['/dashboard', '/dashboard/transactions', '/dashboard/reports']

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Check if search should be visible
    const isSearchEnabled = searchEnabledPages.includes(pathname)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    // Get current page title - improved matching
    const getCurrentPageTitle = () => {
        // Find exact match first
        const exactMatch = menuItems.find(item => item.href === pathname)
        if (exactMatch) return exactMatch.label

        // Then check if pathname starts with item.href (for nested routes)
        const partialMatch = menuItems.find(item =>
            item.href !== '/dashboard' && pathname.startsWith(item.href)
        )
        if (partialMatch) return partialMatch.label

        return 'Dashboard'
    }

    // Check if menu item is active
    const isMenuActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname === href || pathname.startsWith(href + '/')
    }

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <Image
                            src="/logo.png"
                            alt="FinLapor"
                            width={80}
                            height={80}
                            className="animate-pulse drop-shadow-2xl"
                            priority
                        />
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat FinLapor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="FinLapor Logo"
                            width={40}
                            height={40}
                            className="rounded-xl shadow-lg shadow-blue-500/25"
                        />
                        <div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">FinLapor</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Keuangan Cerdas</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</p>
                    {menuItems.map((item) => {
                        const isActive = isMenuActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                                )}
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'email@example.com'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-72">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-4 lg:px-6 py-4">
                        {/* Left side - Mobile menu + Breadcrumb */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* Breadcrumb */}
                            <div className="hidden sm:flex items-center gap-2 text-sm">
                                <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                                {pathname !== '/dashboard' && (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-slate-900 dark:text-white font-medium">{getCurrentPageTitle()}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right side - Search + Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search - Only visible on specific pages */}
                            {isSearchEnabled && (
                                <div className="hidden md:block relative">
                                    <input
                                        type="text"
                                        placeholder="Cari transaksi..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchQuery.trim()) {
                                                router.push(`/dashboard/transactions?search=${encodeURIComponent(searchQuery.trim())}`)
                                            }
                                        }}
                                        className="w-64 pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            )}

                            {/* Notification */}
                            <button className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Theme Toggle */}
                            {mounted && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title={resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
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
