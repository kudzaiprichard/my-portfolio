"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface BootContextType {
    isBooted: boolean
    /** A returning visitor: the boot was skipped and sections print instantly. */
    isReturning: boolean
    completeBoot: (options?: { returning?: boolean }) => void
}

const BootContext = createContext<BootContextType>({
    isBooted: false,
    isReturning: false,
    completeBoot: () => {},
})

export function BootProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState({ isBooted: false, isReturning: false })

    const completeBoot = (options?: { returning?: boolean }) => {
        setState({ isBooted: true, isReturning: !!options?.returning })
    }

    return (
        <BootContext.Provider value={{ ...state, completeBoot }}>
            {children}
        </BootContext.Provider>
    )
}

export function useBootContext() {
    return useContext(BootContext)
}
