import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

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
                </Providers>
            </body>
        </html>
    )
}
