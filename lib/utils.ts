// lib/utils.ts

/* ============================================
   DELAY & TIMING UTILITIES
   ============================================ */

/**
 * Creates a promise that resolves after specified milliseconds
 * Useful for adding delays in async functions
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

/* ============================================
   DATE FORMATTING UTILITIES
   ============================================ */

/**
 * Formats a date string to "Month Year" format
 * @param dateString - Date in ISO format or any valid date string
 * @returns Formatted date like "January 2024"
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Formats a date range for experience/education
 * @param startDate - Start date string
 * @param endDate - End date string (optional, defaults to "Present")
 * @returns Formatted range like "Jan 2023 - Present"
 */
export function formatDateRange(
    startDate: string,
    endDate?: string | null
): string {
    const start = new Date(startDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    })

    if (!endDate) {
        return `${start} - Present`
    }

    const end = new Date(endDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    })

    return `${start} - ${end}`
}

/**
 * Calculates duration between two dates
 * @param startDate - Start date string
 * @param endDate - End date string (optional, uses current date if not provided)
 * @returns Duration string like "2 years 3 months"
 */
export function calculateDuration(
    startDate: string,
    endDate?: string | null
): string {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()

    const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    if (years === 0) {
        return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
    } else if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`
    } else {
        return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
    }
}

/* ============================================
   STRING UTILITIES
   ============================================ */

/**
 * Capitalizes first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
}

/**
 * Converts string to URL-friendly slug
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/* ============================================
   ARRAY UTILITIES
   ============================================ */

/**
 * Shuffles array randomly (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

/**
 * Groups array items by a key
 */
export function groupBy<T>(
    array: T[],
    key: keyof T
): Record<string, T[]> {
    return array.reduce((result, item) => {
        const group = String(item[key])
        if (!result[group]) {
            result[group] = []
        }
        result[group].push(item)
        return result
    }, {} as Record<string, T[]>)
}

/* ============================================
   VALIDATION UTILITIES
   ============================================ */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/* ============================================
   SCROLL UTILITIES
   ============================================ */

/**
 * Smoothly scrolls to an element
 */
export function scrollToElement(
    elementId: string,
    behavior: ScrollBehavior = 'smooth'
): void {
    const element = document.getElementById(elementId)
    if (element) {
        element.scrollIntoView({ behavior, block: 'start' })
    }
}

/**
 * Gets current scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
    return {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop,
    }
}

/* ============================================
   ANIMATION UTILITIES
   ============================================ */

/**
 * Generates a random number between min and max
 */
export function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
}

/* ============================================
   CLASS NAME UTILITIES
   ============================================ */

/**
 * Conditionally joins classNames together
 * Similar to the 'classnames' or 'clsx' libraries
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}

/* ============================================
   COPY TO CLIPBOARD
   ============================================ */

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
    }
}

/* ============================================
   LOCAL STORAGE UTILITIES
   ============================================ */

/**
 * Safely gets item from localStorage with JSON parsing
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue

    try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error)
        return defaultValue
    }
}

/**
 * Safely sets item in localStorage with JSON stringification
 */
export function setToStorage<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false

    try {
        window.localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error)
        return false
    }
}

/**
 * Removes item from localStorage
 */
export function removeFromStorage(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        window.localStorage.removeItem(key)
        return true
    } catch (error) {
        console.error(`Error removing from localStorage key "${key}":`, error)
        return false
    }
}