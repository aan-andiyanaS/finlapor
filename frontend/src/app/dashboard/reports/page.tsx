'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ResponsiveContainer
} from 'recharts'

// Types
interface Category {
    id: string
    name: string
    type?: string
}

interface TransactionItem {
    id?: string
    category_id: string
    category?: Category
    amount: number
    note?: string
}

interface Transaction {
    id: string
    type: 'income' | 'expense'
    category_id?: string
    category?: Category
    amount: number
    total_amount?: number
    description: string
    date: string
    receipt_url?: string
    items?: TransactionItem[]
    created_at?: string
}

interface FilterState {
    dateFrom: string
    dateTo: string
    selectedMonth: string
    type: 'all' | 'income' | 'expense'
    sortBy: 'date' | 'amount' | 'category'
    sortOrder: 'asc' | 'desc'
}

// Color palette for charts
const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#6366f1']

const months = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
]

export default function ReportsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null)
    const [showMobileFilter, setShowMobileFilter] = useState(false)
    const chartRef = useRef<HTMLDivElement>(null)

    const [filters, setFilters] = useState<FilterState>({
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        selectedMonth: '',
        type: 'all',
        sortBy: 'date',
        sortOrder: 'desc'
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token')

            // Fetch transactions
            const txRes = await fetch('http://localhost:8080/api/transactions?limit=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (txRes.ok) {
                const data = await txRes.json()
                setTransactions(data.data || [])
            }

            // Fetch categories
            const catRes = await fetch('http://localhost:8080/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (catRes.ok) {
                const data = await catRes.json()
                setCategories(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter transactions based on current filters
    const filteredTransactions = useCallback(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date)
            const fromDate = new Date(filters.dateFrom)
            const toDate = new Date(filters.dateTo)

            // Date range filter
            if (txDate < fromDate || txDate > toDate) return false

            // Month filter
            if (filters.selectedMonth) {
                const txMonth = (txDate.getMonth() + 1).toString().padStart(2, '0')
                if (txMonth !== filters.selectedMonth) return false
            }

            // Type filter
            if (filters.type !== 'all' && tx.type !== filters.type) return false

            return true
        }).sort((a, b) => {
            let comparison = 0
            switch (filters.sortBy) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
                    break
                case 'amount':
                    comparison = (a.total_amount || a.amount) - (b.total_amount || b.amount)
                    break
                case 'category':
                    const catA = a.items?.[0]?.category?.name || a.category?.name || ''
                    const catB = b.items?.[0]?.category?.name || b.category?.name || ''
                    comparison = catA.localeCompare(catB)
                    break
            }
            return filters.sortOrder === 'desc' ? -comparison : comparison
        })
    }, [transactions, filters])

    const filtered = filteredTransactions()
    const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)

    // Calculate summary
    const summary = useCallback(() => {
        const data = filteredTransactions()
        const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.total_amount || t.amount), 0)
        const totalExpense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.total_amount || t.amount), 0)
        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: data.length
        }
    }, [filteredTransactions])

    // Prepare chart data (uses ALL transactions for charting, ignoring type filter for category breakdown)
    const categoryChartData = useCallback(() => {
        // For category chart, use transactions filtered only by date (not by type)
        const data = transactions.filter(tx => {
            const txDate = new Date(tx.date)
            const fromDate = new Date(filters.dateFrom)
            const toDate = new Date(filters.dateTo)
            if (txDate < fromDate || txDate > toDate) return false
            if (filters.selectedMonth) {
                const txMonth = (txDate.getMonth() + 1).toString().padStart(2, '0')
                if (txMonth !== filters.selectedMonth) return false
            }
            return true
        })

        const categoryMap = new Map<string, { name: string, income: number, expense: number }>()

        data.forEach(tx => {
            const items = tx.items && tx.items.length > 0 ? tx.items : [{ category: tx.category, amount: tx.total_amount || tx.amount }]

            items.forEach((item: { category?: Category, amount: number }) => {
                const catName = item.category?.name || 'Lainnya'
                const existing = categoryMap.get(catName) || { name: catName, income: 0, expense: 0 }

                if (tx.type === 'income') {
                    existing.income += item.amount
                } else {
                    existing.expense += item.amount
                }
                categoryMap.set(catName, existing)
            })
        })

        return Array.from(categoryMap.values())
    }, [transactions, filters.dateFrom, filters.dateTo, filters.selectedMonth])

    const pieChartData = useCallback(() => {
        const catData = categoryChartData()
        const incomeData = catData.filter(c => c.income > 0).map(c => ({ name: c.name, value: c.income }))
        const expenseData = catData.filter(c => c.expense > 0).map(c => ({ name: c.name, value: c.expense }))
        return { incomeData, expenseData }
    }, [categoryChartData])

    const monthlyChartData = useCallback(() => {
        // Uses ALL transactions (ignoring type filter) for comparison chart
        const data = transactions.filter(tx => {
            const txDate = new Date(tx.date)
            const fromDate = new Date(filters.dateFrom)
            const toDate = new Date(filters.dateTo)
            if (txDate < fromDate || txDate > toDate) return false
            if (filters.selectedMonth) {
                const txMonth = (txDate.getMonth() + 1).toString().padStart(2, '0')
                if (txMonth !== filters.selectedMonth) return false
            }
            return true
        })

        const monthMap = new Map<string, { month: string, income: number, expense: number }>()

        data.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

            const existing = monthMap.get(monthKey) || { month: monthLabel, income: 0, expense: 0 }
            if (tx.type === 'income') {
                existing.income += tx.total_amount || tx.amount
            } else {
                existing.expense += tx.total_amount || tx.amount
            }
            monthMap.set(monthKey, existing)
        })

        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, value]) => value)
    }, [transactions, filters.dateFrom, filters.dateTo, filters.selectedMonth])

    const trendChartData = useCallback(() => {
        const data = filteredTransactions()
        const dailyMap = new Map<string, { date: string, balance: number }>()

        let runningBalance = 0
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        sortedData.forEach(tx => {
            const dateKey = tx.date.split('T')[0]
            const amount = tx.total_amount || tx.amount
            runningBalance += tx.type === 'income' ? amount : -amount

            dailyMap.set(dateKey, {
                date: new Date(dateKey).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                balance: runningBalance
            })
        })

        return Array.from(dailyMap.values())
    }, [filteredTransactions])

    // Export functions - Optimized PDF with smaller file size
    const exportToPDF = async () => {
        setExporting(true)
        setExportType('pdf')

        try {
            const html2canvas = (await import('html2canvas')).default
            const jsPDF = (await import('jspdf')).default

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 12
            let yPosition = margin

            // Header with logo-like styling
            pdf.setFillColor(15, 23, 42) // slate-900
            pdf.rect(0, 0, pageWidth, 35, 'F')

            pdf.setFontSize(18)
            pdf.setTextColor(255, 255, 255)
            pdf.text('FinLapor', margin, 15)

            pdf.setFontSize(10)
            pdf.setTextColor(148, 163, 184) // slate-400
            pdf.text('Laporan Keuangan', margin, 22)

            pdf.setFontSize(8)
            pdf.text(`Periode: ${new Date(filters.dateFrom).toLocaleDateString('id-ID')} - ${new Date(filters.dateTo).toLocaleDateString('id-ID')}`, margin, 28)

            // Date generated on the right
            const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            pdf.setTextColor(148, 163, 184)
            pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), 28)

            yPosition = 45

            // Summary Section
            const summaryData = summary()
            pdf.setFillColor(30, 41, 59) // slate-800
            pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 28, 3, 3, 'F')

            pdf.setFontSize(9)
            pdf.setTextColor(148, 163, 184)
            const colWidth = (pageWidth - margin * 2) / 4

            // Income
            pdf.text('Pemasukan', margin + 5, yPosition + 8)
            pdf.setFontSize(11)
            pdf.setTextColor(34, 197, 94) // green-500
            pdf.text(`Rp ${summaryData.totalIncome.toLocaleString('id-ID')}`, margin + 5, yPosition + 18)

            // Expense
            pdf.setFontSize(9)
            pdf.setTextColor(148, 163, 184)
            pdf.text('Pengeluaran', margin + colWidth + 5, yPosition + 8)
            pdf.setFontSize(11)
            pdf.setTextColor(239, 68, 68) // red-500
            pdf.text(`Rp ${summaryData.totalExpense.toLocaleString('id-ID')}`, margin + colWidth + 5, yPosition + 18)

            // Balance
            pdf.setFontSize(9)
            pdf.setTextColor(148, 163, 184)
            pdf.text('Saldo', margin + colWidth * 2 + 5, yPosition + 8)
            pdf.setFontSize(11)
            pdf.setTextColor(summaryData.balance >= 0 ? 59 : 239, summaryData.balance >= 0 ? 130 : 68, summaryData.balance >= 0 ? 246 : 68)
            pdf.text(`Rp ${summaryData.balance.toLocaleString('id-ID')}`, margin + colWidth * 2 + 5, yPosition + 18)

            // Transaction Count
            pdf.setFontSize(9)
            pdf.setTextColor(148, 163, 184)
            pdf.text('Transaksi', margin + colWidth * 3 + 5, yPosition + 8)
            pdf.setFontSize(11)
            pdf.setTextColor(168, 85, 247) // purple-500
            pdf.text(`${summaryData.transactionCount}`, margin + colWidth * 3 + 5, yPosition + 18)

            yPosition += 38

            // Capture charts with lower quality for smaller file size
            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, {
                    scale: 1.2, // Lower scale for smaller file
                    backgroundColor: '#1e293b',
                    logging: false,
                    useCORS: true
                })

                const imgData = canvas.toDataURL('image/jpeg', 0.7) // JPEG with 70% quality
                const imgWidth = pageWidth - (margin * 2)
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                // Check if need new page
                if (yPosition + imgHeight > pageHeight - margin) {
                    pdf.addPage()
                    yPosition = margin
                }

                const maxHeight = Math.min(imgHeight, pageHeight - yPosition - margin - 10)
                pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, maxHeight)
                yPosition += maxHeight + 8
            }

            // Transaction table with better styling
            if (yPosition > pageHeight - 60) {
                pdf.addPage()
                yPosition = margin
            }

            // Table header
            pdf.setFillColor(30, 41, 59)
            pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 8, 2, 2, 'F')

            pdf.setFontSize(8)
            pdf.setTextColor(148, 163, 184)
            pdf.text('No', margin + 3, yPosition + 5.5)
            pdf.text('Tanggal', margin + 12, yPosition + 5.5)
            pdf.text('Deskripsi', margin + 35, yPosition + 5.5)
            pdf.text('Kategori', margin + 90, yPosition + 5.5)
            pdf.text('Jumlah', pageWidth - margin - 30, yPosition + 5.5)
            yPosition += 10

            // Table rows
            const maxRows = Math.min(filtered.length, 30) // Limit rows
            filtered.slice(0, maxRows).forEach((tx, index) => {
                if (yPosition > pageHeight - 15) {
                    pdf.addPage()
                    yPosition = margin
                }

                // Alternating row colors
                if (index % 2 === 0) {
                    pdf.setFillColor(30, 41, 59, 0.3)
                    pdf.rect(margin, yPosition - 3, pageWidth - margin * 2, 7, 'F')
                }

                pdf.setFontSize(7)
                pdf.setTextColor(200, 200, 200)
                pdf.text(`${index + 1}`, margin + 3, yPosition + 1)
                pdf.text(new Date(tx.date).toLocaleDateString('id-ID'), margin + 12, yPosition + 1)
                pdf.text((tx.description || '-').substring(0, 25), margin + 35, yPosition + 1)
                pdf.text((tx.items?.[0]?.category?.name || tx.category?.name || 'Lainnya').substring(0, 15), margin + 90, yPosition + 1)

                pdf.setTextColor(tx.type === 'income' ? 34 : 239, tx.type === 'income' ? 197 : 68, tx.type === 'income' ? 94 : 68)
                const amountText = `${tx.type === 'income' ? '+' : '-'}Rp ${(tx.total_amount || tx.amount).toLocaleString('id-ID')}`
                pdf.text(amountText, pageWidth - margin - 3 - pdf.getTextWidth(amountText), yPosition + 1)

                yPosition += 6
            })

            if (filtered.length > maxRows) {
                pdf.setFontSize(7)
                pdf.setTextColor(148, 163, 184)
                pdf.text(`... dan ${filtered.length - maxRows} transaksi lainnya`, margin + 3, yPosition + 3)
            }

            // Footer
            pdf.setFontSize(7)
            pdf.setTextColor(100, 100, 100)
            pdf.text(`Generated by FinLapor • ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 5)

            // Save with compression
            pdf.save(`FinLapor-Laporan-${filters.dateFrom}-${filters.dateTo}.pdf`)
        } catch (error) {
            console.error('Error exporting PDF:', error)
            alert('Gagal mengexport PDF')
        } finally {
            setExporting(false)
            setExportType(null)
        }
    }

    const exportToExcel = async () => {
        setExporting(true)
        setExportType('excel')

        try {
            const XLSX = await import('xlsx')

            const workbook = XLSX.utils.book_new()

            // Sheet 1: Summary
            const summaryData = summary()
            const summarySheet = XLSX.utils.aoa_to_sheet([
                ['LAPORAN KEUANGAN FINLAPOR'],
                [''],
                ['Periode', `${filters.dateFrom} s/d ${filters.dateTo}`],
                ['Tanggal Generate', new Date().toLocaleDateString('id-ID')],
                [''],
                ['RINGKASAN KEUANGAN'],
                ['Total Pemasukan', summaryData.totalIncome],
                ['Total Pengeluaran', summaryData.totalExpense],
                ['Saldo', summaryData.balance],
                ['Jumlah Transaksi', summaryData.transactionCount],
            ])
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

            // Sheet 2: Transactions
            const txData = filtered.map(tx => ({
                'Tanggal': new Date(tx.date).toLocaleDateString('id-ID'),
                'Deskripsi': tx.description || '-',
                'Tipe': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                'Kategori': tx.items?.[0]?.category?.name || tx.category?.name || 'Lainnya',
                'Jumlah': tx.total_amount || tx.amount,
            }))
            const txSheet = XLSX.utils.json_to_sheet(txData)
            XLSX.utils.book_append_sheet(workbook, txSheet, 'Transaksi')

            // Sheet 3: Category Breakdown
            const catData = categoryChartData().map(c => ({
                'Kategori': c.name,
                'Pemasukan': c.income,
                'Pengeluaran': c.expense,
            }))
            const catSheet = XLSX.utils.json_to_sheet(catData)
            XLSX.utils.book_append_sheet(workbook, catSheet, 'Per Kategori')

            // Save
            XLSX.writeFile(workbook, `FinLapor-Laporan-${filters.dateFrom}-${filters.dateTo}.xlsx`)
        } catch (error) {
            console.error('Error exporting Excel:', error)
            alert('Gagal mengexport Excel')
        } finally {
            setExporting(false)
            setExportType(null)
        }
    }

    const hasData = transactions.length > 0

    // Get grid class for summary cards based on filter
    const getSummaryGridClass = () => {
        if (filters.type === 'income') return 'grid-cols-1 sm:grid-cols-2'
        if (filters.type === 'expense') return 'grid-cols-1 sm:grid-cols-2'
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat data laporan...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Laporan Keuangan 📊</h1>
                <p className="text-slate-400">Analisis lengkap keuangan Anda dengan grafik interaktif</p>
            </div>

            {!hasData ? (
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold text-white mb-2">Belum Ada Data</h2>
                    <p className="text-slate-400 mb-6">Tambahkan transaksi terlebih dahulu untuk melihat laporan</p>
                    <a href="/dashboard/transactions" className="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                        Tambah Transaksi
                    </a>
                </div>
            ) : (
                <>
                    {/* Filters Section - Collapsible on Mobile */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        {/* Filter Header - Always visible, clickable on mobile */}
                        <button
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                            className="w-full p-4 sm:p-6 flex items-center justify-between sm:cursor-default"
                        >
                            <h2 className="text-lg font-semibold text-white">🔍 Filter Data</h2>
                            {/* Hamburger icon - only visible on mobile */}
                            <div className="sm:hidden flex flex-col gap-1 p-2">
                                <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-300 ${showMobileFilter ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-300 ${showMobileFilter ? 'opacity-0' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-300 ${showMobileFilter ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                            </div>
                        </button>

                        {/* Filter Content - Hidden on mobile unless toggled, always visible on sm+ */}
                        <div className={`px-4 pb-4 sm:px-6 sm:pb-6 sm:pt-0 transition-all duration-300 ease-in-out ${showMobileFilter ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden sm:max-h-none sm:opacity-100'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Date Range */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">📅 Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, dateFrom: e.target.value })); setCurrentPage(1) }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">📅 Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, dateTo: e.target.value })); setCurrentPage(1) }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Month Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">📆 Bulan</label>
                                    <select
                                        value={filters.selectedMonth}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, selectedMonth: e.target.value })); setCurrentPage(1) }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">💰 Tipe</label>
                                    <select
                                        value={filters.type}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'income' | 'expense' })); setCurrentPage(1) }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="all">Semua</option>
                                        <option value="income">Pemasukan</option>
                                        <option value="expense">Pengeluaran</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards - Dynamic based on filter */}
                    <div className={`grid ${getSummaryGridClass()} gap-4`}>
                        {/* Pemasukan - hide when expense filter */}
                        {filters.type !== 'expense' && (
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/20">
                                <p className="text-sm text-slate-400 mb-1">Total Pemasukan</p>
                                <p className="text-2xl font-bold text-green-400">Rp {summary().totalIncome.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        {/* Pengeluaran - hide when income filter */}
                        {filters.type !== 'income' && (
                            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 border border-red-500/20">
                                <p className="text-sm text-slate-400 mb-1">Total Pengeluaran</p>
                                <p className="text-2xl font-bold text-red-400">Rp {summary().totalExpense.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        {/* Saldo - only show when all */}
                        {filters.type === 'all' && (
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/20">
                                <p className="text-sm text-slate-400 mb-1">Saldo</p>
                                <p className={`text-2xl font-bold ${summary().balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    Rp {summary().balance.toLocaleString('id-ID')}
                                </p>
                            </div>
                        )}
                        {/* Jumlah Transaksi - always show */}
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/20">
                            <p className="text-sm text-slate-400 mb-1">Jumlah Transaksi</p>
                            <p className="text-2xl font-bold text-purple-400">{summary().transactionCount}</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div ref={chartRef} className="space-y-6">

                        {/* Section: Ringkasan Bulanan - Pie Charts */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                            <h2 className="text-xl font-bold text-white mb-2">📅 Ringkasan Bulanan</h2>
                            <p className="text-slate-400 text-sm mb-6">Distribusi pemasukan dan pengeluaran berdasarkan kategori</p>

                            {/* Dynamic grid: 2 cols when all, FULL WIDTH when filtered */}
                            <div className={`grid gap-6 ${filters.type === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Expense Pie Chart - Hide when income filter, show LEFT when all */}
                                {filters.type !== 'income' && (
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">📉 Distribusi Pengeluaran</h3>
                                        {pieChartData().expenseData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={filters.type === 'expense' ? 350 : 300}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartData().expenseData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={filters.type === 'expense' ? 120 : 100}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {pieChartData().expenseData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']}
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                                Tidak ada data pengeluaran
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Income Pie Chart - Hide when expense filter, show RIGHT when all */}
                                {filters.type !== 'expense' && (
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">📈 Distribusi Pemasukan</h3>
                                        {pieChartData().incomeData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={filters.type === 'income' ? 350 : 300}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartData().incomeData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={filters.type === 'income' ? 120 : 100}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {pieChartData().incomeData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']}
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                                Tidak ada data pemasukan
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Laporan Laba Rugi - Bar Chart (only visible when type is 'all') */}
                        {filters.type === 'all' && (
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                <h2 className="text-xl font-bold text-white mb-2">📊 Laporan Laba Rugi</h2>
                                <p className="text-slate-400 text-sm mb-6">Perbandingan pemasukan vs pengeluaran per bulan</p>

                                {monthlyChartData().length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={monthlyChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                            <XAxis dataKey="month" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[350px] flex items-center justify-center text-slate-400">
                                        Tidak ada data untuk ditampilkan
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section: Analisis Per Kategori - Separated Tables */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                            <h2 className="text-xl font-bold text-white mb-2">🏷️ Analisis Per Kategori</h2>
                            <p className="text-slate-400 text-sm mb-6">Breakdown detail pemasukan dan pengeluaran berdasarkan kategori</p>

                            <div className={`grid gap-6 ${filters.type === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Income Categories - Left side, hide when expense filter */}
                                {filters.type !== 'expense' && (
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-green-400 mb-4">📈 Pemasukan</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-600">
                                                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-300">Kategori</th>
                                                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-300">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryChartData()
                                                        .filter(c => c.income > 0)
                                                        .sort((a, b) => b.income - a.income)
                                                        .map((cat, index) => (
                                                            <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-600/30">
                                                                <td className="px-3 py-3 text-white">{cat.name}</td>
                                                                <td className="px-3 py-3 text-right text-green-400 font-medium">
                                                                    Rp {cat.income.toLocaleString('id-ID')}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {categoryChartData().filter(c => c.income > 0).length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-6 text-center text-slate-400">
                                                                Tidak ada data pemasukan
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Expense Categories - Right side, hide when income filter */}
                                {filters.type !== 'income' && (
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-red-400 mb-4">📉 Pengeluaran</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-600">
                                                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-300">Kategori</th>
                                                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-300">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryChartData()
                                                        .filter(c => c.expense > 0)
                                                        .sort((a, b) => b.expense - a.expense)
                                                        .map((cat, index) => (
                                                            <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-600/30">
                                                                <td className="px-3 py-3 text-white">{cat.name}</td>
                                                                <td className="px-3 py-3 text-right text-red-400 font-medium">
                                                                    Rp {cat.expense.toLocaleString('id-ID')}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {categoryChartData().filter(c => c.expense > 0).length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-6 text-center text-slate-400">
                                                                Tidak ada data pengeluaran
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Analisis Tren - Line Chart (hide when expense filter) */}
                        {filters.type !== 'expense' && (
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                <h2 className="text-xl font-bold text-white mb-2">📈 Analisis Tren</h2>
                                <p className="text-slate-400 text-sm mb-6">Grafik pergerakan saldo dari waktu ke waktu</p>

                                {trendChartData().length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={trendChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                            <XAxis dataKey="date" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                                            <Tooltip
                                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Saldo']}
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                            />
                                            <Line type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Tidak ada data untuk ditampilkan
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Transaction List */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                            <h3 className="text-lg font-semibold text-white">📋 Daftar Transaksi ({filtered.length})</h3>
                            <div className="flex gap-2">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'amount' | 'category' }))}
                                    className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="date">Urutkan: Tanggal</option>
                                    <option value="amount">Urutkan: Jumlah</option>
                                    <option value="category">Urutkan: Kategori</option>
                                </select>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                                    className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm hover:bg-slate-600"
                                >
                                    {filters.sortOrder === 'desc' ? '↓' : '↑'}
                                </button>
                            </div>
                        </div>

                        {paginatedTransactions.length > 0 ? (
                            <>
                                <div className="space-y-2">
                                    {paginatedTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                    {tx.type === 'income' ? '📈' : '📉'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{tx.description || 'Tanpa deskripsi'}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                                        <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                                        <span>•</span>
                                                        <span>{tx.items?.[0]?.category?.name || tx.category?.name || 'Lainnya'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.type === 'income' ? '+' : '-'}Rp {(tx.total_amount || tx.amount).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                                        >
                                            ← Prev
                                        </button>
                                        <span className="text-slate-400">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🔍</div>
                                <p className="text-slate-400">Tidak ada transaksi yang sesuai dengan filter</p>
                            </div>
                        )}
                    </div>

                    {/* Export Section - Compact Design */}
                    <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl p-4 border border-primary-500/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📥</span>
                                <div>
                                    <p className="text-sm font-medium text-white">Export Laporan</p>
                                    <p className="text-xs text-slate-400">PDF dengan grafik • Excel untuk analisis</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportToPDF}
                                    disabled={exporting}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {exporting && exportType === 'pdf' ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>📄</>
                                    )}
                                    PDF
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={exporting}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600/80 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {exporting && exportType === 'excel' ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>📊</>
                                    )}
                                    Excel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
