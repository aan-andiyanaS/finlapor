'use client'

import { useState } from 'react'

const reportTypes = [
    { id: 'monthly', name: 'Ringkasan Bulanan', icon: '📅', desc: 'Overview keuangan bulan ini' },
    { id: 'income', name: 'Laporan Laba Rugi', icon: '📊', desc: 'Income statement standar' },
    { id: 'category', name: 'Per Kategori', icon: '🏷️', desc: 'Breakdown per kategori pengeluaran' },
    { id: 'trend', name: 'Analisis Tren', icon: '📈', desc: 'Perbandingan antar periode' },
]

const mockReports = [
    { id: 1, name: 'Ringkasan Januari 2026', type: 'monthly', date: '2026-01-22', size: '245 KB' },
    { id: 2, name: 'Laporan Laba Rugi Q4 2025', type: 'income', date: '2026-01-01', size: '1.2 MB' },
    { id: 3, name: 'Kategori Desember 2025', type: 'category', date: '2025-12-31', size: '180 KB' },
]

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedReport, setGeneratedReport] = useState<{ url: string; name: string } | null>(null)

    const handleGenerate = async () => {
        if (!selectedType) return

        setIsGenerating(true)

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 2000))

        setGeneratedReport({
            url: '#',
            name: `Laporan_${selectedType}_${new Date().toISOString().split('T')[0]}.pdf`
        })

        setIsGenerating(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Laporan 📊</h1>
                <p className="text-slate-400">Generate dan download laporan keuangan Anda</p>
            </div>

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
                                defaultValue="2026-01-01"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sampai Tanggal</label>
                            <input
                                type="date"
                                defaultValue="2026-01-22"
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
                                <div className="spinner"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                ⚡ Generate Laporan
                            </>
                        )}
                    </button>

                    {/* Generated Report */}
                    {generatedReport && (
                        <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-medium text-white">Laporan siap!</p>
                                        <p className="text-sm text-slate-400">{generatedReport.name}</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
                                    ⬇️ Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report History */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Riwayat Laporan</h2>

                    <div className="space-y-3">
                        {mockReports.map((report) => (
                            <div
                                key={report.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-600/50 flex items-center justify-center">
                                        📄
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{report.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {report.date} • {report.size}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Preview">
                                        👁️
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors" title="Download">
                                        ⬇️
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {mockReports.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-30">📊</div>
                            <p className="text-slate-400">Belum ada laporan yang dibuat</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
