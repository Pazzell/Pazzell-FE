'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai/react'
import { userAtom } from '@/atom/user'
import { routes } from '@/app/_utils/routes'
import { UserData } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: ('gamer' | 'brand' | 'admin')[]
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  allowedUserTypes = ['gamer', 'brand', 'admin'],
  redirectTo = routes.LOGIN
}: ProtectedRouteProps) {
  const router = useRouter()
  const user: UserData | null = useAtomValue(userAtom)
  // The stored user only exists in the browser. Rendering the spinner until mount keeps
  // the first client render identical to the server's, which never has a user.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    // If no user is logged in, redirect to login
    if (!user) {
      router.push(redirectTo)
      return
    }

    // If user type is not allowed, redirect appropriately
    if (!allowedUserTypes.includes(user.userType
      )) {
      if (user.userType === 'gamer') {
        router.push(routes.USER.HOME)
      } else if (user.userType === 'brand') {
        router.push(routes.BRAND.DASHBOARD)
      } else if (user.userType === 'admin') {
        router.push(routes.ADMIN.DASHBOARD)
      }
      return
    }
  }, [mounted, user, router, allowedUserTypes, redirectTo])

  // Show loading or nothing while checking auth
  if (!mounted || !user || !allowedUserTypes.includes(user.userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}