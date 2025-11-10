// components/sections/ExperienceSection.tsx
"use client"

import TerminalContainer from '@/components/shared/TerminalContainer'

export default function ExperienceSection() {
    return (
        <TerminalContainer title="developer@portfolio:~/experience$">
            <div className="command-line">
                <span className="prompt">$</span> cat work_history.txt
            </div>

            <div style={{ marginTop: '30px', color: '#00ff41' }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    💼 Experience Section - Coming Soon
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
                    This section will display your work timeline with:<br />
                    • Company names and positions<br />
                    • Employment dates and duration<br />
                    • Key responsibilities and achievements<br />
                    • Technologies used in each role<br />
                    • Education history<br />
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