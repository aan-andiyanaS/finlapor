import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'FinLapor - Kelola Keuangan dengan AI',
    description: 'Aplikasi manajemen keuangan berbasis AI. Scan struk otomatis, dapatkan insight cerdas, dan buat laporan keuangan dengan mudah.',
    keywords: ['keuangan', 'manajemen keuangan', 'UMKM', 'AI', 'OCR', 'laporan keuangan'],
    authors: [{ name: 'FinLapor Team' }],
    openGraph: {
        title: 'FinLapor - Kelola Keuangan dengan AI',
        description: 'Aplikasi manajemen keuangan berbasis AI',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: 'var(--toast-bg, #fff)',
                                border: '1px solid var(--toast-border, #e2e8f0)',
                                color: 'var(--toast-color, #1e293b)',
                            },
                            className: 'rounded-xl shadow-lg',
                        }}
                        richColors
                        closeButton
                    />
                </Providers>
            </body>
        </html>
    )
}
