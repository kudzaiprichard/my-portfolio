// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Background from '@/components/layout/Background'
import ScrollHint from '@/components/layout/ScrollHint'
import CustomCursor from '@/components/layout/CustomCursor'

export const metadata: Metadata = {
    title: 'Kudzai Prichard | AI & Full Stack Developer',
    description: 'Building intelligent systems and scalable applications. Specializing in AI/ML, backend architecture, and modern web technologies.',
    keywords: ['AI Developer', 'Full Stack Developer', 'Machine Learning', 'Web Development', 'Portfolio'],
    authors: [{ name: 'Kudzai Prichard' }],
    creator: 'Kudzai Prichard',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        title: 'Kudzai Prichard | AI & Full Stack Developer',
        description: 'Building intelligent systems and scalable applications.',
        siteName: 'Kudzai Prichard Portfolio',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Kudzai Prichard | AI & Full Stack Developer',
        description: 'Building intelligent systems and scalable applications.',
    },
    robots: {
        index: true,
        follow: true,
    },
    // viewport REMOVED from here
}

// Add this separate viewport export
export const viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <meta charSet="UTF-8" />
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body suppressHydrationWarning>
        {/* Fixed background elements - always visible */}
        <Background />

        {/* Custom cursor */}
        <CustomCursor />

        {/* Scroll hint indicator */}
        <ScrollHint />

        {/* Main content */}
        {children}
        </body>
        </html>
    )
}