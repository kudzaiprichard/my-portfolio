// content/projects.ts

export interface Project {
    id: string
    name: string
    status?: 'LIVE' | 'BETA' | 'WIP'
    description: string
    technologies: string[]
    githubUrl: string
    liveUrl?: string
}

export const projects: Project[] = [
    {
        id: '1',
        name: 'AI ChatBot Platform',
        status: 'LIVE',
        description: 'Enterprise conversational AI platform powered by GPT-4. Features context-aware responses, multi-language support, and custom training capabilities for enterprise clients. Handles complex queries with natural language processing.',
        technologies: ['Python', 'FastAPI', 'OpenAI', 'PostgreSQL'],
        githubUrl: 'https://github.com/yourusername/ai-chatbot',
        liveUrl: 'https://demo.com',
    },
    {
        id: '2',
        name: 'ML Image Classifier',
        status: 'LIVE',
        description: 'Deep learning model for image classification with 96% accuracy. Built with transfer learning using ResNet50 and deployed with real-time inference API. Processes thousands of images per minute with high precision.',
        technologies: ['TensorFlow', 'Flask', 'Docker', 'AWS'],
        githubUrl: 'https://github.com/yourusername/ml-classifier',
        liveUrl: 'https://demo.com',
    },
    {
        id: '3',
        name: 'E-Commerce Dashboard',
        status: 'LIVE',
        description: 'Full-stack admin dashboard for e-commerce platforms. Features real-time analytics, inventory management, and automated reporting with beautiful data visualizations. Supports multiple stores and currencies.',
        technologies: ['Next.js', 'Node.js', 'MongoDB'],
        githubUrl: 'https://github.com/yourusername/dashboard',
        liveUrl: 'https://demo.com',
    },
    {
        id: '4',
        name: 'Real-Time Chat App',
        status: 'BETA',
        description: 'WebSocket-based real-time messaging application with end-to-end encryption. Supports group chats, file sharing, and message history with Redis caching for optimal performance.',
        technologies: ['React', 'Socket.io', 'Redis'],
        githubUrl: 'https://github.com/yourusername/chat',
    },
    {
        id: '5',
        name: 'Task Automation Bot',
        status: 'LIVE',
        description: 'Python automation bot for repetitive tasks. Integrates with Slack, Email, and Calendar APIs. Saves average of 10+ hours per week through intelligent scheduling and notifications.',
        technologies: ['Python', 'Celery', 'RabbitMQ'],
        githubUrl: 'https://github.com/yourusername/bot',
    },
]
