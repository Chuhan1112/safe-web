import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(value: unknown, symbol: string): string {
  const num = Number(value)
  if (value == null || Number.isNaN(num) || num === 0 || !Number.isFinite(num)) {
    return '--'
  }
  return `${symbol}${num.toFixed(2)}`
}
