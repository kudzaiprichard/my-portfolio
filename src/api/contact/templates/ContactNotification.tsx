import {
    Html, Head, Body, Container, Section,
    Text, Hr, Font
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
                    <Section style={header}>
                        <Text style={dot}>● ● ●</Text>
                        <Text style={terminalTitle}>kudzai@portfolio:~/contact</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Text style={command}>$ cat new_message.log</Text>
                        <Text style={label}>&gt; SENDER</Text>
                        <Text style={value}>{name}</Text>
                        <Text style={label}>&gt; EMAIL</Text>
                        <Text style={value}>{email}</Text>
                        <Text style={label}>&gt; MESSAGE</Text>
                        <Text style={value}>{message}</Text>
                    </Section>

                    <Hr style={divider} />

                    <Section>
                        <Text style={footer}>
                            // message received via prichard.co.zw/contact
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

const body = {
    backgroundColor: '#0a0f0a',
    fontFamily: "'Courier New', monospace",
    margin: '0',
    padding: '0',
}

const container = {
    backgroundColor: '#0a0f0a',
    border: '1px solid rgba(0, 255, 65, 0.4)',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
}

const header = {
    marginBottom: '16px',
}

const dot = {
    color: 'rgba(0, 255, 65, 0.7)',
    fontSize: '10px',
    margin: '0 0 6px 0',
    letterSpacing: '4px',
}

const terminalTitle = {
    color: 'rgba(0, 255, 65, 0.7)',
    fontSize: '12px',
    margin: '0',
}

const divider = {
    borderColor: 'rgba(0, 255, 65, 0.2)',
    margin: '16px 0',
}

const section = {
    padding: '8px 0',
}

const command = {
    color: '#00ff41',
    fontSize: '13px',
    margin: '0 0 16px 0',
}

const label = {
    color: 'rgba(0, 255, 65, 0.7)',
    fontSize: '10px',
    margin: '12px 0 2px 0',
    letterSpacing: '0.5px',
}

const value = {
    color: '#00ff41',
    fontSize: '13px',
    margin: '0',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
}

const footer = {
    color: 'rgba(0, 255, 65, 0.4)',
    fontSize: '10px',
    margin: '0',
}