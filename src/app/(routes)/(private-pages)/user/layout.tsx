'use client'

import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAtomValue(userAtom)
  const router = useRouter()

  useEffect(() => {
    if (user && user.userType !== 'gamer') {
      router.push('/brand/dashboard')
    }
  }, [user, router])

  return <div>{children}</div>
}