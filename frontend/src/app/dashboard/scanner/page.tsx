'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
    icon?: string
}

// Helper function to get category icon
const getCategoryIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
        'Makanan': '🍔',
        'Transport': '🚗',
        'Belanja': '🛒',
        'Hiburan': '🎬',
        'Kesehatan': '🏥',
        'Pendidikan': '📚',
        'Tagihan': '💳',
        'Lainnya': '📦'
    }
    return iconMap[name] || '📁'
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
            const token = localStorage.getItem('access_token')
            const res = await fetch(`${API_URL}/api/categories`, {
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
            const token = localStorage.getItem('access_token')

            // Upload image first
            const formData = new FormData()
            formData.append('file', imageFile)

            const uploadRes = await fetch(`${API_URL}/api/upload`, {
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
            const ocrRes = await fetch(`${API_URL}/api/ocr/scan`, {
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
            const res = await fetch(`${API_URL}/api/transactions`, {
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
            {/* Development Notice */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🚧</span>
                    <div className="flex-1">
                        <h3 className="text-amber-700 dark:text-amber-400 font-semibold mb-1">Fitur OCR AI Masih Dalam Pengembangan</h3>
                        <p className="text-amber-600 dark:text-amber-200/80 text-sm">
                            Saat ini sistem menggunakan data demo untuk demonstrasi. Integrasi AI OCR dengan HuggingFace sedang dalam tahap pengembangan dan akan segera tersedia untuk analisis struk secara otomatis.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scan Struk 📷</h1>
                <p className="text-slate-500 dark:text-slate-400">Upload foto struk untuk input transaksi otomatis dengan AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Area */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upload Struk</h2>

                    {!image ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all"
                        >
                            <div className="text-6xl mb-4">📷</div>
                            <p className="text-slate-900 dark:text-white font-medium mb-2">Klik untuk upload</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Mendukung JPG, PNG (maks 10MB)</p>
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
                            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                                <img src={image} alt="Receipt" className="w-full h-auto" />
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                                            <p className="text-white font-medium">Memproses dengan AI...</p>
                                            <p className="text-slate-300 text-sm">Mengekstrak data dari struk</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setImage(null); setImageFile(null); setResult(null); }}
                                    className="btn-secondary flex-1"
                                >
                                    🔄 Upload Ulang
                                </button>
                                {!result && !isProcessing && (
                                    <button
                                        onClick={processImage}
                                        className="btn-primary flex-1"
                                    >
                                        🔍 Scan Sekarang
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                        <h3 className="text-blue-700 dark:text-blue-400 font-medium mb-2">💡 Tips untuk hasil terbaik:</h3>
                        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <li>• Pastikan pencahayaan cukup</li>
                            <li>• Foto struk dari atas, tegak lurus</li>
                            <li>• Pastikan semua tulisan terlihat jelas</li>
                            <li>• Hindari struk yang kusut atau robek</li>
                        </ul>
                    </div>

                    {/* AI Status */}
                    {result && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2">
                            <span className="text-xl">🚧</span>
                            <div className="flex-1">
                                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                    Mode Demo (Pengembangan)
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-200/70">
                                    Menggunakan data demo. OCR AI sedang dalam pengembangan.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Area */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hasil Scan</h2>

                    {!result ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-30">🧾</div>
                            <p className="text-slate-500 dark:text-slate-400">Upload dan scan struk untuk melihat hasil</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Vendor */}
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Toko</label>
                                <input
                                    type="text"
                                    value={result.vendor}
                                    onChange={(e) => setResult({ ...result, vendor: e.target.value })}
                                    className="w-full bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none"
                                />
                            </div>

                            {/* Items (if available) */}
                            {result.items && result.items.length > 0 && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Item Terdeteksi</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {result.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-slate-900 dark:text-white text-sm">{item.name}</span>
                                                <span className="text-slate-600 dark:text-slate-300 text-sm">Rp {item.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-900 dark:text-white font-medium">Total</span>
                                    <input
                                        type="number"
                                        value={result.total}
                                        onChange={(e) => setResult({ ...result, total: Number(e.target.value) })}
                                        className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent text-right focus:outline-none w-48"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="label">Kategori</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="input"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon || getCategoryIcon(cat.name)} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Raw Text (if fallback) */}
                            {result.raw_text && (
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Raw OCR Output:</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">{result.raw_text}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setResult(null)}
                                    className="btn-secondary flex-1"
                                >
                                    ✏️ Edit Manual
                                </button>
                                <button
                                    onClick={handleSaveTransaction}
                                    className="btn-primary flex-1"
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
