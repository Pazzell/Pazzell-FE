import { ReactNode } from 'react'
import { Header } from './header'
import { Footer } from './footer'

interface MainLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  className?: string
  userType?: 'user' | 'brand' | null
  includeFooter?: boolean
}

export function MainLayout({ 
  children, 
  maxWidth = '6xl', 
  className = '',
  includeFooter = true
}: MainLayoutProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header/>
      
      <main className={`flex-1 pt-32 pb-12 px-[5%] ${className}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
          {children}
        </div>
      </main>

      {includeFooter && <Footer />}
    </div>
  )
}