import {
    Html, Head, Body, Container, Section,
    Text, Hr, Link, Font
} from '@react-email/components'

interface Props {
    name: string
    email: string
    message: string
}

export default function ContactConfirmation({ name, email, message }: Props) {
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
                        <Text style={topbarTitle}>
                            <Link href="https://prichard.co.zw" style={topbarLink}>prichard.co.zw</Link>
                        </Text>
                    </Section>

                    {/* Brand */}
                    <Section style={brand}>
                        <Text style={brandName}>KUDZAI PRICHARD</Text>
                        <Text style={brandTag}>Software Developer</Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Text style={greeting}>Hey {name},</Text>
                        <Text style={bodyText}>
                            Thank you for reaching out. Your message has been received and
                            I&apos;ll review it shortly. I typically respond within 24–48 hours.
                        </Text>

                        {/* Message box */}
                        <Section style={msgBox}>
                            <Text style={msgBoxTitle}>Your Submission</Text>
                            <Text style={msgLabel}>FROM</Text>
                            <Text style={msgValue}>
                                <Link href={`mailto:${email}`} style={greenLink}>{email}</Link>
                            </Text>
                            <Text style={msgLabel}>MESSAGE</Text>
                            <Text style={msgValue}>{message}</Text>
                        </Section>

                        {/* Signature */}
                        <Hr style={sigDivider} />
                        <Text style={sigName}>Kudzai Prichard</Text>
                        <Text style={sigTitle}>Software Developer</Text>
                        <Text style={sigLink}>
                            <Link href="https://prichard.co.zw" style={greenLink}>prichard.co.zw</Link>
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            This is an automated confirmation — please do not reply to this email.
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

const topbarLink = {
    color: 'rgba(255, 255, 255, 0.35)',
    textDecoration: 'none',
}

const brand = {
    padding: '24px 24px 18px',
    textAlign: 'center' as const,
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
}

const brandName = {
    fontSize: '20px',
    color: '#e4e4e4',
    letterSpacing: '4px',
    margin: '0 0 6px',
    fontWeight: 'bold' as const,
}

const brandTag = {
    fontSize: '11px',
    color: '#34d399',
    margin: '0',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
}

const content = {
    padding: '22px 28px',
}

const greeting = {
    fontSize: '14px',
    color: '#e4e4e4',
    margin: '0 0 12px',
    lineHeight: '1.6',
}

const bodyText = {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.55)',
    margin: '0 0 16px',
    lineHeight: '1.7',
}

const msgBox = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '16px',
    margin: '18px 0',
}

const msgBoxTitle = {
    fontSize: '10px',
    color: '#34d399',
    letterSpacing: '2px',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold' as const,
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

const sigDivider = {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    margin: '18px 0 16px',
}

const sigName = {
    fontSize: '14px',
    color: '#e4e4e4',
    margin: '0 0 4px',
}

const sigTitle = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)',
    margin: '0 0 3px',
}

const sigLink = {
    fontSize: '11px',
    margin: '0',
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