'use client'

import { useState, useRef } from 'react'

export default function ScannerPage() {
    const [image, setImage] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState<{
        vendor: string
        date: string
        total: number
        items: { name: string; price: number }[]
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target?.result as string)
                processImage()
            }
            reader.readAsDataURL(file)
        }
    }

    const processImage = async () => {
        setIsProcessing(true)

        // Simulate AI OCR processing
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Mock OCR result
        setResult({
            vendor: 'Alfamart Sudirman',
            date: '2026-01-22',
            total: 87500,
            items: [
                { name: 'Indomie Goreng x2', price: 7000 },
                { name: 'Aqua 600ml', price: 5500 },
                { name: 'Teh Botol Sosro', price: 6000 },
                { name: 'Roti Tawar', price: 15000 },
                { name: 'Telur 1kg', price: 28000 },
                { name: 'Minyak Goreng 1L', price: 26000 },
            ]
        })

        setIsProcessing(false)
    }

    const handleSaveTransaction = () => {
        alert('Transaksi berhasil disimpan!')
        setImage(null)
        setResult(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Scan Struk 📷</h1>
                <p className="text-slate-400">Upload foto struk untuk input transaksi otomatis dengan AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Area */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Upload Struk</h2>

                    {!image ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-all"
                        >
                            <div className="text-6xl mb-4">📷</div>
                            <p className="text-white font-medium mb-2">Klik untuk upload atau drag & drop</p>
                            <p className="text-slate-400 text-sm">Mendukung JPG, PNG, PDF (maks 10MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative rounded-xl overflow-hidden bg-slate-700">
                                <img src={image} alt="Receipt" className="w-full h-auto" />
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-white font-medium">Memproses dengan AI...</p>
                                            <p className="text-slate-400 text-sm">Mengekstrak data dari struk</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setImage(null); setResult(null); }}
                                className="w-full py-2 px-4 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                            >
                                🔄 Upload Ulang
                            </button>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="mt-6 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                        <h3 className="text-primary-400 font-medium mb-2">💡 Tips untuk hasil terbaik:</h3>
                        <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Pastikan pencahayaan cukup</li>
                            <li>• Foto struk dari atas, tegak lurus</li>
                            <li>• Pastikan semua tulisan terlihat jelas</li>
                            <li>• Hindari struk yang kusut atau robek</li>
                        </ul>
                    </div>
                </div>

                {/* Result Area */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Hasil Scan</h2>

                    {!result ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-30">🧾</div>
                            <p className="text-slate-400">Upload struk untuk melihat hasil scan</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Vendor & Date */}
                            <div className="p-4 rounded-xl bg-slate-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-400 text-sm">Toko</span>
                                    <input
                                        type="text"
                                        value={result.vendor}
                                        className="bg-transparent text-white font-medium text-right focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Tanggal</span>
                                    <input
                                        type="date"
                                        value={result.date}
                                        className="bg-transparent text-white text-right focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-4 rounded-xl bg-slate-700/50">
                                <p className="text-slate-400 text-sm mb-3">Item Terdeteksi</p>
                                <div className="space-y-2">
                                    {result.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-white">{item.name}</span>
                                            <span className="text-slate-300">Rp {item.price.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">Total</span>
                                    <span className="text-2xl font-bold text-white">
                                        Rp {result.total.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option>🛒 Belanja</option>
                                    <option>🍔 Makan & Minum</option>
                                    <option>📄 Tagihan</option>
                                    <option>📦 Lainnya</option>
                                </select>
                            </div>

                            {/* Confidence */}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400">Akurasi:</span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[92%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                                </div>
                                <span className="text-green-400 font-medium">92%</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setResult(null)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                                >
                                    ✏️ Edit Manual
                                </button>
                                <button
                                    onClick={handleSaveTransaction}
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                >
                                    ✅ Simpan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
