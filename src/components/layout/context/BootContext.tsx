"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface BootContextType {
    isBooted: boolean
    completeBoot: () => void
}

const BootContext = createContext<BootContextType>({
    isBooted: false,
    completeBoot: () => {},
})

export function BootProvider({ children }: { children: ReactNode }) {
    const [isBooted, setIsBooted] = useState(false)

    const completeBoot = useCallback(() => {
        setIsBooted(true)
    }, [])

    return (
        <BootContext.Provider value={{ isBooted, completeBoot }}>
            {children}
        </BootContext.Provider>
    )
}

export function useBootContext() {
    return useContext(BootContext)
}