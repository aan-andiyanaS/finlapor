'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts'
import { AnimatedCounter, staggerContainer, fadeInUp, getGreeting } from '@/components/ui/animations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Category {
    id: string
    name: string
}

interface TransactionItem {
    id?: string
    category_id: string
    category?: Category
    amount: number
}

interface Transaction {
    id: string
    type: 'income' | 'expense'
    amount: number
    total_amount?: number
    description: string
    date: string
    receipt_url?: string
    category?: Category
    items?: TransactionItem[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']

export default function DashboardPage() {
    const [summary, setSummary] = useState({
        balance: 0,
        totalIncome: 0,
        totalExpense: 0,
        savingsRatio: 0,
    })
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('access_token')

                // Fetch summary
                const summaryRes = await fetch(`${API_URL}/api/dashboard/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (summaryRes.ok) {
                    const data = await summaryRes.json()
                    setSummary(data.data || {
                        balance: 0,
                        totalIncome: 0,
                        totalExpense: 0,
                        savingsRatio: 0,
                    })
                }

                // Fetch recent transactions
                const txRes = await fetch(`${API_URL}/api/transactions?limit=5`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (txRes.ok) {
                    const data = await txRes.json()
                    setTransactions(data.data || [])
                }

                // Fetch all transactions for charts
                const allTxRes = await fetch(`${API_URL}/api/transactions?limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (allTxRes.ok) {
                    const data = await allTxRes.json()
                    setAllTransactions(data.data || [])
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    // Chart data calculations
    const pieChartData = useCallback(() => {
        const categoryMap = new Map<string, { name: string, income: number, expense: number }>()

        allTransactions.forEach(tx => {
            const items = tx.items && tx.items.length > 0 ? tx.items : [{ category: tx.category, amount: tx.total_amount || tx.amount }]

            items.forEach((item: { category?: Category, amount: number }) => {
                const catName = item.category?.name || 'Lainnya'
                const existing = categoryMap.get(catName) || { name: catName, income: 0, expense: 0 }

                if (tx.type === 'income') {
                    existing.income += item.amount
                } else {
                    existing.expense += item.amount
                }
                categoryMap.set(catName, existing)
            })
        })

        const catData = Array.from(categoryMap.values())
        const incomeData = catData.filter(c => c.income > 0).map(c => ({ name: c.name, value: c.income }))
        const expenseData = catData.filter(c => c.expense > 0).map(c => ({ name: c.name, value: c.expense }))
        return { incomeData, expenseData }
    }, [allTransactions])

    const monthlyChartData = useCallback(() => {
        const monthMap = new Map<string, { month: string, income: number, expense: number }>()

        allTransactions.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

            const existing = monthMap.get(monthKey) || { month: monthLabel, income: 0, expense: 0 }
            if (tx.type === 'income') {
                existing.income += tx.total_amount || tx.amount
            } else {
                existing.expense += tx.total_amount || tx.amount
            }
            monthMap.set(monthKey, existing)
        })

        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([, value]) => value)
    }, [allTransactions])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Memuat dashboard...</p>
                </div>
            </div>
        )
    }

    const { balance = 0, totalIncome = 0, totalExpense = 0, savingsRatio = 0 } = summary || {}
    const hasData = totalIncome > 0 || totalExpense > 0 || transactions.length > 0
    const greeting = getGreeting()

    if (!hasData) {
        return (
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{greeting.text}! {greeting.emoji}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Mari mulai kelola keuangan Anda</p>
                </div>

                <motion.div
                    className="card p-12 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                >
                    <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                        <span className="text-4xl">📊</span>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Dashboard Kosong</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Belum ada transaksi. Mulai tambahkan transaksi pertama Anda untuk melihat ringkasan keuangan!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/transactions" className="btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Transaksi
                        </Link>
                        <Link href="/dashboard/scanner" className="btn-secondary">
                            <span>📷</span>
                            Scan Struk
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                >
                    {[
                        { icon: '💡', title: 'Tip #1', desc: 'Catat semua transaksi untuk insight keuangan yang akurat', color: 'blue' },
                        { icon: '🎯', title: 'Tip #2', desc: 'Set budget untuk setiap kategori pengeluaran', color: 'emerald' },
                        { icon: '🤖', title: 'Tip #3', desc: 'Gunakan AI Chat untuk analisis dan saran finansial', color: 'purple' },
                    ].map((tip, i) => (
                        <motion.div
                            key={i}
                            className="card p-6"
                            variants={fadeInUp}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <motion.div
                                className="text-3xl mb-3"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                            >
                                {tip.icon}
                            </motion.div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{tip.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{tip.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Welcome Header */}
            <motion.div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {greeting.text}! {greeting.emoji}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Ringkasan keuangan Anda bulan ini</p>
                </div>
                <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/dashboard/transactions" className="btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Transaksi
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/dashboard/scanner" className="btn-secondary">
                            <span>📷</span>
                            Scan
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* Balance */}
                <motion.div
                    className="card p-6"
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                        >
                            <span className="text-2xl">💰</span>
                        </motion.div>
                        <span className={`badge ${balance >= 0 ? 'badge-success' : 'badge-error'}`}>
                            {balance >= 0 ? '+' : ''}{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Saldo</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                        <AnimatedCounter value={balance} prefix="Rp " />
                    </p>
                </motion.div>

                {/* Income */}
                <motion.div
                    className="card p-6"
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                        >
                            <span className="text-2xl">📈</span>
                        </motion.div>
                        <span className="badge badge-info">Bulan ini</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pemasukan</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        <AnimatedCounter value={totalIncome} prefix="Rp " />
                    </p>
                </motion.div>

                {/* Expense */}
                <motion.div
                    className="card p-6"
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                        >
                            <span className="text-2xl">📉</span>
                        </motion.div>
                        <span className="badge badge-error">
                            {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        <AnimatedCounter value={totalExpense} prefix="Rp " />
                    </p>
                </motion.div>

                {/* Savings Ratio */}
                <motion.div
                    className="card p-6"
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
                            whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                        >
                            <span className="text-2xl">🎯</span>
                        </motion.div>
                        <span className={`badge ${savingsRatio >= 20 ? 'badge-success' : savingsRatio >= 0 ? 'badge-warning' : 'badge-error'}`}>
                            {savingsRatio >= 20 ? 'Bagus!' : savingsRatio >= 0 ? 'Cukup' : 'Defisit'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Rasio Tabungan</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        <AnimatedCounter value={savingsRatio} suffix="%" />
                    </p>
                </motion.div>
            </motion.div>

            {/* Charts Section */}
            {allTransactions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Charts */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Distribusi Kategori</h2>
                            <Link href="/dashboard/reports" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium">
                                Detail →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Expense Pie */}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2 font-medium">Pengeluaran</p>
                                {pieChartData().expenseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData().expenseData.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={60}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData().expenseData.slice(0, 5).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-bg-secondary)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[160px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                                        Tidak ada data
                                    </div>
                                )}
                            </div>
                            {/* Income Pie */}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2 font-medium">Pemasukan</p>
                                {pieChartData().incomeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData().incomeData.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={60}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData().incomeData.slice(0, 5).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-bg-secondary)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[160px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                                        Tidak ada data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trend Bulanan</h2>
                            <Link href="/dashboard/reports" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium">
                                Detail →
                            </Link>
                        </div>
                        {monthlyChartData().length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={monthlyChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                                    <XAxis dataKey="month" stroke="rgb(var(--color-text-muted))" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="rgb(var(--color-text-muted))" tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                                    <Tooltip
                                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                        contentStyle={{
                                            backgroundColor: 'rgb(var(--color-bg-secondary))',
                                            border: '1px solid rgb(var(--color-border))',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="income" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                                Tidak ada data untuk ditampilkan
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="card">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Transaksi Terbaru</h2>
                    <Link href="/dashboard/transactions" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium">
                        Lihat Semua →
                    </Link>
                </div>

                {transactions.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                        <span className="text-lg">{tx.type === 'income' ? '📈' : '📉'}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            {tx.items && tx.items.length > 0 ? (
                                                <span>{tx.items.map(i => i.category?.name || 'N/A').slice(0, 2).join(', ')}{tx.items.length > 2 ? ` +${tx.items.length - 2}` : ''}</span>
                                            ) : (
                                                <span>{tx.category?.name || 'Uncategorized'}</span>
                                            )}
                                            <span>•</span>
                                            <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                            {tx.receipt_url && <span className="text-blue-500">📎</span>}
                                        </div>
                                    </div>
                                </div>
                                <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}Rp {(tx.total_amount || tx.amount).toLocaleString('id-ID')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-12">Belum ada transaksi</p>
                )}
            </div>

            {/* AI Insight Card */}
            <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 border-0">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold dark:text-white mb-2">Insight dari AI</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Gunakan fitur <strong>Chat AI</strong> untuk mendapatkan analisis keuangan personal dan saran pengelolaan budget.
                        </p>
                        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 dark:text-white font-medium hover:underline">
                            Tanya AI sekarang
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
