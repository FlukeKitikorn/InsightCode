import { createContext, useContext, useState} from "react"
import type { ReactNode } from "react"

interface LoadingContextType {
  loading: boolean
  setLoading: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) throw new Error("useLoading must be used inside LoadingProvider")
  return context
}