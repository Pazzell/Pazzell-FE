import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface PageErrorProps {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
  withLayout?: boolean
}

export function PageError({ 
  title = "Something went wrong",
  message = "Please try again later",
  showRetry = true,
  onRetry,
  withLayout = true 
}: PageErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const errorContent = (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4 font-fredoka">{title}</h2>
        <p className="text-white/70 mb-6">{message}</p>
        {showRetry && (
          <Button 
            onClick={handleRetry}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-6 py-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )

  if (withLayout) {
    return (
      <MainLayout>
        {errorContent}
      </MainLayout>
    )
  }

  return errorContent
}