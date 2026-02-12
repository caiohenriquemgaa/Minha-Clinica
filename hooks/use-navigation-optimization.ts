'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useNavigationOptimization() {
  const router = useRouter()

  useEffect(() => {
    // Prefetch comum routes
    const commonRoutes = ['/dashboard', '/patients', '/calendar', '/procedures', '/professionals']
    
    commonRoutes.forEach(route => {
      // Prefetch routes para melhorar performance
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      document.head.appendChild(link)
    })
  }, [])

  return router
}
