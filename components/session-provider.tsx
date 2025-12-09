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
    checkSession()
    
    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setHasSession(true)
        // Força um reload da página para garantir que o middleware processe a nova sessão
        window.location.reload()
      } else if (event === 'SIGNED_OUT') {
        setHasSession(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const checkSession = async () => {
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

  const refetchSession = async () => {
    setIsLoading(true)
    await checkSession()
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
