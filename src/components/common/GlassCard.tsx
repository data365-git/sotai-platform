import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: string
}

export function GlassCard({ children, className, onClick, padding = 'p-4' }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border shadow-xl shadow-black/20',
        'bg-[#f1f5f9] border-black/[0.07]',
        onClick && 'cursor-pointer hover:bg-[#e2e8f0] hover:border-black/[0.12] transition-all duration-150',
        padding,
        className
      )}
    >
      {children}
    </div>
  )
}
