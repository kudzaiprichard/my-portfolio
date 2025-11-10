// components/sections/ContactSection.tsx
"use client"

import TerminalContainer from '@/components/shared/TerminalContainer'

export default function ContactSection() {
    return (
        <TerminalContainer title="developer@portfolio:~/contact$">
            <div className="command-line">
                <span className="prompt">$</span> ./send_message.sh
            </div>

            <div style={{ marginTop: '30px', color: '#00ff41' }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    📧 Contact Section - Coming Soon
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
                    This section will include:<br />
                    • Contact form (name, email, message)<br />
                    • Social media links (GitHub, LinkedIn, Twitter)<br />
                    • Email address and location<br />
                    • Download resume button<br />
                    • Form validation and submission<br />
                </p>
            </div>

            <style jsx>{`
        .command-line {
          color: #00ff41;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .prompt {
          color: rgba(0, 255, 65, 0.7);
        }
      `}</style>
        </TerminalContainer>
    )
}