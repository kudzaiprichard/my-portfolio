// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import localFont from 'next/font/local'
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from '@/src/lib/themes'
import { CRT_STORAGE_KEY } from '@/src/lib/crtStore'
import { PLAIN_STORAGE_KEY } from '@/src/lib/plainMode'
import { BOOTED_KEY, TAB_BOOTED_KEY, bootBehaviour } from '@/src/constants/bootConfig'
import Background from '@/src/components/layout/Background'
import ScrollHint from '@/src/components/layout/ScrollHint'
import CustomCursor from '@/src/components/layout/CustomCursor'
import BootScreen from '@/src/components/layout/BootScreen'
import { BootProvider } from '@/src/components/layout/context/BootContext'
import { SITE_DESCRIPTION, SITE_TITLE } from "@/src/components/layout/seo/StructuredData";
import { SITE_URL } from '@/src/lib/site'
import { owner } from '@/src/content'
import MuteToggle from "@/src/components/shared/MuteToggle";
import ThemePicker from "@/src/components/shared/ThemePicker";
import PlainModeToggle from "@/src/components/shared/PlainModeToggle";
import AudioSetup from "@/src/components/shared/AudioSetup";
import KeycapFeedback from "@/src/components/shared/KeycapFeedback";
import WebMcpTools from "@/src/components/shared/WebMcpTools";
import TmuxBar from "@/src/components/layout/TmuxBar";
import CrtShader from "@/src/components/layout/CrtShader";
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Self-hosted from app/fonts (Latin subset, Fontsource 5.3.0): no layout shift,
// and no request to Google at build or run time.
// JetBrains Mono for everything; VT323 only for the hero name and boot banner.
const mono = localFont({ src: './fonts/JetBrainsMono-latin-wght.woff2', weight: '100 800', variable: '--font-jetbrains', display: 'swap' })
const display = localFont({ src: './fonts/VT323-latin-400.woff2', weight: '400', variable: '--font-vt323', display: 'swap' })

// Runs before first paint: apply the stored theme (or the default) so there is
// no flash of the wrong palette; restore the opt-in CRT look; mark returning
// visitors (html.booted hides the boot screen and plays the power-on); and
// hide section content SectionReveal will reveal (skipped under reduced motion).
const THEME_BG = Object.fromEntries(THEMES.map(t => [t.id, t.colors.bg]))
const BEFORE_PAINT = `try{var d=document.documentElement,b=${JSON.stringify(THEME_BG)},t=null;` +
    `try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}` +
    `if(!b[t])t=${JSON.stringify(DEFAULT_THEME)};d.dataset.theme=t;` +
    `var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',b[t]);` +
    `try{if(localStorage.getItem(${JSON.stringify(CRT_STORAGE_KEY)})==='on')d.dataset.crt='on';` +
    `if((${bootBehaviour.skipForReturningVisitors}&&localStorage.getItem(${JSON.stringify(BOOTED_KEY)})==='1')||(${bootBehaviour.oncePerTab}&&sessionStorage.getItem(${JSON.stringify(TAB_BOOTED_KEY)})==='1')||location.pathname!=='/')d.classList.add('booted');` +
    `if(localStorage.getItem(${JSON.stringify(PLAIN_STORAGE_KEY)})==='on')d.dataset.mode='plain'}catch(e){}` +
    `if(d.dataset.mode!=='plain'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('reveal-ready')}catch(e){}`

const baseUrl = SITE_URL
const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@kudzaiprichard'

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: { default: SITE_TITLE, template: `%s | ${owner.fullName}` },
    description: SITE_DESCRIPTION,
    applicationName: owner.fullName,
    category: 'technology',
    keywords: [
        'Kudzai Prichard Matizirofa',
        'Kudzai Prichard',
        'Kudzai Matizirofa',
        'Prichard Matizirofa',
        'Kudzai',
        'Matizirofa',
        'AI Engineer Zimbabwe',
        'AI / ML Engineer',
        'Machine Learning Engineer',
        'Computer Vision Engineer',
        'NLP Engineer',
        'MLOps',
        'Co-Founder Teleagents',
        'Co-Founder OurAfrica',
        'Teleagents',
        'OurAfrica',
        'Voice AI Africa',
        'Shona speech recognition',
        'Document AI',
        'LLM agents',
        'AWS',
        'Azure',
        'Python',
        'PyTorch',
        'FastAPI',
        'Spring Boot',
        'Next.js',
        'Whiteboard Studio',
        'whiteboard animation MCP',
        'Anvil DSA practice app',
        'offline LeetCode practice',
        'Sentinel face recognition',
        'IndabaX Zimbabwe 2026',
        'Tauri',
        'Rust',
        'University of Zimbabwe',
        'POTRAZ Innovation Expo 2026',
        'Portfolio',
    ],
    authors: [{ name: owner.fullName, url: baseUrl }],
    creator: owner.fullName,
    publisher: owner.fullName,
    alternates: {
        canonical: baseUrl,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: baseUrl,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        siteName: owner.fullName,
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: SITE_TITLE,
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        creator: twitterHandle,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
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
    // Browser UI colour for the default theme; themeStore updates it on switch
    themeColor: THEMES.find(t => t.id === DEFAULT_THEME)!.colors.bg,
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" data-theme={DEFAULT_THEME} className={`${mono.variable} ${display.variable}`} suppressHydrationWarning>
        <head>
            <meta charSet="UTF-8" />
            <link rel="icon" href="/favicon.ico" sizes="32x32" />
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
            <link rel="icon" href="/web-app-manifest-192x192.png" type="image/png" sizes="192x192" />
            <link rel="icon" href="/web-app-manifest-512x512.png" type="image/png" sizes="512x512" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
            <link rel="manifest" href="/site.webmanifest" />
            <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
        </head>
        <body suppressHydrationWarning>
        <BootProvider>
            {/* Skip-to-content link for keyboard users */}
            <a href="#main-content" className="skip-to-content">
                Skip to content
            </a>

            {/* Boot screen overlay */}
            <BootScreen />

            {/* Fixed background elements */}
            <Background />

            {/* Custom cursor */}
            <CustomCursor />

            {/* CRT tube shader (opt-in: `crt on`) */}
            <CrtShader />

            {/* Plain mode, theme and audio controls */}
            <PlainModeToggle />
            <ThemePicker />
            <MuteToggle />
            <AudioSetup />
            <KeycapFeedback />
            <WebMcpTools />

            {/* tmux-style page indicator */}
            <TmuxBar />

            {/* Scroll hint indicator */}
            <ScrollHint />

            {/* Main content */}
            {children}
        </BootProvider>
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}