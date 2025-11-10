// components/layout/FloatingCode.tsx
"use client"

import type { CodeSnippet } from '@/types'

const codeSnippets: CodeSnippet[] = [
    {
        id: 'snippet-1',
        text: "const AI = require('intelligence');",
        top: '15%',
        left: '10%',
        delay: 0,
    },
    {
        id: 'snippet-2',
        text: 'function buildFuture() { }',
        top: '25%',
        right: '12%',
        delay: 3,
    },
    {
        id: 'snippet-3',
        text: 'import neural_network as nn',
        bottom: '20%',
        left: '8%',
        delay: 6,
    },
    {
        id: 'snippet-4',
        text: 'async await innovation()',
        bottom: '15%',
        right: '15%',
        delay: 9,
    },
]

export default function FloatingCode() {
    return (
        <>
            {codeSnippets.map((snippet) => (
                <div
                    key={snippet.id}
                    className="code-snippet"
                    style={{
                        top: snippet.top,
                        left: snippet.left,
                        right: snippet.right,
                        bottom: snippet.bottom,
                        animationDelay: `${snippet.delay}s`,
                    }}
                >
                    {snippet.text}
                </div>
            ))}

            <style jsx>{`
        .code-snippet {
          position: fixed;
          color: rgba(0, 255, 65, 0.2);
          font-size: 14px;
          font-family: 'Courier New', monospace;
          pointer-events: none;
          opacity: 0;
          animation: floatCode 20s ease-in-out infinite;
          z-index: 5;
          white-space: nowrap;
        }

        @keyframes floatCode {
          0%,
          100% {
            opacity: 0;
            transform: translateY(0px);
          }
          10%,
          90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @media (max-width: 768px) {
          .code-snippet {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .code-snippet {
            display: none;
          }
        }
      `}</style>
        </>
    )
}