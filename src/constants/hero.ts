// constants/hero.ts

/**
 * Hero Section Content Configuration
 * Centralized content for the landing page
 */

export const heroContent = {
    // Personal Information
    name: 'kudzai prichard',
    role: 'AI & Full Stack Developer',

    // Description lines
    description: [
        'Building intelligent systems and scalable applications.',
        'Specializing in AI/ML, backend architecture, and modern web technologies.',
        'Transforming complex problems into elegant solutions.',
    ],

    // Terminal Commands
    commands: {
        whoami: 'whoami',
        showRole: 'cat role.txt',
        showDescription: 'cat description.txt',
    },

    // Call-to-Action Buttons (currently disabled)
    // cta: {
    //     primary: {
    //         label: './view_projects.sh',
    //         action: 'scroll-to-projects',
    //         ariaLabel: 'View my projects',
    //     },
    //     secondary: {
    //         label: './contact_me.sh',
    //         action: 'scroll-to-contact',
    //         ariaLabel: 'Contact me',
    //     },
    // },

    // Terminal Title
    terminalTitle: 'developer@portfolio:~$',
}

/**
 * Animation Timing Configuration
 * All timings in milliseconds
 */
export const heroAnimationTiming = {
    // Initial delays
    initialDelay: 100,

    // Stage 1: whoami command
    whoamiCommandDelay: 100,
    whoamiOutputDelay: 200,

    // Stage 2: name display
    nameDisplayDuration: 1400,
    nameCursorBlinkSpeed: 1000,

    // Stage 3: role command
    roleCommandDelay: 0,
    roleTypingSpeed: 80,
    roleTypingDelay: 200,

    // Stage 4: description command
    descriptionCommandDelay: 300,
    descriptionFadeInDelay: 200,

    // Stage 5: buttons
    buttonsFadeInDelay: 200,

    // Transition speeds
    fadeInDuration: 600,
    cursorBlinkDuration: 700,
}

/**
 * Styling Configuration
 */
export const heroStyles = {
    nameFontSize: {
        desktop: 48,
        tablet: 32,
        mobile: 28,
    },

    roleFontSize: {
        desktop: 20,
        tablet: 18,
        mobile: 16,
    },

    descriptionFontSize: {
        desktop: 16,
        tablet: 14,
        mobile: 14,
    },

    nameCursorHeight: {
        desktop: 48,
        tablet: 32,
        mobile: 28,
    },
}

/**
 * Social Links — sourced from env variables
 */
export const socialLinks = {
    github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/kudzaiprichard',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/kudzaiprichard',
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/kudzaiprichard',
    email: `mailto:${process.env.NEXT_PUBLIC_EMAIL || 'kudzai@example.com'}`,
}

/**
 * Helper function to get description as a single string
 */
export const getDescriptionText = (): string => {
    return heroContent.description.join('\n')
}

/**
 * Helper function to get description lines array
 */
export const getDescriptionLines = (): string[] => {
    return heroContent.description
}

/**
 * Calculate total animation duration
 */
export const getTotalAnimationDuration = (): number => {
    const {
        initialDelay,
        whoamiCommandDelay,
        whoamiOutputDelay,
        nameDisplayDuration,
        roleTypingSpeed,
        descriptionCommandDelay,
        descriptionFadeInDelay,
        buttonsFadeInDelay,
    } = heroAnimationTiming

    const roleLength = heroContent.role.length
    const roleTypingDuration = roleLength * roleTypingSpeed

    return (
        initialDelay +
        whoamiCommandDelay +
        whoamiOutputDelay +
        nameDisplayDuration +
        roleTypingDuration +
        descriptionCommandDelay +
        descriptionFadeInDelay +
        buttonsFadeInDelay
    )
}

/**
 * Animation stage timings (cumulative)
 */
export const animationStages = {
    showWhoamiCommand: heroAnimationTiming.initialDelay,

    showName:
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay,

    showRoleCommand:
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay +
        heroAnimationTiming.nameDisplayDuration,

    startRoleTyping:
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay +
        heroAnimationTiming.nameDisplayDuration +
        heroAnimationTiming.roleTypingDelay,

    showDescriptionCommand: (roleTypingDuration: number): number =>
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay +
        heroAnimationTiming.nameDisplayDuration +
        roleTypingDuration +
        heroAnimationTiming.descriptionCommandDelay,

    showDescription: (roleTypingDuration: number): number =>
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay +
        heroAnimationTiming.nameDisplayDuration +
        roleTypingDuration +
        heroAnimationTiming.descriptionCommandDelay +
        heroAnimationTiming.descriptionFadeInDelay,

    showButtons: (roleTypingDuration: number): number =>
        heroAnimationTiming.initialDelay +
        heroAnimationTiming.whoamiCommandDelay +
        heroAnimationTiming.whoamiOutputDelay +
        heroAnimationTiming.nameDisplayDuration +
        roleTypingDuration +
        heroAnimationTiming.descriptionCommandDelay +
        heroAnimationTiming.descriptionFadeInDelay +
        heroAnimationTiming.buttonsFadeInDelay,
}

/**
 * Accessibility labels
 */
export const a11yLabels = {
    heroSection: 'Hero section - Introduction',
    nameHeading: 'Developer name',
    roleHeading: 'Professional role',
    descriptionText: 'Professional description',
    ctaButtonsGroup: 'Call to action buttons',
}