interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 8, cols = 6 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-3 px-4 py-3 border-b border-border/50">
        {[...Array(cols)].map((_, index) => (
          <div
            key={index}
            className="h-3 rounded bg-muted/40"
            style={{ flex: index === 0 ? '0 0 80px' : 1 }}
          />
        ))}
      </div>
      {[...Array(rows)].map((_, row) => (
        <div key={row} className="flex gap-3 px-4 py-2.5 border-b border-border/30">
          {[...Array(cols)].map((_, col) => (
            <div
              key={col}
              className="h-3 rounded bg-muted/20"
              style={{
                flex: col === 0 ? '0 0 80px' : 1,
                opacity: 1 - row * 0.08,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
