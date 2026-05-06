interface LogoIconProps {
  className?: string;
}

export const LogoIcon = ({ className = "w-10 h-10" }: LogoIconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <rect x="2" y="2" width="16" height="16" rx="4" fill="#00D9FF"/>
    <rect x="22" y="2" width="16" height="16" rx="4" fill="#FF6B9D"/>
    <rect x="2" y="22" width="16" height="16" rx="4" fill="#6C5CE7"/>
    <rect x="22" y="22" width="16" height="16" rx="4" fill="#00E676"/>
  </svg>
)