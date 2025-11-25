import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format số tiền theo đơn vị VNĐ
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Format số với dấu phân cách hàng nghìn
export function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Vehicle warranty helpers
export interface VehicleWarrantyStatus {
  isUnderWarranty: boolean
  daysRemaining: number | null
  startDate: Date | null
  endDate: Date | null
}

export function getVehicleWarrantyStatus(
  warrantyStartTime: string | null | undefined,
  warrantyEndTime: string | null | undefined
): VehicleWarrantyStatus {
  if (!warrantyStartTime || !warrantyEndTime) {
    return {
      isUnderWarranty: false,
      daysRemaining: null,
      startDate: null,
      endDate: null
    }
  }

  const now = new Date()
  const startDate = new Date(warrantyStartTime)
  const endDate = new Date(warrantyEndTime)
  
  const isUnderWarranty = now >= startDate && now <= endDate
  const daysRemaining = isUnderWarranty 
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    isUnderWarranty,
    daysRemaining,
    startDate,
    endDate
  }
}

export function calculateWarrantyEndDate(startDate: Date | string, daysToAdd: number = 180): Date {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + daysToAdd)
  return endDate
}

