// components/shared/reveal/TypedLine.tsx
// A command line that SectionReveal types out. Server-renderable: the full
// text is in the HTML, so crawlers, screen readers and no-JS visitors get it.

import type { sequenceTimings } from '@/src/constants/typingConfig'

interface TypedLineProps {
    text: string
    /** Wrapper classes (e.g. "hero-section-command-line hero-section-fade-in"). */
    className?: string
    /** Prompt shown before the text, e.g. "$ ". Omit for bare lines. */
    prompt?: string
    promptClassName?: string
    /** Caret element classes. */
    caretClassName?: string
    caretChar?: string
    /** 'typing' shows the caret only while typing; 'always' keeps it afterwards. */
    caret?: 'typing' | 'always'
    /** Pause before this line: a sequenceTimings key (or "0"). Defaults come from typingConfig. */
    delay?: keyof typeof sequenceTimings | '0'
}

export default function TypedLine({
    text,
    className,
    prompt,
    promptClassName,
    caretClassName = 'section-cursor-blink',
    caretChar = '|',
    caret = 'typing',
    delay,
}: TypedLineProps) {
    return (
        <div className={className} data-reveal="type" data-delay={delay} data-caret={caret}>
            {prompt && <span className={promptClassName}>{prompt}</span>}
            <span data-type-full="">{text}</span>
            <span data-type-live="" aria-hidden="true" />
            <span className={caretClassName} data-type-caret="" aria-hidden="true">{caretChar}</span>
        </div>
    )
}
