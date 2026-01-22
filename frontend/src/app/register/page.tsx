'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'personal' | 'business'>('personal')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string


        if (password !== confirmPassword) {
            setError('Password tidak cocok')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, mode }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error?.message || 'Registrasi gagal. Coba lagi.')
                setIsLoading(false)
                return
            }

            // Store auth data
            localStorage.setItem('token', data.data.access_token)
            localStorage.setItem('refreshToken', data.data.refresh_token)
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
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">F</span>
                        </div>
                        <span className="text-2xl font-bold text-white">FinLapor</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
                        <p className="text-slate-400">Mulai kelola keuangan Anda dengan FinLapor</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="mb-6">
                        <div className="flex rounded-xl bg-slate-700/50 p-1">
                            <button
                                type="button"
                                onClick={() => setMode('personal')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'personal'
                                    ? 'bg-primary-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                👤 Personal
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('business')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'business'
                                    ? 'bg-primary-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                🏢 Bisnis/UMKM
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="nama@email.com"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Minimal 8 karakter"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Ulangi password"
                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-slate-400">
                                Saya setuju dengan{' '}
                                <Link href="/terms" className="text-primary-400 hover:text-primary-300">
                                    Syarat & Ketentuan
                                </Link>{' '}
                                dan{' '}
                                <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                                    Kebijakan Privasi
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    Memproses...
                                </>
                            ) : (
                                'Daftar Sekarang'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
