'use client'

import React, { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import PrivateLayoutHeader from './header'
import { useUserStore } from '@/store/user-store'
import { clearSessionOnAuthError, getCurrentUserDetails } from '@/services/users'

const PrivateLayout = ({children}: {children: React.ReactNode}) => {
  const user = useUserStore((state) => state.user)
  const isLoading = useUserStore((state) => state.isLoading)
  const setUser = useUserStore((state) => state.setUser)
  const setLoading = useUserStore((state) => state.setLoading)
  const clearUser = useUserStore((state) => state.clearUser)

  useEffect(() => {
    if (user) return

    let cancelled = false

    async function loadCurrentUser() {
      setLoading(true)
      try {
        const currentUser = await getCurrentUserDetails()
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        if (cancelled) return
        await clearSessionOnAuthError()
        clearUser()
        window.location.replace('/login')
      }
    }

    loadCurrentUser()

    return () => {
      cancelled = true
    }
  }, [user, setUser, setLoading, clearUser])

  if (isLoading || !user) {
    return (
      <div className='flex min-h-full items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='flex flex-col min-h-full'>
        <PrivateLayoutHeader user={user} />
        <main className='flex-1 p-5 max-w-6xl mx-auto'>
            {children}
        </main>
    </div>
  )
}

export default PrivateLayout
