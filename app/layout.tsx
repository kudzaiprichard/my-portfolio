// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Background from '@/src/components/layout/Background'
import ScrollHint from '@/src/components/layout/ScrollHint'
import CustomCursor from '@/src/components/layout/CustomCursor'
import BootScreen from '@/src/components/layout/BootScreen'
import { BootProvider } from '@/src/components/layout/context/BootContext'
import StructuredData from "@/src/components/layout/seo/StructuredData";
import SEOContent from "@/src/components/layout/seo/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: 'Kudzai Prichard | AI & Full Stack Developer',
    description:
        'Building intelligent systems and scalable applications. Specializing in AI/ML, backend architecture, and modern web technologies.',
    keywords: [
        'Kudzai Prichard',
        'AI Developer',
        'Full Stack Developer',
        'Machine Learning Engineer',
        'Python Developer',
        'React Developer',
        'Portfolio',
        'Zimbabwe Developer',
    ],
    authors: [{ name: 'Kudzai Prichard', url: baseUrl }],
    creator: 'Kudzai Prichard',
    alternates: {
        canonical: baseUrl,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: baseUrl,
        title: 'Kudzai Prichard | AI & Full Stack Developer',
        description:
            'Building intelligent systems and scalable applications. Specializing in AI/ML, backend architecture, and modern web technologies.',
        siteName: 'Kudzai Prichard Portfolio',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Kudzai Prichard — AI & Full Stack Developer',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        // TODO: Replace with your real Twitter/X handle
        creator: '@kudzaiprichard',
        title: 'Kudzai Prichard | AI & Full Stack Developer',
        description:
            'Building intelligent systems and scalable applications.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#00ff41',
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
            <link rel="icon" href="/favicon.ico" sizes="32x32" />
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
            <link rel="icon" href="/web-app-manifest-192x192.png" type="image/png" sizes="192x192" />
            <link rel="icon" href="/web-app-manifest-512x512.png" type="image/png" sizes="512x512" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
            <link rel="manifest" href="/site.webmanifest" />
            <StructuredData />
        </head>
        <body suppressHydrationWarning>
        <BootProvider>
            {/* Hidden semantic content for crawlers */}
            <SEOContent />

            {/* Boot screen overlay */}
            <BootScreen />

            {/* Fixed background elements */}
            <Background />

            {/* Custom cursor */}
            <CustomCursor />

            {/* Scroll hint indicator */}
            <ScrollHint />

            {/* Main content */}
            {children}
        </BootProvider>
        </body>
        </html>
    )
}