// components/shared/TerminalContainer.tsx
"use client"

import type { TerminalContainerProps } from '@/types'

export default function TerminalContainer({
                                              title = 'developer@portfolio:~$',
                                              children,
                                              className = '',
                                          }: TerminalContainerProps) {
    return (
        <div className={`terminal-container ${className}`}>
            <div className="terminal-header">
                <div className="terminal-dot" />
                <div className="terminal-dot" />
                <div className="terminal-dot" />
                <span className="terminal-title">{title}</span>
            </div>

            <div className="terminal-content">
                {children}
            </div>

            <style jsx>{`
        .terminal-content {
          width: 100%;
        }
      `}</style>
        </div>
    )
}