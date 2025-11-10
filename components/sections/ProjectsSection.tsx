// components/sections/ProjectsSection.tsx
"use client"

import TerminalContainer from '@/components/shared/TerminalContainer'

export default function ProjectsSection() {
    return (
        <TerminalContainer title="developer@portfolio:~/projects$">
            <div className="command-line">
                <span className="prompt">$</span> ls -la ./projects/
            </div>

            <div style={{ marginTop: '30px', color: '#00ff41' }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    📂 Projects Section - Coming Soon
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
                    This section will showcase your portfolio projects with:<br />
                    • Project cards with descriptions<br />
                    • Technologies used<br />
                    • Live demo and GitHub links<br />
                    • Featured projects highlight<br />
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