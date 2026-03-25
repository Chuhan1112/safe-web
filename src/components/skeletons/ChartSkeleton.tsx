export function ChartSkeleton() {
  return (
    <div className="w-full h-[400px] animate-pulse p-6 space-y-4">
      <div className="flex gap-4 h-full items-end pb-6">
        <div className="flex flex-col justify-between h-full py-2 gap-1 shrink-0">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-2 w-8 rounded bg-muted/30" />
          ))}
        </div>
        <div className="flex-1 h-full flex items-end gap-[2px]">
          {[40, 55, 45, 70, 60, 80, 65, 85, 72, 90, 78, 95, 82, 88, 76, 92, 85, 98, 88, 100].map(
            (height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t bg-primary/10"
                style={{ height: `${height}%` }}
              />
            ),
          )}
        </div>
      </div>
      <div className="flex justify-between pl-12">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-2 w-12 rounded bg-muted/20" />
        ))}
      </div>
    </div>
  )
}
