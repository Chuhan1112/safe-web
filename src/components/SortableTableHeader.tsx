// src/components/SortableTableHeader.tsx — 统一可排序表头，含 aria-sort 无障碍属性
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'

export type SortDirection = 'asc' | 'desc' | null

interface SortableTableHeaderProps {
  label: React.ReactNode
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
  const ariaSort = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none' as const

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none transition-colors',
        'text-2xs font-semibold uppercase tracking-wider text-muted-foreground',
        'hover:text-foreground/80',
        align === 'right' && 'text-right',
        isActive && 'text-foreground',
        className,
      )}
      onClick={() => onSort(sortKey)}
      aria-sort={ariaSort}
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
