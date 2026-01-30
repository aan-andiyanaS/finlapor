'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ResponsiveContainer
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
    const [trendChartType, setTrendChartType] = useState<'line' | 'bar'>('line')
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
            const txRes = await fetch(`${API_URL}/api/transactions?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (txRes.ok) {
                const data = await txRes.json()
                setTransactions(data.data || [])
            }

            // Fetch categories
            const catRes = await fetch(`${API_URL}/api/categories`, {
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

    // Export functions - Bank Statement Style PDF with Pie Charts
    const exportToPDF = async () => {
        setExporting(true)
        setExportType('pdf')

        try {
            const jsPDF = (await import('jspdf')).default

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 12
            let yPosition = margin
            let currentPage = 1

            // Colors for pie chart
            const PIE_COLORS = [
                [6, 182, 212],   // cyan
                [139, 92, 246],  // purple
                [245, 158, 11], // amber
                [239, 68, 68],  // red
                [16, 185, 129], // green
                [236, 72, 153], // pink
                [59, 130, 246], // blue
                [132, 204, 22], // lime
            ]

            // Helper for adding page footer
            const addFooter = () => {
                pdf.setFontSize(8)
                pdf.setTextColor(128, 128, 128)
                pdf.text(`Halaman ${currentPage}`, margin, pageHeight - 8)
                pdf.text(`FinLapor - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - margin - 55, pageHeight - 8)
            }

            // Helper for adding new page
            const addNewPage = () => {
                addFooter()
                pdf.addPage()
                currentPage++
                yPosition = margin
            }

            // Helper to draw pie chart
            const drawPieChart = (centerX: number, centerY: number, radius: number, data: { name: string, value: number }[], title: string) => {
                const total = data.reduce((sum, d) => sum + d.value, 0)
                if (total === 0) return

                // Title
                pdf.setFontSize(9)
                pdf.setTextColor(30, 41, 59)
                pdf.text(title, centerX - pdf.getTextWidth(title) / 2, centerY - radius - 8)

                let startAngle = -Math.PI / 2 // Start from top

                data.forEach((item, index) => {
                    const sliceAngle = (item.value / total) * 2 * Math.PI
                    const endAngle = startAngle + sliceAngle

                    // Draw pie slice using lines (simplified approach)
                    const color = PIE_COLORS[index % PIE_COLORS.length]
                    pdf.setFillColor(color[0], color[1], color[2])

                    // Create pie slice path
                    const steps = 20
                    const points: [number, number][] = [[centerX, centerY]]
                    for (let i = 0; i <= steps; i++) {
                        const angle = startAngle + (sliceAngle * i / steps)
                        points.push([
                            centerX + radius * Math.cos(angle),
                            centerY + radius * Math.sin(angle)
                        ])
                    }

                    // Draw polygon
                    if (points.length > 2) {
                        pdf.setDrawColor(255, 255, 255)
                        pdf.setLineWidth(0.5)

                        // Use triangle fan approach
                        for (let i = 1; i < points.length - 1; i++) {
                            const triangle = [points[0], points[i], points[i + 1]]
                            pdf.triangle(
                                triangle[0][0], triangle[0][1],
                                triangle[1][0], triangle[1][1],
                                triangle[2][0], triangle[2][1],
                                'F'
                            )
                        }
                    }

                    startAngle = endAngle
                })

                // Draw legend below
                let legendY = centerY + radius + 8
                const legendX = centerX - 30
                data.slice(0, 5).forEach((item, index) => { // Max 5 items in legend
                    const color = PIE_COLORS[index % PIE_COLORS.length]
                    pdf.setFillColor(color[0], color[1], color[2])
                    pdf.rect(legendX, legendY - 2, 4, 4, 'F')

                    pdf.setFontSize(6)
                    pdf.setTextColor(51, 65, 85)
                    const percent = ((item.value / total) * 100).toFixed(0)
                    const text = `${item.name.substring(0, 12)} (${percent}%)`
                    pdf.text(text, legendX + 6, legendY + 1)
                    legendY += 6
                })
            }

            // ===== HEADER SECTION =====
            pdf.setFillColor(30, 41, 59)
            pdf.rect(0, 0, pageWidth, 40, 'F')

            pdf.setFontSize(22)
            pdf.setTextColor(59, 130, 246)
            pdf.text('F', margin, 18)
            pdf.setFontSize(18)
            pdf.setTextColor(255, 255, 255)
            pdf.text('inLapor', margin + 10, 18)

            pdf.setFontSize(9)
            pdf.setTextColor(148, 163, 184)
            pdf.text('LAPORAN MUTASI KEUANGAN', margin, 28)

            // Filter info
            const filterText = filters.type === 'all' ? 'Semua Transaksi' : filters.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
            pdf.text(`Filter: ${filterText}`, margin, 35)

            // Date range on right
            pdf.setFontSize(8)
            const periodText = `Periode: ${new Date(filters.dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(filters.dateTo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
            pdf.text(periodText, pageWidth - margin - pdf.getTextWidth(periodText), 18)

            const printDate = `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
            pdf.text(printDate, pageWidth - margin - pdf.getTextWidth(printDate), 26)

            yPosition = 48

            // ===== SUMMARY BOX =====
            const summaryData = summary()
            pdf.setFillColor(241, 245, 249)
            pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 28, 2, 2, 'F')
            pdf.setDrawColor(203, 213, 225)
            pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 28, 2, 2, 'S')

            const summaryBoxWidth = (pageWidth - margin * 2) / 4

            // Responsive summary based on filter
            if (filters.type === 'all') {
                // Show all 4 metrics
                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Total Pemasukan', margin + 6, yPosition + 8)
                pdf.setFontSize(10)
                pdf.setTextColor(34, 197, 94)
                pdf.text(`Rp ${summaryData.totalIncome.toLocaleString('id-ID')}`, margin + 6, yPosition + 17)

                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Total Pengeluaran', margin + summaryBoxWidth + 6, yPosition + 8)
                pdf.setFontSize(10)
                pdf.setTextColor(239, 68, 68)
                pdf.text(`Rp ${summaryData.totalExpense.toLocaleString('id-ID')}`, margin + summaryBoxWidth + 6, yPosition + 17)

                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Saldo Akhir', margin + summaryBoxWidth * 2 + 6, yPosition + 8)
                pdf.setFontSize(10)
                pdf.setTextColor(summaryData.balance >= 0 ? 34 : 239, summaryData.balance >= 0 ? 197 : 68, summaryData.balance >= 0 ? 94 : 68)
                pdf.text(`Rp ${summaryData.balance.toLocaleString('id-ID')}`, margin + summaryBoxWidth * 2 + 6, yPosition + 17)

                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Transaksi', margin + summaryBoxWidth * 3 + 6, yPosition + 8)
                pdf.setFontSize(10)
                pdf.setTextColor(59, 130, 246)
                pdf.text(`${summaryData.transactionCount}`, margin + summaryBoxWidth * 3 + 6, yPosition + 17)
            } else if (filters.type === 'income') {
                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Total Pemasukan', margin + 6, yPosition + 8)
                pdf.setFontSize(12)
                pdf.setTextColor(34, 197, 94)
                pdf.text(`Rp ${summaryData.totalIncome.toLocaleString('id-ID')}`, margin + 6, yPosition + 18)

                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Jumlah Transaksi', margin + (pageWidth - margin * 2) / 2, yPosition + 8)
                pdf.setFontSize(12)
                pdf.setTextColor(59, 130, 246)
                pdf.text(`${summaryData.transactionCount} transaksi`, margin + (pageWidth - margin * 2) / 2, yPosition + 18)
            } else {
                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Total Pengeluaran', margin + 6, yPosition + 8)
                pdf.setFontSize(12)
                pdf.setTextColor(239, 68, 68)
                pdf.text(`Rp ${summaryData.totalExpense.toLocaleString('id-ID')}`, margin + 6, yPosition + 18)

                pdf.setFontSize(7)
                pdf.setTextColor(100, 116, 139)
                pdf.text('Jumlah Transaksi', margin + (pageWidth - margin * 2) / 2, yPosition + 8)
                pdf.setFontSize(12)
                pdf.setTextColor(59, 130, 246)
                pdf.text(`${summaryData.transactionCount} transaksi`, margin + (pageWidth - margin * 2) / 2, yPosition + 18)
            }

            yPosition += 35

            // ===== PIE CHARTS SECTION =====
            const pieData = pieChartData()
            const chartRadius = 22
            const chartSectionHeight = 75

            if (filters.type === 'all' && (pieData.incomeData.length > 0 || pieData.expenseData.length > 0)) {
                // Show both charts side by side
                pdf.setFontSize(10)
                pdf.setTextColor(30, 41, 59)
                pdf.text('DISTRIBUSI KATEGORI', margin, yPosition)
                yPosition += 5

                if (pieData.expenseData.length > 0) {
                    drawPieChart(margin + 45, yPosition + chartRadius + 10, chartRadius, pieData.expenseData, 'Pengeluaran')
                }
                if (pieData.incomeData.length > 0) {
                    drawPieChart(pageWidth - margin - 45, yPosition + chartRadius + 10, chartRadius, pieData.incomeData, 'Pemasukan')
                }
                yPosition += chartSectionHeight
            } else if (filters.type === 'income' && pieData.incomeData.length > 0) {
                pdf.setFontSize(10)
                pdf.setTextColor(30, 41, 59)
                pdf.text('DISTRIBUSI PEMASUKAN PER KATEGORI', margin, yPosition)
                yPosition += 5
                drawPieChart(pageWidth / 2, yPosition + chartRadius + 10, chartRadius + 5, pieData.incomeData, '')
                yPosition += chartSectionHeight
            } else if (filters.type === 'expense' && pieData.expenseData.length > 0) {
                pdf.setFontSize(10)
                pdf.setTextColor(30, 41, 59)
                pdf.text('DISTRIBUSI PENGELUARAN PER KATEGORI', margin, yPosition)
                yPosition += 5
                drawPieChart(pageWidth / 2, yPosition + chartRadius + 10, chartRadius + 5, pieData.expenseData, '')
                yPosition += chartSectionHeight
            }

            // ===== TRANSACTION TABLE =====
            pdf.setFontSize(10)
            pdf.setTextColor(30, 41, 59)
            pdf.text('RINCIAN MUTASI', margin, yPosition)
            yPosition += 6

            // Adjusted column widths - total should be pageWidth - margin * 2 = 186mm for A4
            const contentWidth = pageWidth - margin * 2
            const colWidths = {
                no: 8,
                date: 22,
                desc: 50,
                category: 28,
                debit: 26,
                credit: 26,
                balance: 26
            }

            // Table Header
            pdf.setFillColor(30, 41, 59)
            pdf.rect(margin, yPosition, contentWidth, 7, 'F')

            pdf.setFontSize(6)
            pdf.setTextColor(255, 255, 255)
            let xPos = margin + 2
            pdf.text('NO', xPos, yPosition + 4.5)
            xPos += colWidths.no
            pdf.text('TANGGAL', xPos, yPosition + 4.5)
            xPos += colWidths.date
            pdf.text('KETERANGAN', xPos, yPosition + 4.5)
            xPos += colWidths.desc
            pdf.text('KATEGORI', xPos, yPosition + 4.5)
            xPos += colWidths.category
            pdf.text('DEBIT (-)', xPos, yPosition + 4.5)
            xPos += colWidths.debit
            pdf.text('KREDIT (+)', xPos, yPosition + 4.5)
            xPos += colWidths.credit
            pdf.text('SALDO', xPos, yPosition + 4.5)

            yPosition += 8

            // Table Rows
            let runningBalance = 0
            const sortedTx = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            sortedTx.forEach((tx, index) => {
                if (yPosition > pageHeight - 20) {
                    addNewPage()

                    // Redraw table header
                    pdf.setFillColor(30, 41, 59)
                    pdf.rect(margin, yPosition, contentWidth, 7, 'F')
                    pdf.setFontSize(6)
                    pdf.setTextColor(255, 255, 255)
                    let xPos = margin + 2
                    pdf.text('NO', xPos, yPosition + 4.5)
                    xPos += colWidths.no
                    pdf.text('TANGGAL', xPos, yPosition + 4.5)
                    xPos += colWidths.date
                    pdf.text('KETERANGAN', xPos, yPosition + 4.5)
                    xPos += colWidths.desc
                    pdf.text('KATEGORI', xPos, yPosition + 4.5)
                    xPos += colWidths.category
                    pdf.text('DEBIT (-)', xPos, yPosition + 4.5)
                    xPos += colWidths.debit
                    pdf.text('KREDIT (+)', xPos, yPosition + 4.5)
                    xPos += colWidths.credit
                    pdf.text('SALDO', xPos, yPosition + 4.5)
                    yPosition += 8
                }

                const amount = tx.total_amount || tx.amount
                if (tx.type === 'income') {
                    runningBalance += amount
                } else {
                    runningBalance -= amount
                }

                // Alternating row
                if (index % 2 === 0) {
                    pdf.setFillColor(248, 250, 252)
                    pdf.rect(margin, yPosition - 2.5, contentWidth, 6, 'F')
                }

                pdf.setFontSize(6)
                pdf.setTextColor(51, 65, 85)

                xPos = margin + 2
                pdf.text(`${index + 1}`, xPos, yPosition + 1)
                xPos += colWidths.no

                pdf.text(new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), xPos, yPosition + 1)
                xPos += colWidths.date

                pdf.text((tx.description || '-').substring(0, 25), xPos, yPosition + 1)
                xPos += colWidths.desc

                pdf.text((tx.items?.[0]?.category?.name || tx.category?.name || '-').substring(0, 14), xPos, yPosition + 1)
                xPos += colWidths.category

                // Debit
                if (tx.type === 'expense') {
                    pdf.setTextColor(239, 68, 68)
                    pdf.text(amount.toLocaleString('id-ID'), xPos, yPosition + 1)
                }
                pdf.setTextColor(51, 65, 85)
                xPos += colWidths.debit

                // Credit
                if (tx.type === 'income') {
                    pdf.setTextColor(34, 197, 94)
                    pdf.text(amount.toLocaleString('id-ID'), xPos, yPosition + 1)
                }
                pdf.setTextColor(51, 65, 85)
                xPos += colWidths.credit

                // Balance
                pdf.setTextColor(runningBalance >= 0 ? 34 : 239, runningBalance >= 0 ? 100 : 68, runningBalance >= 0 ? 100 : 68)
                pdf.text(runningBalance.toLocaleString('id-ID'), xPos, yPosition + 1)

                yPosition += 5.5
            })

            // Bottom line
            pdf.setDrawColor(203, 213, 225)
            pdf.line(margin, yPosition, pageWidth - margin, yPosition)

            addFooter()
            pdf.save(`FinLapor-Mutasi-${filters.dateFrom}-${filters.dateTo}.pdf`)
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
                    <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Memuat data laporan...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Keuangan 📊</h1>
                <p className="text-slate-500 dark:text-slate-400">Analisis lengkap keuangan Anda dengan grafik interaktif</p>
            </div>

            {!hasData ? (
                <div className="card p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Belum Ada Data</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Tambahkan transaksi terlebih dahulu untuk melihat laporan</p>
                    <a href="/dashboard/transactions" className="btn-primary">
                        Tambah Transaksi
                    </a>
                </div>
            ) : (
                <>
                    {/* Filters Section - Collapsible on Mobile */}
                    <div className="card overflow-hidden">
                        {/* Filter Header - Always visible, clickable on mobile */}
                        <button
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                            className="w-full p-4 sm:p-6 flex items-center justify-between sm:cursor-default"
                        >
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🔍 Filter Data</h2>
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
                                    <label className="label">📅 Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, dateFrom: e.target.value })); setCurrentPage(1) }}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">📅 Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, dateTo: e.target.value })); setCurrentPage(1) }}
                                        className="input"
                                    />
                                </div>

                                {/* Month Filter */}
                                <div>
                                    <label className="label">📆 Bulan</label>
                                    <select
                                        value={filters.selectedMonth}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, selectedMonth: e.target.value })); setCurrentPage(1) }}
                                        className="input"
                                    >
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="label">💰 Tipe</label>
                                    <select
                                        value={filters.type}
                                        onChange={(e) => { setFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'income' | 'expense' })); setCurrentPage(1) }}
                                        className="input"
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
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl p-6 border border-emerald-200 dark:border-green-500/20">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Pemasukan</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-green-400">Rp {summary().totalIncome.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        {/* Pengeluaran - hide when income filter */}
                        {filters.type !== 'income' && (
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/20 dark:to-orange-500/20 rounded-2xl p-6 border border-red-200 dark:border-red-500/20">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Pengeluaran</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">Rp {summary().totalExpense.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        {/* Saldo - only show when all */}
                        {filters.type === 'all' && (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-500/20">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Saldo</p>
                                <p className={`text-2xl font-bold ${summary().balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                    Rp {summary().balance.toLocaleString('id-ID')}
                                </p>
                            </div>
                        )}
                        {/* Jumlah Transaksi - always show */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-500/20">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Jumlah Transaksi</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary().transactionCount}</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div ref={chartRef} className="space-y-6">

                        {/* Section: Ringkasan Bulanan - Pie Charts */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">📅 Ringkasan Bulanan</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Distribusi pemasukan dan pengeluaran berdasarkan kategori</p>

                            {/* Dynamic grid: 2 cols when all, FULL WIDTH when filtered */}
                            <div className={`grid gap-6 ${filters.type === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Expense Pie Chart - Hide when income filter, show LEFT when all */}
                                {filters.type !== 'income' && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📉 Distribusi Pengeluaran</h3>
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
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📈 Distribusi Pemasukan</h3>
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
                            <div className="card p-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">📊 Laporan Laba Rugi</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Perbandingan pemasukan vs pengeluaran per bulan</p>

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
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🏷️ Analisis Per Kategori</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Breakdown detail pemasukan dan pengeluaran berdasarkan kategori</p>

                            <div className={`grid gap-6 ${filters.type === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Income Categories - Left side, hide when expense filter */}
                                {filters.type !== 'expense' && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-emerald-600 dark:text-green-400 mb-4">📈 Pemasukan</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-600">
                                                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Kategori</th>
                                                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryChartData()
                                                        .filter(c => c.income > 0)
                                                        .sort((a, b) => b.income - a.income)
                                                        .map((cat, index) => (
                                                            <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/30">
                                                                <td className="px-3 py-3 text-slate-900 dark:text-white">{cat.name}</td>
                                                                <td className="px-3 py-3 text-right text-emerald-600 dark:text-green-400 font-medium">
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
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">📉 Pengeluaran</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-600">
                                                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Kategori</th>
                                                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryChartData()
                                                        .filter(c => c.expense > 0)
                                                        .sort((a, b) => b.expense - a.expense)
                                                        .map((cat, index) => (
                                                            <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/30">
                                                                <td className="px-3 py-3 text-slate-900 dark:text-white">{cat.name}</td>
                                                                <td className="px-3 py-3 text-right text-red-600 dark:text-red-400 font-medium">
                                                                    Rp {cat.expense.toLocaleString('id-ID')}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {categoryChartData().filter(c => c.expense > 0).length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
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

                        {/* Section: Analisis Tren - Toggle Line/Bar Chart */}
                        {filters.type !== 'expense' && (
                            <div className="card p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">📈 Analisis Tren</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Grafik pergerakan saldo dari waktu ke waktu</p>
                                    </div>
                                    {/* Chart Type Toggle */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mt-3 sm:mt-0">
                                        <button
                                            onClick={() => setTrendChartType('line')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${trendChartType === 'line'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            📈 Line
                                        </button>
                                        <button
                                            onClick={() => setTrendChartType('bar')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${trendChartType === 'bar'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            📊 Bar
                                        </button>
                                    </div>
                                </div>

                                {trendChartData().length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        {trendChartType === 'line' ? (
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
                                        ) : (
                                            <BarChart data={trendChartData()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                                <XAxis dataKey="date" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                                                <Tooltip
                                                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Saldo']}
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                />
                                                <Bar dataKey="balance" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        )}
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
                    <div className="card p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📋 Daftar Transaksi ({filtered.length})</h3>
                            <div className="flex gap-2">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'amount' | 'category' }))}
                                    className="input text-sm py-2"
                                >
                                    <option value="date">Urutkan: Tanggal</option>
                                    <option value="amount">Urutkan: Jumlah</option>
                                    <option value="category">Urutkan: Kategori</option>
                                </select>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                                    className="btn-secondary py-2 px-3"
                                >
                                    {filters.sortOrder === 'desc' ? '↓' : '↑'}
                                </button>
                            </div>
                        </div>

                        {paginatedTransactions.length > 0 ? (
                            <>
                                <div className="space-y-2">
                                    {paginatedTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                                                    {tx.type === 'income' ? '📈' : '📉'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{tx.description || 'Tanpa deskripsi'}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                                        <span>•</span>
                                                        <span>{tx.items?.[0]?.category?.name || tx.category?.name || 'Lainnya'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                                            className="btn-secondary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Prev
                                        </button>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="btn-secondary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🔍</div>
                                <p className="text-slate-500 dark:text-slate-400">Tidak ada transaksi yang sesuai dengan filter</p>
                            </div>
                        )}
                    </div>

                    {/* Export Section - Compact Design */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📥</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Export Laporan</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF dengan grafik • Excel untuk analisis</p>
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
