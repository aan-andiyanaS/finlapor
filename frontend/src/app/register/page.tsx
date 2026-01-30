'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'personal' | 'business'>('personal')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const ageStr = formData.get('age') as string
        const age = ageStr ? parseInt(ageStr) : null
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string


        if (password !== confirmPassword) {
            setError('Password tidak cocok')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, age, mode }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error?.message || 'Registrasi gagal. Coba lagi.')
                setIsLoading(false)
                return
            }

            // Store auth data
            localStorage.setItem('access_token', data.data.access_token)
            localStorage.setItem('refresh_token', data.data.refresh_token)
            localStorage.setItem('user', JSON.stringify(data.data.user))

            // Redirect to dashboard
            router.push('/dashboard')
        } catch (error) {
            console.error('Register error:', error)
            setError('Terjadi kesalahan. Pastikan backend running.')
        }

        setIsLoading(false)
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 p-12 flex-col justify-between">
                <div>
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-lg">
                            <Image
                                src="/logo.png"
                                alt="FinLapor Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                        </div>
                        <span className="text-2xl font-bold text-white">FinLapor</span>
                    </Link>
                </div>

                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Mulai perjalanan finansial Anda
                    </h1>
                    <p className="text-blue-100 text-lg mb-8">
                        Daftar gratis dan mulai kelola keuangan dengan mudah menggunakan teknologi AI
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: '📷', text: 'Scan struk otomatis dengan OCR AI' },
                            { icon: '📊', text: 'Dashboard interaktif real-time' },
                            { icon: '🤖', text: 'Asisten AI untuk saran keuangan' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <span>{item.icon}</span>
                                </div>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-blue-100 text-sm">
                    © 2026 FinLapor. All rights reserved.
                </p>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="FinLapor Logo"
                                width={48}
                                height={48}
                                className="rounded-xl shadow-lg shadow-blue-500/25"
                            />
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">FinLapor</span>
                        </Link>
                    </div>

                    <div className="card p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Buat Akun Baru</h1>
                            <p className="text-slate-500 dark:text-slate-400">Mulai kelola keuangan Anda dengan FinLapor</p>
                        </div>

                        {/* Mode Toggle */}
                        <div className="mb-6">
                            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('personal')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'personal'
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    👤 Personal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('business')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'business'
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    🏢 Bisnis/UMKM
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="label">Nama Lengkap</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="label">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="nama@email.com"
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="age" className="label">
                                    Usia <span className="text-slate-400 dark:text-slate-500 font-normal">(untuk personalisasi AI)</span>
                                </label>
                                <input
                                    type="number"
                                    id="age"
                                    name="age"
                                    placeholder="Contoh: 22"
                                    min="10"
                                    max="100"
                                    className="input"
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Opsional - Membantu AI memberikan saran yang lebih relevan</p>
                            </div>

                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="Minimal 8 karakter"
                                        className="input pr-12"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="label">Konfirmasi Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Ulangi password"
                                        className="input pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500"
                                    required
                                />
                                <label htmlFor="terms" className="text-sm text-slate-500 dark:text-slate-400">
                                    Saya setuju dengan{' '}
                                    <Link href="/terms" className="text-blue-500 hover:text-blue-600 font-medium">
                                        Syarat & Ketentuan
                                    </Link>{' '}
                                    dan{' '}
                                    <Link href="/privacy" className="text-blue-500 hover:text-blue-600 font-medium">
                                        Kebijakan Privasi
                                    </Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="spinner"></div>
                                        Memproses...
                                    </div>
                                ) : (
                                    'Daftar Sekarang'
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
