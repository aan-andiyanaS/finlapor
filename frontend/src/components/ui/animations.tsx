'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    className?: string
    formatOptions?: Intl.NumberFormatOptions
}

export function AnimatedCounter({
    value,
    duration = 1.5,
    prefix = '',
    suffix = '',
    className = '',
    formatOptions = {}
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    const spring = useSpring(0, {
        duration: duration * 1000,
        bounce: 0
    })

    const display = useTransform(spring, (current) => {
        return new Intl.NumberFormat('id-ID', formatOptions).format(Math.round(current))
    })

    const [displayValue, setDisplayValue] = useState('0')

    useEffect(() => {
        if (isInView) {
            spring.set(value)
        }
    }, [isInView, spring, value])

    useEffect(() => {
        const unsubscribe = display.on('change', (v) => {
            setDisplayValue(v)
        })
        return () => unsubscribe()
    }, [display])

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    )
}

// Staggered container for child animations
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
}

// Fade up animation for items
export const fadeInUp = {
    hidden: {
        opacity: 0,
        y: 20
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 15
        }
    }
}

// Scale in animation
export const scaleIn = {
    hidden: {
        opacity: 0,
        scale: 0.9
    },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    }
}

// Slide in from left
export const slideInLeft = {
    hidden: {
        opacity: 0,
        x: -30
    },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    }
}

// Animated Card component with hover effects
interface AnimatedCardProps {
    children: React.ReactNode
    className?: string
    delay?: number
    hoverScale?: number
}

export function AnimatedCard({
    children,
    className = '',
    delay = 0,
    hoverScale = 1.02
}: AnimatedCardProps) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay,
                type: 'spring',
                stiffness: 100,
                damping: 15
            }}
            whileHover={{
                y: -4,
                scale: hoverScale,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.div>
    )
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    )
}

// Dynamic greeting based on time
export function getGreeting(): { text: string; emoji: string } {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) {
        return { text: 'Selamat Pagi', emoji: '🌅' }
    } else if (hour >= 12 && hour < 17) {
        return { text: 'Selamat Siang', emoji: '☀️' }
    } else if (hour >= 17 && hour < 21) {
        return { text: 'Selamat Sore', emoji: '🌆' }
    } else {
        return { text: 'Selamat Malam', emoji: '🌙' }
    }
}

// Success animation (confetti-like bounce)
export const successPop = {
    hidden: { scale: 0, opacity: 0 },
    show: {
        scale: [0, 1.2, 1],
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 10
        }
    }
}

// Pulse animation for attention
export const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
    }
}
