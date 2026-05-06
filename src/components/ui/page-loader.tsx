import { MainLayout } from '@/components/layout/main-layout'
import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  message?: string
  withLayout?: boolean
}

export function PageLoader({ 
  message = "Loading...", 
  withLayout = true 
}: PageLoaderProps) {
  const loaderContent = (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  )

  if (withLayout) {
    return (
      <MainLayout>
        {loaderContent}
      </MainLayout>
    )
  }

  return loaderContent
}