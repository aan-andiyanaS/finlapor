'use client'

import { useState, useEffect } from 'react'

const reportTypes = [
    { id: 'monthly', name: 'Ringkasan Bulanan', icon: '📅', desc: 'Overview keuangan bulan ini' },
    { id: 'income', name: 'Laporan Laba Rugi', icon: '📊', desc: 'Income statement' },
    { id: 'category', name: 'Per Kategori', icon: '🏷️', desc: 'Breakdown per kategori' },
    { id: 'trend', name: 'Analisis Tren', icon: '📈', desc: 'Perbandingan periode' },
]

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [summary, setSummary] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch summary
            const summaryRes = await fetch('http://localhost:8080/api/dashboard/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (summaryRes.ok) {
                const data = await summaryRes.json()
                setSummary(data.data)
            }

            // Fetch transactions
            const txRes = await fetch('http://localhost:8080/api/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (txRes.ok) {
                const data = await txRes.json()
                setTransactions(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    const handleGenerate = () => {
        if (!selectedType) return

        setIsGenerating(true)

        // Generate report based on real data
        const filtered = transactions.filter(tx => {
            const txDate = new Date(tx.date)
            return txDate >= new Date(dateFrom) && txDate <= new Date(dateTo)
        })

        // Simulate processing
        setTimeout(() => {
            // In real app, this would call backend API to generate PDF/Excel
            alert(`📊 Laporan ${selectedType} siap!\n\nData periode: ${dateFrom} - ${dateTo}\nTotal transaksi: ${filtered.length}\n\n✅ Dalam aplikasi production, file akan di-download otomatis.`)
            setIsGenerating(false)
        }, 1500)
    }

    const hasData = summary && (summary.totalIncome > 0 || summary.totalExpense > 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Laporan 📊</h1>
                <p className="text-slate-400">Generate laporan keuangan dari data real Anda</p>
            </div>

            {!hasData ? (
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold text-white mb-2">Belum Ada Data</h2>
                    <p className="text-slate-400 mb-6">
                        Tambahkan transaksi terlebih dahulu untuk generate laporan
                    </p>
                    <a
                        href="/dashboard/transactions"
                        className="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                    >
                        Tambah Transaksi
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Generate Report */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white mb-4">Generate Laporan Baru</h2>

                        {/* Report Types */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {reportTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`p-4 rounded-xl text-left transition-all ${selectedType === type.id
                                            ? 'bg-primary-500/20 border-2 border-primary-500'
                                            : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-2xl">{type.icon}</span>
                                    <p className="font-medium text-white mt-2">{type.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Period Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                            <div className="flex gap-3">
                                <label className="flex-1">
                                    <input type="radio" name="format" value="pdf" defaultChecked className="peer hidden" />
                                    <div className="py-3 text-center rounded-xl bg-slate-700/50 border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-500/20 cursor-pointer transition-all text-slate-300 peer-checked:text-white">
                                        📄 PDF
                                    </div>
                                </label>
                                <label className="flex-1">
                                    <input type="radio" name="format" value="excel" className="peer hidden" />
                                    <div className="py-3 text-center rounded-xl bg-slate-700/50 border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-500/20 cursor-pointer transition-all text-slate-300 peer-checked:text-white">
                                        📊 Excel
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedType || isGenerating}
                            className="w-full py-3 px-4 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                '⚡ Generate Laporan'
                            )}
                        </button>

                        <p className="text-xs text-slate-400 mt-3 text-center">
                            Data dari {new Date(dateFrom).toLocaleDateString('id-ID')} - {new Date(dateTo).toLocaleDateString('id-ID')}
                        </p>
                    </div>

                    {/* Summary Preview */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white mb-4">Preview Data</h2>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <p className="text-sm text-slate-400 mb-1">Total Pemasukan</p>
                                <p className="text-2xl font-bold text-green-400">
                                    Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-sm text-slate-400 mb-1">Total Pengeluaran</p>
                                <p className="text-2xl font-bold text-red-400">
                                    Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                                <p className="text-sm text-slate-400 mb-1">Saldo</p>
                                <p className="text-2xl font-bold text-white">
                                    Rp {(summary?.balance || 0).toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-700/30">
                                <p className="text-sm text-slate-400 mb-1">Total Transaksi</p>
                                <p className="text-2xl font-bold text-white">
                                    {transactions.length} transaksi
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <p className="text-sm text-slate-400 mb-1">Rasio Tabungan</p>
                                <p className="text-2xl font-bold text-purple-400">
                                    {summary?.savingsRatio || 0}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                            <p className="text-xs text-slate-400">
                                💡 Tip: Laporan akan berisi grafik, tabel detail, dan analisis lengkap dari data periode yang dipilih
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
