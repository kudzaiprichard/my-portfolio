import {
    Html, Head, Body, Container, Section,
    Text, Hr, Font
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
                    <Section style={header}>
                        <Text style={dot}>● ● ●</Text>
                        <Text style={terminalTitle}>kudzai@portfolio:~/contact</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Text style={command}>$ ./message_received.sh</Text>
                        <Text style={output}>[  OK  ] Message queued successfully</Text>
                        <Text style={output}>[  OK  ] Sender identity confirmed</Text>
                        <Text style={output}>[  OK  ] Notification dispatched</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section>
                        <Text style={bodyText}>Hey {name},</Text>
                        <Text style={bodyText}>
                            Your message has been received. I&apos;ll get back to you as soon as possible.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Text style={label}>&gt; YOUR SUBMISSION</Text>
                        <Text style={metaLabel}>FROM</Text>
                        <Text style={metaValue}>{email}</Text>
                        <Text style={metaLabel}>MESSAGE</Text>
                        <Text style={metaValue}>{message}</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section>
                        <Text style={bodyText}>— Kudzai Prichard</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section>
                        <Text style={footer}>
                            // this is an automated response — do not reply to this email
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

const body = { backgroundColor: '#0a0f0a', fontFamily: "'Courier New', monospace", margin: '0', padding: '0' }
const container = { backgroundColor: '#0a0f0a', border: '1px solid rgba(0, 255, 65, 0.4)', maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { marginBottom: '16px' }
const dot = { color: 'rgba(0, 255, 65, 0.7)', fontSize: '10px', margin: '0 0 6px 0', letterSpacing: '4px' }
const terminalTitle = { color: 'rgba(0, 255, 65, 0.7)', fontSize: '12px', margin: '0' }
const divider = { borderColor: 'rgba(0, 255, 65, 0.2)', margin: '16px 0' }
const section = { padding: '8px 0' }
const command = { color: '#00ff41', fontSize: '13px', margin: '0 0 10px 0' }
const output = { color: 'rgba(0, 255, 65, 0.7)', fontSize: '12px', margin: '2px 0' }
const bodyText = { color: '#00ff41', fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.6' }
const label = { color: 'rgba(0, 255, 65, 0.7)', fontSize: '10px', margin: '12px 0 6px 0', letterSpacing: '0.5px' }
const metaLabel = { color: 'rgba(0, 255, 65, 0.5)', fontSize: '10px', margin: '8px 0 2px 0', letterSpacing: '0.5px' }
const metaValue = { color: '#00ff41', fontSize: '13px', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const footer = { color: 'rgba(0, 255, 65, 0.4)', fontSize: '10px', margin: '0' }