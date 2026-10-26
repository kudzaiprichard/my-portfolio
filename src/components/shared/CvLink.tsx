// components/shared/CvLink.tsx
"use client"

// `[ download CV ]` on the first screen, in both the terminal and plain modes.

import { contact } from '@/src/content'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'

export default function CvLink({ className }: { className?: string }) {
    return (
        <a
            href={contact.resumeUrl}
            download
            className={`keycap ${className ?? ''}`}
            onClick={() => trackEvent(ANALYTICS_EVENTS.cvDownloaded, { source: 'hero' })}
        >
            [ download CV ]
        </a>
    )
}
