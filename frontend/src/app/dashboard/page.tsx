'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Transaction {
    id: string
    type: 'income' | 'expense'
    amount: number
    description: string
    date: string
    category?: {
        id: string
        name: string
    }
}

export default function DashboardPage() {
    const [summary, setSummary] = useState({
        balance: 0,
        totalIncome: 0,
        totalExpense: 0,
        savingsRatio: 0,
    })
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch real data from API
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token')

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
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

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

    // If no data (new user), show empty state
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

                {/* Empty State */}
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Dashboard Kosong</h2>
                        <p className="text-slate-400 mb-6">
                            Belum ada transaksi. Mulai tambahkan transaksi pertama Anda atau scan struk untuk memulai!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link
                                href="/dashboard/transactions"
                                className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                            >
                                + Tambah Transaksi
                            </Link>
                            <Link
                                href="/dashboard/scanner"
                                className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                            >
                                📷 Scan Struk
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
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

    // Has data - show full dashboard
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Selamat Datang! 👋</h1>
                    <p className="text-slate-400">Ringkasan keuangan Anda bulan ini</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/transactions"
                        className="px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                    >
                        + Transaksi
                    </Link>
                    <Link
                        href="/dashboard/scanner"
                        className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                    >
                        📷 Scan
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">💰</span>
                        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                            {balance >= 0 ? '+' : ''}{((balance / (totalIncome || 1)) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Saldo</p>
                    <p className="text-2xl font-bold text-white">Rp {balance.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">📈</span>
                        <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                            Bulan ini
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Pemasukan</p>
                    <p className="text-2xl font-bold text-white">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 border border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">📉</span>
                        <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                            {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-white">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">🎯</span>
                        <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                            {savingsRatio}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Rasio Tabungan</p>
                    <p className="text-2xl font-bold text-white">{savingsRatio}%</p>
                </div>
            </div>

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
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                        <span className="text-xl">💰</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{tx.description}</p>
                                        <p className="text-sm text-slate-400">{tx.category?.name || 'Uncategorized'} • {new Date(tx.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>
                                <p className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
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
                            Gunakan fitur <strong>Chat AI</strong> untuk mendapatkan analisis keuangan personal dan saran pengelolaan budget yang lebih baik.
                        </p>
                        <Link
                            href="/dashboard/chat"
                            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium"
                        >
                            Tanya AI sekarang →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
