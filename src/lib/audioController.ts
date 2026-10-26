// lib/audioController.ts
"use client"

type AudioEventCallback = () => void

class GlobalAudioController {
    private activeSection: string | null = null
    private listeners: Map<string, Set<AudioEventCallback>> = new Map()
    private releaseListeners = new Set<AudioEventCallback>()

    setActiveSection(sectionId: string) {
        if (this.activeSection === sectionId) return

        const previousSection = this.activeSection
        this.activeSection = sectionId

        // Notify previous section it lost control
        if (previousSection) {
            this.notifyListeners(previousSection)
        }

        // Notify new section it gained control
        this.notifyListeners(sectionId)
    }

    clearActiveSection(sectionId: string) {
        if (this.activeSection === sectionId) {
            this.activeSection = null
            this.notifyListeners(sectionId)
            // The channel is free: a section still on screen may claim it
            this.releaseListeners.forEach(callback => callback())
        }
    }

    /** Called whenever the keystroke channel becomes free. */
    onRelease(callback: AudioEventCallback): () => void {
        this.releaseListeners.add(callback)
        return () => this.releaseListeners.delete(callback)
    }

    hasControl(sectionId: string): boolean {
        return this.activeSection === sectionId
    }

    subscribe(sectionId: string, callback: AudioEventCallback) {
        if (!this.listeners.has(sectionId)) {
            this.listeners.set(sectionId, new Set())
        }
        this.listeners.get(sectionId)!.add(callback)
    }

    unsubscribe(sectionId: string, callback: AudioEventCallback) {
        this.listeners.get(sectionId)?.delete(callback)
    }

    private notifyListeners(sectionId: string) {
        this.listeners.get(sectionId)?.forEach(callback => callback())
    }
}

// Single global instance
export const audioController = new GlobalAudioController()