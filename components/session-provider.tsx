'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

interface SessionContextType {
  isLoading: boolean
  hasSession: boolean
  refetchSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (isMounted) {
          setHasSession(!!session)
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        if (isMounted) {
          setHasSession(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (event === 'SIGNED_IN') {
          setHasSession(true)
        } else if (event === 'SIGNED_OUT') {
          setHasSession(false)
        }
      }
    })

    initializeSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  const refetchSession = async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setHasSession(!!session)
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      setHasSession(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SessionContext.Provider value={{ isLoading, hasSession, refetchSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider')
  }
  return context
}
