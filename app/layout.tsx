// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Background from '@/components/layout/Background'
import PageIndicators from '@/components/layout/PageIndicators'
import FloatingCode from '@/components/layout/FloatingCode'

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
    viewport: {
        width: 'device-width',
        initialScale: 1,
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="scroll-snap-y">
        <head>
            <meta charSet="UTF-8" />
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body>
        {/* Fixed background elements - always visible */}
        <Background />

        {/* Floating code snippets */}
        <FloatingCode />

        {/* Page navigation indicators */}
        <PageIndicators />

        {/* Main content */}
        {children}
        </body>
        </html>
    )
}