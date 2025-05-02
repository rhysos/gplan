"use client"
import { createContext, useContext, type ReactNode } from "react"

interface CloudinaryContextType {
  cloudName: string | null
}

const CloudinaryContext = createContext<CloudinaryContextType>({
  cloudName: null,
})

export function CloudinaryProvider({
  children,
  cloudName,
}: {
  children: ReactNode
  cloudName: string | null
}) {
  return <CloudinaryContext.Provider value={{ cloudName }}>{children}</CloudinaryContext.Provider>
}

export function useCloudinary() {
  return useContext(CloudinaryContext)
}
