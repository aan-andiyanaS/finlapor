'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts'

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

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#84cc16']

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
                const summaryRes = await fetch('http://localhost:8080/api/dashboard/summary', {
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
                const txRes = await fetch('http://localhost:8080/api/transactions?limit=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (txRes.ok) {
                    const data = await txRes.json()
                    setTransactions(data.data || [])
                }

                // Fetch all transactions for charts
                const allTxRes = await fetch('http://localhost:8080/api/transactions?limit=1000', {
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat dashboard...</p>
                </div>
            </div>
        )
    }

    const { balance = 0, totalIncome = 0, totalExpense = 0, savingsRatio = 0 } = summary || {}
    const hasData = totalIncome > 0 || totalExpense > 0 || transactions.length > 0

    if (!hasData) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Selamat Datang! 👋</h1>
                        <p className="text-slate-400">Mari mulai kelola keuangan Anda</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Dashboard Kosong</h2>
                        <p className="text-slate-400 mb-6">
                            Belum ada transaksi. Mulai tambahkan transaksi pertama Anda!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/dashboard/transactions" className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                                + Tambah Transaksi
                            </Link>
                            <Link href="/dashboard/scanner" className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors">
                                📷 Scan Struk
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
                        <div className="text-3xl mb-3">💡</div>
                        <h3 className="text-white font-semibold mb-2">Tip #1</h3>
                        <p className="text-slate-400 text-sm">Catat semua transaksi untuk insight keuangan yang akurat</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
                        <div className="text-3xl mb-3">🎯</div>
                        <h3 className="text-white font-semibold mb-2">Tip #2</h3>
                        <p className="text-slate-400 text-sm">Set budget untuk setiap kategori pengeluaran</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                        <div className="text-3xl mb-3">🤖</div>
                        <h3 className="text-white font-semibold mb-2">Tip #3</h3>
                        <p className="text-slate-400 text-sm">Gunakan AI Chat untuk analisis dan saran finansial</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Selamat Datang! 👋</h1>
                    <p className="text-slate-400">Ringkasan keuangan Anda bulan ini</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/transactions" className="px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                        + Transaksi
                    </Link>
                    <Link href="/dashboard/scanner" className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors">
                        📷 Scan
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">💰</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${balance >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {balance >= 0 ? '+' : ''}{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Saldo</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        Rp {balance.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">📈</span>
                        <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                            Bulan ini
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Pemasukan</p>
                    <p className="text-2xl font-bold text-green-400">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 border border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">📉</span>
                        <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                            {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-400">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">🎯</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${savingsRatio >= 20 ? 'bg-green-500/20 text-green-400' : savingsRatio >= 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {savingsRatio >= 20 ? 'Bagus!' : savingsRatio >= 0 ? 'Cukup' : 'Defisit'}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Rasio Tabungan</p>
                    <p className="text-2xl font-bold text-white">{savingsRatio.toFixed(1)}%</p>
                </div>
            </div>

            {/* Charts Section - Preview for Dashboard */}
            {allTransactions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Charts */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">📊 Distribusi Kategori</h2>
                            <Link href="/dashboard/reports" className="text-primary-400 hover:text-primary-300 text-sm">
                                Detail →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Expense Pie */}
                            <div>
                                <p className="text-xs text-slate-400 text-center mb-2">Pengeluaran</p>
                                {pieChartData().expenseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={150}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData().expenseData.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={55}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData().expenseData.slice(0, 5).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[150px] flex items-center justify-center text-slate-400 text-sm">
                                        Tidak ada data
                                    </div>
                                )}
                            </div>
                            {/* Income Pie */}
                            <div>
                                <p className="text-xs text-slate-400 text-center mb-2">Pemasukan</p>
                                {pieChartData().incomeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={150}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData().incomeData.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={55}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData().incomeData.slice(0, 5).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[150px] flex items-center justify-center text-slate-400 text-sm">
                                        Tidak ada data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">📈 Trend Bulanan</h2>
                            <Link href="/dashboard/reports" className="text-primary-400 hover:text-primary-300 text-sm">
                                Detail →
                            </Link>
                        </div>
                        {monthlyChartData().length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={monthlyChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                                    <Tooltip
                                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="income" name="Masuk" fill="#10b981" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[180px] flex items-center justify-center text-slate-400">
                                Tidak ada data untuk ditampilkan
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Transaksi Terbaru</h2>
                    <Link href="/dashboard/transactions" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                        Lihat Semua →
                    </Link>
                </div>

                {transactions.length > 0 ? (
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        <span className="text-xl">{tx.type === 'income' ? '📈' : '📉'}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            {tx.items && tx.items.length > 0 ? (
                                                <span>{tx.items.map(i => i.category?.name || 'N/A').slice(0, 2).join(', ')}{tx.items.length > 2 ? ` +${tx.items.length - 2}` : ''}</span>
                                            ) : (
                                                <span>{tx.category?.name || 'Uncategorized'}</span>
                                            )}
                                            <span>•</span>
                                            <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                            {tx.receipt_url && <span className="text-primary-400">📎</span>}
                                        </div>
                                    </div>
                                </div>
                                <p className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}Rp {(tx.total_amount || tx.amount).toLocaleString('id-ID')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-400 py-8">Belum ada transaksi</p>
                )}
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-2xl p-6 border border-primary-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Insight dari AI</h3>
                        <p className="text-slate-300 mb-4">
                            Gunakan fitur <strong>Chat AI</strong> untuk mendapatkan analisis keuangan personal dan saran pengelolaan budget.
                        </p>
                        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium">
                            Tanya AI sekarang →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
