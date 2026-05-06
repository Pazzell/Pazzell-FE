import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ButtonProps } from '@/components/ui/button'

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline'
  children: React.ReactNode
}

export function GradientButton({ 
  variant = 'primary', 
  className,
  children,
  ...props 
}: GradientButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 font-fredoka'
      
      case 'secondary':
        return 'bg-gradient-to-r from-[#00D9FF] to-[#00E676] text-secondary-foreground font-semibold rounded-full hover:shadow-lg transition-all duration-300 font-fredoka'
      
      case 'outline':
        return 'border-2 bg-transparent border-secondary text-white hover:bg-secondary hover:text-secondary-foreground font-semibold rounded-full transition-all duration-300 font-fredoka'
      
      default:
        return 'bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 font-fredoka'
    }
  }

  return (
    <Button 
      className={cn(getVariantClasses(), className)}
      {...props}
    >
      {children}
    </Button>
  )
}