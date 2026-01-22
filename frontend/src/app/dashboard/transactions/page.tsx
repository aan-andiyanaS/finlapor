'use client'

import { useState } from 'react'

// Mock data
const mockTransactions = [
    { id: 1, type: 'expense', category: 'Makan & Minum', amount: 85000, description: 'Makan siang di warteg', date: '2026-01-22', receipt: true },
    { id: 2, type: 'expense', category: 'Transportasi', amount: 50000, description: 'Grab ke kantor', date: '2026-01-22', receipt: false },
    { id: 3, type: 'income', category: 'Gaji', amount: 8000000, description: 'Gaji Januari 2026', date: '2026-01-21', receipt: true },
    { id: 4, type: 'expense', category: 'Belanja', amount: 250000, description: 'Belanja bulanan Alfamart', date: '2026-01-20', receipt: true },
    { id: 5, type: 'expense', category: 'Tagihan', amount: 500000, description: 'Listrik & Internet', date: '2026-01-19', receipt: true },
    { id: 6, type: 'expense', category: 'Hiburan', amount: 100000, description: 'Nonton bioskop', date: '2026-01-18', receipt: false },
    { id: 7, type: 'expense', category: 'Makan & Minum', amount: 150000, description: 'Dinner dengan teman', date: '2026-01-17', receipt: true },
    { id: 8, type: 'income', category: 'Bisnis', amount: 500000, description: 'Freelance project', date: '2026-01-15', receipt: true },
]

const categories = [
    { value: 'food', label: 'Makan & Minum', icon: '🍔' },
    { value: 'transport', label: 'Transportasi', icon: '🚗' },
    { value: 'shopping', label: 'Belanja', icon: '🛒' },
    { value: 'utilities', label: 'Tagihan', icon: '📄' },
    { value: 'entertainment', label: 'Hiburan', icon: '🎮' },
    { value: 'health', label: 'Kesehatan', icon: '🏥' },
    { value: 'salary', label: 'Gaji', icon: '💼' },
    { value: 'business', label: 'Bisnis', icon: '💰' },
    { value: 'other', label: 'Lainnya', icon: '📦' },
]

export default function TransactionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('all')
    const [transactions, setTransactions] = useState(mockTransactions)

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true
        return tx.type === filter
    })

    const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const newTx = {
            id: Date.now(),
            type: formData.get('type') as string,
            category: formData.get('category') as string,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
            date: formData.get('date') as string,
            receipt: false,
        }

        setTransactions([newTx, ...transactions])
        setIsModalOpen(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Transaksi</h1>
                    <p className="text-slate-400">Kelola semua transaksi keuangan Anda</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                >
                    + Tambah Transaksi
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'income', 'expense'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === f
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                    >
                        {f === 'all' ? 'Semua' : f === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Transaksi</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Kategori</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Tanggal</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Jumlah</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                                                }`}>
                                                {tx.type === 'income' ? '📈' : '📉'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{tx.description}</p>
                                                {tx.receipt && (
                                                    <span className="text-xs text-primary-400">📎 Ada bukti</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{tx.date}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Edit">
                                                ✏️
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Hapus">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-6">Tambah Transaksi</h2>

                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex rounded-xl bg-slate-700/50 p-1">
                                <label className="flex-1">
                                    <input type="radio" name="type" value="expense" defaultChecked className="peer hidden" />
                                    <div className="py-2 text-center rounded-lg text-slate-400 peer-checked:bg-red-500 peer-checked:text-white cursor-pointer transition-all">
                                        Pengeluaran
                                    </div>
                                </label>
                                <label className="flex-1">
                                    <input type="radio" name="type" value="income" className="peer hidden" />
                                    <div className="py-2 text-center rounded-lg text-slate-400 peer-checked:bg-green-500 peer-checked:text-white cursor-pointer transition-all">
                                        Pemasukan
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.value} value={cat.label}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Jumlah (Rp)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="50000"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Deskripsi</label>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="Makan siang di warteg"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
                                <input
                                    type="date"
                                    name="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
