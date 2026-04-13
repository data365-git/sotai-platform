import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  height?: number | string
  width?: number | string
}

export function LoadingSkeleton({ className, height = 16, width = '100%' }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('shimmer rounded-md', className)}
      style={{ height, width }}
    />
  )
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 6, cols = 5 }: SkeletonTableProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 16,
            padding: '14px 20px',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="shimmer"
              style={{
                height: 14,
                borderRadius: 6,
                width: j === 0 ? '80%' : j === cols - 1 ? '40%' : '65%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
