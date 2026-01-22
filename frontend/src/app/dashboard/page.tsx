'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data
const mockTransactions = [
    { id: 1, type: 'expense', category: 'Makan & Minum', amount: 85000, description: 'Makan siang', date: '2026-01-22' },
    { id: 2, type: 'expense', category: 'Transportasi', amount: 50000, description: 'Grab ke kantor', date: '2026-01-22' },
    { id: 3, type: 'income', category: 'Gaji', amount: 8000000, description: 'Gaji Januari', date: '2026-01-21' },
    { id: 4, type: 'expense', category: 'Belanja', amount: 250000, description: 'Belanja bulanan', date: '2026-01-20' },
    { id: 5, type: 'expense', category: 'Tagihan', amount: 500000, description: 'Listrik & Internet', date: '2026-01-19' },
]

const categoryBreakdown = [
    { name: 'Makan & Minum', amount: 850000, color: '#FF6B6B', percentage: 35 },
    { name: 'Transportasi', amount: 500000, color: '#4ECDC4', percentage: 20 },
    { name: 'Belanja', amount: 350000, color: '#45B7D1', percentage: 14 },
    { name: 'Tagihan', amount: 500000, color: '#96CEB4', percentage: 20 },
    { name: 'Lainnya', amount: 280000, color: '#DDA0DD', percentage: 11 },
]

export default function DashboardPage() {
    const totalIncome = 8000000
    const totalExpense = 2480000
    const balance = totalIncome - totalExpense

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
                            +12.5%
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
                            -8.3%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-white">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">🎯</span>
                        <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                            31%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Rasio Tabungan</p>
                    <p className="text-2xl font-bold text-white">{((balance / totalIncome) * 100).toFixed(0)}%</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Grafik Keuangan</h2>
                        <select className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm">
                            <option>7 Hari</option>
                            <option>30 Hari</option>
                            <option>3 Bulan</option>
                        </select>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="h-64 flex items-end justify-around gap-2">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => {
                            const incomeHeight = Math.random() * 60 + 20
                            const expenseHeight = Math.random() * 40 + 10
                            return (
                                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex gap-1 items-end justify-center h-48">
                                        <div
                                            className="w-4 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-sm"
                                            style={{ height: `${incomeHeight}%` }}
                                        />
                                        <div
                                            className="w-4 bg-gradient-to-t from-red-500 to-orange-400 rounded-t-sm"
                                            style={{ height: `${expenseHeight}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400">{day}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                            <span className="text-sm text-slate-400">Pemasukan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
                            <span className="text-sm text-slate-400">Pengeluaran</span>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white mb-6">Kategori Pengeluaran</h2>
                    <div className="space-y-4">
                        {categoryBreakdown.map((cat) => (
                            <div key={cat.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-300">{cat.name}</span>
                                    <span className="text-sm font-medium text-white">Rp {cat.amount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
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

                <div className="space-y-3">
                    {mockTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <span className="text-xl">
                                        {tx.category === 'Gaji' ? '💼' :
                                            tx.category === 'Makan & Minum' ? '🍔' :
                                                tx.category === 'Transportasi' ? '🚗' :
                                                    tx.category === 'Belanja' ? '🛒' :
                                                        tx.category === 'Tagihan' ? '📄' : '💰'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-white">{tx.description}</p>
                                    <p className="text-sm text-slate-400">{tx.category} • {tx.date}</p>
                                </div>
                            </div>
                            <p className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    ))}
                </div>
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
                            Pengeluaran <strong>Makan & Minum</strong> Anda meningkat 15% dibanding bulan lalu.
                            Pertimbangkan untuk memasak di rumah untuk menghemat hingga Rp 300.000/bulan.
                        </p>
                        <Link
                            href="/dashboard/chat"
                            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium"
                        >
                            Tanya AI untuk saran lainnya →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
