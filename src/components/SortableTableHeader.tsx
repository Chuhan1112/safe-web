// src/components/SortableTableHeader.tsx
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'

export type SortDirection = 'asc' | 'desc' | null

interface SortableTableHeaderProps {
  label: string
  sortKey: string
  currentSort: { key: string; direction: SortDirection }
  onSort: (key: string) => void
  className?: string
  align?: 'left' | 'right'
}

export const SortableTableHeader = ({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
  align = 'left',
}: SortableTableHeaderProps) => {
  const isActive = currentSort.key === sortKey
  const direction = isActive ? currentSort.direction : null

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:text-foreground/80 transition-colors',
        align === 'right' && 'text-right',
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : direction === 'desc' ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </TableHead>
  )
}
