'use client'

import { useState, useEffect } from 'react'
import { uploadApi } from '@/lib/api'

interface Category {
    id: string
    name: string
    icon?: string
    type?: string
    group_id?: string
}

interface TransactionItem {
    id?: string
    category_id: string
    category?: Category
    amount: number
    note?: string
}

interface Transaction {
    id: string
    type: 'income' | 'expense'
    category_id?: string
    category?: Category
    amount: number
    total_amount?: number
    description: string
    date: string
    receipt_url?: string
    items?: TransactionItem[]
    created_at?: string
    updated_at?: string
}

const getCategoryIcon = (name?: string): string => {
    if (!name) return '📁'
    const iconMap: Record<string, string> = {
        'Makanan': '🍔', 'Transport': '🚗', 'Belanja': '🛒',
        'Hiburan': '🎬', 'Kesehatan': '🏥', 'Pendidikan': '📚',
        'Tagihan': '💳', 'Gaji': '💰', 'Freelance': '💼',
        'Investasi': '📈', 'Lainnya': '📦'
    }
    return iconMap[name] || '📁'
}

interface ItemState {
    category_id: string
    amount: string
    note: string
    qty: string
}

export default function TransactionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('all')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense')
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<ItemState[]>([{ category_id: '', amount: '', note: '', qty: '1' }])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchTransactions()
        fetchCategories()
    }, [])

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('access_token')
            // Fetch all transactions (high limit to get all)
            const res = await fetch('http://localhost:8080/api/transactions?limit=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                console.log('Fetched transactions:', data.data)
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
            const token = localStorage.getItem('access_token')
            const res = await fetch('http://localhost:8080/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                console.log('Fetched categories:', data.data)
                setCategories(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const filteredTransactions = transactions
        .filter(tx => {
            if (filter === 'all') return true
            return tx.type === filter
        })
        .sort((a, b) => {
            // Primary sort: by date descending (newest date first)
            const dateA = new Date(a.date).setHours(0, 0, 0, 0)
            const dateB = new Date(b.date).setHours(0, 0, 0, 0)
            if (dateB !== dateA) {
                return dateB - dateA
            }
            // Secondary sort: by created_at descending (newest first within same date)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0
            return createdB - createdA
        })

    const addItem = () => {
        setItems(prev => [...prev, { category_id: '', amount: '', note: '', qty: '1' }])
    }

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(prev => prev.filter((_, i) => i !== index))
        }
    }

    const updateItem = (index: number, field: keyof ItemState, value: string) => {
        setItems(prev => {
            const newItems = [...prev]
            newItems[index] = { ...newItems[index], [field]: value }
            return newItems
        })
    }

    const totalAmount = items.reduce((sum, item) => {
        const amt = parseFloat(item.amount) || 0
        const qty = parseInt(item.qty) || 1
        return sum + (amt * qty)
    }, 0)

    const resetForm = () => {
        setItems([{ category_id: '', amount: '', note: '', qty: '1' }])
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setFile(null)
        setEditingId(null)
    }

    const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        console.log('=== SUBMIT DEBUG ===')
        console.log('Items state:', items)
        console.log('Description:', description)
        console.log('Date:', date)
        console.log('Type:', selectedType)

        const validItems = items.filter(item => {
            const amt = parseFloat(item.amount)
            return item.category_id && !isNaN(amt) && amt > 0
        })

        console.log('Valid items:', validItems)

        if (validItems.length === 0) {
            alert('Tambahkan minimal satu kategori dengan jumlah yang valid')
            return
        }

        setSaving(true)
        try {
            const token = localStorage.getItem('access_token')

            let receiptUrl = ''
            if (file) {
                setUploading(true)
                try {
                    receiptUrl = await uploadApi.uploadFile(file)
                } catch (error) {
                    console.error('Upload failed:', error)
                } finally {
                    setUploading(false)
                }
            }

            const payload = {
                type: selectedType,
                description: description,
                date: date,
                receipt_url: receiptUrl || undefined,
                items: validItems.map(item => {
                    const unitPrice = parseFloat(item.amount) || 0
                    const qty = parseInt(item.qty) || 1
                    const qtyLabel = qty > 1 ? `${qty}x ` : ''
                    return {
                        category_id: item.category_id,
                        amount: unitPrice * qty,
                        note: `${qtyLabel}${item.note || ''}`.trim()
                    }
                })
            }

            console.log('Payload to send:', JSON.stringify(payload, null, 2))

            const url = editingId
                ? `http://localhost:8080/api/transactions/${editingId}`
                : 'http://localhost:8080/api/transactions'

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const responseData = await res.json()
            console.log('Response:', responseData)

            if (res.ok) {
                await fetchTransactions()
                setIsModalOpen(false)
                resetForm()
            } else {
                alert(`Gagal menyimpan: ${responseData.error?.message || JSON.stringify(responseData)}`)
            }
        } catch (error) {
            console.error('Error saving transaction:', error)
            alert('Gagal menyimpan transaksi.')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (tx: Transaction) => {
        console.log('Editing transaction:', tx)
        setEditingId(tx.id)
        setSelectedType(tx.type)
        setDescription(tx.description || '')
        setDate(tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])

        if (tx.items && tx.items.length > 0) {
            console.log('Loading items:', tx.items)
            setItems(tx.items.map(item => ({
                category_id: item.category_id || '',
                amount: item.amount?.toString() || '0',
                note: item.note || '',
                qty: '1'
            })))
        } else if (tx.category_id) {
            setItems([{
                category_id: tx.category_id,
                amount: (tx.total_amount || tx.amount)?.toString() || '0',
                note: '',
                qty: '1'
            }])
        } else {
            setItems([{
                category_id: '',
                amount: (tx.total_amount || tx.amount)?.toString() || '0',
                note: '',
                qty: '1'
            }])
        }

        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        setDeletingId(id)
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingId) return
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`http://localhost:8080/api/transactions/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                await fetchTransactions()
                setDeleteModalOpen(false)
                setDeletingId(null)
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    const filteredCategories = categories.filter(cat => cat.type === selectedType || cat.type === 'both')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Transaksi</h1>
                    <p className="text-slate-400">Kelola semua transaksi keuangan Anda</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setSelectedType('expense')
                        setIsModalOpen(true)
                    }}
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
            {filteredTransactions.length === 0 ? (
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h2 className="text-xl font-bold text-white mb-2">Belum Ada Transaksi</h2>
                    <p className="text-slate-400 mb-6">Mulai tambahkan transaksi pertama Anda</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.map((tx, index) => {
                        const txDate = new Date(tx.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        const prevTx = index > 0 ? filteredTransactions[index - 1] : null
                        const prevDate = prevTx ? new Date(prevTx.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null
                        const showDateHeader = txDate !== prevDate

                        return (
                            <div key={tx.id}>
                                {showDateHeader && (
                                    <div className="flex items-center gap-3 py-3 mt-2 first:mt-0">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                                        <span className="text-sm font-medium text-slate-400 px-3 py-1 rounded-full bg-slate-700/50">
                                            📅 {txDate}
                                        </span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                                    </div>
                                )}
                                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                                        onClick={() => toggleExpand(tx.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                {tx.type === 'income' ? '📈' : '📉'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{tx.description}</p>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                                    {tx.items && tx.items.length > 1 && (
                                                        <span className="text-purple-400">• {tx.items.length} kategori</span>
                                                    )}
                                                    {tx.receipt_url && <span className="text-primary-400">• 📎</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.type === 'income' ? '+' : '-'}Rp {(tx.total_amount || tx.amount || 0).toLocaleString('id-ID')}
                                            </p>
                                            <span className={`text-slate-400 transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>

                                    {expandedId === tx.id && (
                                        <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
                                            {tx.items && tx.items.length > 0 ? (
                                                <div className="space-y-2 mb-4">
                                                    <p className="text-sm font-medium text-slate-300 mb-2">Detail Kategori:</p>
                                                    {tx.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-lg">{getCategoryIcon(item.category?.name)}</span>
                                                                <div>
                                                                    <span className="text-white">{item.category?.name || 'Kategori tidak ditemukan'}</span>
                                                                    {item.note && <p className="text-xs text-slate-400">{item.note}</p>}
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-white">Rp {(item.amount || 0).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : tx.category ? (
                                                <div className="mb-4 p-3 rounded-xl bg-slate-800/50">
                                                    <span className="text-white">{tx.category.name}: Rp {(tx.amount || 0).toLocaleString('id-ID')}</span>
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 mb-4">Tidak ada detail kategori</p>
                                            )}

                                            {tx.receipt_url && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-slate-300 mb-2">Bukti:</p>
                                                    <img src={tx.receipt_url} alt="Receipt" className="max-w-xs rounded-xl border border-slate-700" />
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(tx) }}
                                                    className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id) }}
                                                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                >
                                                    🗑️ Hapus
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => { setIsModalOpen(false); resetForm() }} />
                    <div className="relative bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                        </h2>

                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="flex rounded-xl bg-slate-700/50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('expense')}
                                    className={`flex-1 py-2 text-center rounded-lg transition-all ${selectedType === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400'}`}
                                >
                                    Pengeluaran
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('income')}
                                    className={`flex-1 py-2 text-center rounded-lg transition-all ${selectedType === 'income' ? 'bg-green-500 text-white' : 'text-slate-400'}`}
                                >
                                    Pemasukan
                                </button>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Deskripsi</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Belanja Bulanan"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            {/* Items Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300">Kategori, Nama Barang & Jumlah</label>
                                    <button type="button" onClick={addItem} className="text-sm text-primary-400 hover:text-primary-300">
                                        + Tambah Item
                                    </button>
                                </div>

                                {items.map((item, index) => (
                                    <div key={index} className="p-3 rounded-xl bg-slate-700/30 space-y-2">
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={item.category_id}
                                                onChange={(e) => updateItem(index, 'category_id', e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                required
                                            >
                                                <option value="">Pilih Kategori</option>
                                                {filteredCategories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {getCategoryIcon(cat.name)} {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-400 hover:text-red-300">
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item.note}
                                                onChange={(e) => updateItem(index, 'note', e.target.value)}
                                                placeholder="Nama barang (opsional)"
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(index, 'qty', e.target.value || '1')}
                                                    min="1"
                                                    className="w-14 px-2 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                />
                                                <span className="text-slate-400 text-sm">x</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                placeholder="Harga"
                                                min="0"
                                                step="1000"
                                                className="w-28 px-3 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                    <span className="text-sm text-slate-400">Total:</span>
                                    <span className="text-lg font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Receipt Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bukti (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm() }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploading}
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : uploading ? 'Mengupload...' : (editingId ? 'Update' : 'Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🗑️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Hapus Transaksi?</h3>
                            <p className="text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600">Batal</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
