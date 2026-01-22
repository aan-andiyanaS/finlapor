'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface OCRResult {
    vendor: string
    total: number
    items?: { name: string; price: number }[]
    raw_text?: string
    ai_enabled?: boolean
}

interface Category {
    id: string
    name: string
}

export default function ScannerPage() {
    const router = useRouter()
    const [image, setImage] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState<OCRResult | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCategories(data.data || [])
                if (data.data?.length > 0) {
                    setSelectedCategory(data.data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const processImage = async () => {
        if (!imageFile) return

        setIsProcessing(true)
        setResult(null)

        try {
            const token = localStorage.getItem('token')

            // Upload image first
            const formData = new FormData()
            formData.append('file', imageFile)

            const uploadRes = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (!uploadRes.ok) {
                throw new Error('Upload failed')
            }

            const uploadData = await uploadRes.json()
            const imageUrl = uploadData.data.url

            // Call OCR API
            const ocrRes = await fetch('http://localhost:8080/api/ocr/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image_url: imageUrl })
            })

            if (ocrRes.ok) {
                const ocrData = await ocrRes.json()
                setResult(ocrData.data)
            } else {
                throw new Error('OCR failed')
            }
        } catch (error) {
            console.error('Error processing image:', error)
            alert('Gagal memproses gambar. Coba lagi.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSaveTransaction = async () => {
        if (!result) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8080/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'expense',
                    category_id: selectedCategory,
                    amount: result.total,
                    description: `Belanja di ${result.vendor}`,
                    date: new Date().toISOString().split('T')[0]
                })
            })

            if (res.ok) {
                alert('✅ Transaksi berhasil disimpan!')
                setImage(null)
                setImageFile(null)
                setResult(null)
                router.push('/dashboard/transactions')
            } else {
                throw new Error('Save failed')
            }
        } catch (error) {
            console.error('Error saving transaction:', error)
            alert('Gagal menyimpan transaksi')
        }
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
                            <p className="text-white font-medium mb-2">Klik untuk upload</p>
                            <p className="text-slate-400 text-sm">Mendukung JPG, PNG (maks 10MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setImage(null); setImageFile(null); setResult(null); }}
                                    className="flex-1 py-2 px-4 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                                >
                                    🔄 Upload Ulang
                                </button>
                                {!result && !isProcessing && (
                                    <button
                                        onClick={processImage}
                                        className="flex-1 py-2 px-4 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                                    >
                                        🔍 Scan Sekarang
                                    </button>
                                )}
                            </div>
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

                    {/* AI Status */}
                    {result && (
                        <div className="mt-4 p-3 rounded-lg bg-slate-700/50 flex items-center gap-2">
                            <span className="text-xl">{result.ai_enabled ? '🤖' : '⚙️'}</span>
                            <div className="flex-1">
                                <p className="text-sm text-white font-medium">
                                    {result.ai_enabled ? 'AI Real (HuggingFace)' : 'Mode Fallback'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {result.ai_enabled ? 'Menggunakan Donut OCR model' : 'Mock data untuk demo'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Area */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Hasil Scan</h2>

                    {!result ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-30">🧾</div>
                            <p className="text-slate-400">Upload dan scan struk untuk melihat hasil</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Vendor */}
                            <div className="p-4 rounded-xl bg-slate-700/50">
                                <label className="block text-slate-400 text-sm mb-2">Toko</label>
                                <input
                                    type="text"
                                    value={result.vendor}
                                    onChange={(e) => setResult({ ...result, vendor: e.target.value })}
                                    className="w-full bg-transparent text-white font-medium focus:outline-none"
                                />
                            </div>

                            {/* Items (if available) */}
                            {result.items && result.items.length > 0 && (
                                <div className="p-4 rounded-xl bg-slate-700/50">
                                    <p className="text-slate-400 text-sm mb-3">Item Terdeteksi</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {result.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-white text-sm">{item.name}</span>
                                                <span className="text-slate-300 text-sm">Rp {item.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">Total</span>
                                    <input
                                        type="number"
                                        value={result.total}
                                        onChange={(e) => setResult({ ...result, total: Number(e.target.value) })}
                                        className="text-2xl font-bold text-white bg-transparent text-right focus:outline-none w-48"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Raw Text (if fallback) */}
                            {result.raw_text && (
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                                    <p className="text-xs text-slate-400 mb-1">Raw OCR Output:</p>
                                    <p className="text-xs text-slate-300 font-mono">{result.raw_text}</p>
                                </div>
                            )}

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
