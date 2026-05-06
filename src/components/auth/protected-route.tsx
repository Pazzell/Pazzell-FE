'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai/react'
import { userAtom } from '@/atom/user'
import { routes } from '@/app/_utils/routes'
import { UserData } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: ('gamer' | 'brand')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedUserTypes = ['gamer', 'brand'],
  redirectTo = routes.LOGIN 
}: ProtectedRouteProps) {
  const router = useRouter()
  const user: UserData | null = useAtomValue(userAtom)

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!user) {
      router.push(redirectTo)
      return
    }

    // If user type is not allowed, redirect appropriately
    if (!allowedUserTypes.includes(user.userType
      )) {
      if (user.userType === 'gamer') {
        router.push(routes.USER.DASHBOARD)
      } else if (user.userType === 'brand') {
        router.push(routes.BRAND.DASHBOARD)
      }
      return
    }
  }, [user, router, allowedUserTypes, redirectTo])

  // Show loading or nothing while checking auth
  if (!user || !allowedUserTypes.includes(user.userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}