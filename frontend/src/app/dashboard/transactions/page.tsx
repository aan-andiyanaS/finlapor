'use client'

import { useState, useEffect } from 'react'

interface Category {
    id: string
    name: string
    icon: string
}

interface Transaction {
    id: string
    type: 'income' | 'expense'
    category_id: string
    category?: Category
    amount: number
    description: string
    date: string
    receipt_url?: string
}

export default function TransactionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('all')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        fetchTransactions()
        fetchCategories()
    }, [])

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTransactions(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCategories(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true
        return tx.type === filter
    })

    const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const newTx = {
            type: formData.get('type') as string,
            category_id: formData.get('category_id') as string,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
            date: formData.get('date') as string,
        }

        try {
            const token = localStorage.getItem('token')
            const url = editingId
                ? `http://localhost:8080/api/transactions/${editingId}`
                : 'http://localhost:8080/api/transactions'

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTx)
            })

            if (res.ok) {
                fetchTransactions()
                setIsModalOpen(false)
                setEditingId(null)
            }
        } catch (error) {
            console.error('Error saving transaction:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus transaksi ini?')) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:8080/api/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                fetchTransactions()
            }
        } catch (error) {
            console.error('Error deleting transaction:', error)
        }
    }

    const handleEdit = (tx: Transaction) => {
        setEditingId(tx.id)
        setIsModalOpen(true)
        // Form will be pre-filled via defaultValue
    }

    const editingTransaction = editingId
        ? transactions.find(t => t.id === editingId)
        : null

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat transaksi...</p>
                </div>
            </div>
        )
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
                    onClick={() => { setEditingId(null); setIsModalOpen(true) }}
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

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h2 className="text-xl font-bold text-white mb-2">Belum Ada Transaksi</h2>
                    <p className="text-slate-400 mb-6">
                        {filter === 'all'
                            ? 'Mulai tambahkan transaksi pertama Anda'
                            : `Tidak ada ${filter === 'income' ? 'pemasukan' : 'pengeluaran'} yang tercatat`
                        }
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                    >
                        + Tambah Transaksi
                    </button>
                </div>
            )}

            {/* Transactions List */}
            {filteredTransactions.length > 0 && (
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
                                                    {tx.receipt_url && (
                                                        <span className="text-xs text-primary-400">📎 Ada bukti</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm">
                                                {tx.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(tx.date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(tx)}
                                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Hapus"
                                                >
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
            )}

            {/* Add/Edit Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                        </h2>

                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex rounded-xl bg-slate-700/50 p-1">
                                <label className="flex-1">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="expense"
                                        defaultChecked={!editingTransaction || editingTransaction.type === 'expense'}
                                        className="peer hidden"
                                    />
                                    <div className="py-2 text-center rounded-lg text-slate-400 peer-checked:bg-red-500 peer-checked:text-white cursor-pointer transition-all">
                                        Pengeluaran
                                    </div>
                                </label>
                                <label className="flex-1">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="income"
                                        defaultChecked={editingTransaction?.type === 'income'}
                                        className="peer hidden"
                                    />
                                    <div className="py-2 text-center rounded-lg text-slate-400 peer-checked:bg-green-500 peer-checked:text-white cursor-pointer transition-all">
                                        Pemasukan
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
                                <select
                                    name="category_id"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                    defaultValue={editingTransaction?.category_id}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
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
                                    defaultValue={editingTransaction?.amount}
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
                                    defaultValue={editingTransaction?.description}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
                                <input
                                    type="date"
                                    name="date"
                                    defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null) }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                >
                                    {editingId ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
