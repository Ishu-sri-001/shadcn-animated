"use client"

import { createContext, useContext, type ReactNode } from "react"

const ApiReferenceContext = createContext(true)

export function ApiReferenceProvider({
  showApiReference = true,
  children,
}: {
  /** Set false to hide API references on every component route. */
  showApiReference?: boolean
  children: ReactNode
}) {
  return (
    <ApiReferenceContext.Provider value={showApiReference}>
      {children}
    </ApiReferenceContext.Provider>
  )
}

export function ApiReferenceVisibility({ children }: { children: ReactNode }) {
  const showApiReference = useContext(ApiReferenceContext)
  return showApiReference ? children : null
}
