import {
    Html, Head, Body, Container, Section,
    Text, Hr, Link, Font
} from '@react-email/components'

interface Props {
    name: string
    email: string
    message: string
}

export default function ContactNotification({ name, email, message }: Props) {
    return (
        <Html>
            <Head>
                <Font
                    fontFamily="Courier New"
                    fallbackFontFamily="monospace"
                    webFont={undefined}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Body style={body}>
                <Container style={container}>
                    {/* Top bar */}
                    <Section style={topbar}>
                        <Text style={dots}>
                            <span style={dotRed}>●</span>&nbsp;
                            <span style={dotYellow}>●</span>&nbsp;
                            <span style={dotGreen}>●</span>
                        </Text>
                        <Text style={topbarTitle}>new contact message</Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Text style={statusText}>
                            New message received via{' '}
                            <Link href="https://prichard.co.zw" style={statusLink}>prichard.co.zw</Link>
                        </Text>

                        {/* Message box */}
                        <Section style={msgBox}>
                            <Text style={msgLabel}>NAME</Text>
                            <Text style={msgValue}>{name}</Text>
                            <Text style={msgLabel}>EMAIL</Text>
                            <Text style={msgValue}>
                                <Link href={`mailto:${email}`} style={greenLink}>{email}</Link>
                            </Text>
                            <Text style={msgLabel}>MESSAGE</Text>
                            <Text style={msgValue}>{message}</Text>
                        </Section>

                        <Section style={replyHint}>
                            <Link href={`mailto:${email}`} style={replyBtn}>
                                Reply to {name}
                            </Link>
                        </Section>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Message received via{' '}
                            <Link href="https://prichard.co.zw/contact" style={footerLink}>prichard.co.zw/contact</Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

const body = {
    backgroundColor: '#f4f4f4',
    fontFamily: "'Courier New', monospace",
    margin: '0',
    padding: '40px 20px',
}

const container = {
    backgroundColor: '#111111',
    maxWidth: '700px',
    margin: '0 auto',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    borderRadius: '8px',
    overflow: 'hidden' as const,
}

const topbar = {
    backgroundColor: '#161616',
    padding: '10px 24px',
    borderBottom: '1px solid rgba(52, 211, 153, 0.12)',
}

const dots = {
    fontSize: '10px',
    margin: '0 0 4px 0',
    letterSpacing: '2px',
}

const dotRed = { color: '#ff5f57' }
const dotYellow = { color: '#febc2e' }
const dotGreen = { color: '#28c840' }

const topbarTitle = {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: '11px',
    margin: '0',
    letterSpacing: '1px',
}

const content = {
    padding: '22px 28px',
}

const statusText = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 8px',
}

const statusLink = {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecoration: 'none',
}

const msgBox = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '16px',
    margin: '0 0 18px',
}

const msgLabel = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: '1.5px',
    margin: '10px 0 4px',
    textTransform: 'uppercase' as const,
}

const msgValue = {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.75)',
    margin: '0',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap' as const,
}

const replyHint = {
    textAlign: 'center' as const,
}

const replyBtn = {
    display: 'inline-block' as const,
    border: '1px solid rgba(52, 211, 153, 0.4)',
    padding: '12px 32px',
    fontSize: '12px',
    color: '#34d399',
    letterSpacing: '1.5px',
    fontFamily: "'Courier New', monospace",
    textDecoration: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    fontWeight: 'bold' as const,
}

const greenLink = {
    color: '#34d399',
    textDecoration: 'none',
}

const footer = {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '14px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center' as const,
}

const footerText = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.2)',
    margin: '0',
    lineHeight: '1.6',
}

const footerLink = {
    color: 'rgba(255, 255, 255, 0.2)',
    textDecoration: 'none',
}