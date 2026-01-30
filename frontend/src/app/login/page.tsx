'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')


        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error?.message || 'Login gagal. Periksa email dan password Anda.')
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
            console.error('Login error:', error)
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
                        Selamat datang kembali!
                    </h1>
                    <p className="text-blue-100 text-lg">
                        Masuk untuk melanjutkan mengelola keuangan Anda dengan AI-powered insights.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {['A', 'B', 'C', 'D'].map((letter, i) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-medium border-2 border-blue-500">
                                {letter}
                            </div>
                        ))}
                    </div>
                    <p className="text-blue-100 text-sm">
                        Bergabung dengan <strong>10,000+</strong> pengguna aktif
                    </p>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
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
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Masuk ke Akun</h1>
                            <p className="text-slate-500 dark:text-slate-400">Masukkan email dan password Anda</p>
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

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                <label htmlFor="password" className="label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        className="input pr-12"
                                        required
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

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500" />
                                    Ingat saya
                                </label>
                                <Link href="/forgot-password" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                                    Lupa password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="spinner"></div>
                                        Memproses...
                                    </div>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white dark:bg-slate-900 text-slate-400">atau</span>
                                </div>
                            </div>

                            <button className="mt-4 w-full btn-secondary py-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Masuk dengan Google
                            </button>
                        </div>

                        <p className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                            Belum punya akun?{' '}
                            <Link href="/register" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                                Daftar gratis
                            </Link>
                        </p>
                    </div>

                    {/* Demo Account Hint */}
                    <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                            💡 <strong>Demo:</strong> demo@finlapor.airi.click / demo123
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
