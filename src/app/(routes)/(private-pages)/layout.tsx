import { ProtectedRoute } from '@/components/auth/protected-route'

export default function PrivatePagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}