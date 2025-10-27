"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import type { ServicePackageRecord } from "@/lib/api"

interface ServicePackageDetailDialogProps {
  servicePackage: ServicePackageRecord
  trigger?: React.ReactNode
}

export function ServicePackageDetailDialog({ servicePackage, trigger }: ServicePackageDetailDialogProps) {
  const formatCurrency = (v: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{servicePackage.name}</DialogTitle>
          <DialogDescription>Chi tiết gói dịch vụ</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Mô tả</h3>
            <p className="text-sm leading-relaxed">{servicePackage.description}</p>
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Giá tiền</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(servicePackage.price)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Thời gian thực hiện</div>
                <div className="text-2xl font-bold">
                  {servicePackage.duration} <span className="text-base font-normal">ngày</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intervals */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Khoảng cách bảo dưỡng</div>
                <div className="text-2xl font-bold text-orange-600">
                  {servicePackage.km_interval.toLocaleString()} <span className="text-base font-normal">km</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Chu kỳ bảo dưỡng</div>
                <div className="text-2xl font-bold text-blue-600">
                  {servicePackage.service_interval_days} <span className="text-base font-normal">ngày</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <div>
              <span className="font-medium">Tạo lúc:</span>{" "}
              {new Date(servicePackage.createdAt).toLocaleString("vi-VN")}
            </div>
            <div>
              <span className="font-medium">Cập nhật:</span>{" "}
              {new Date(servicePackage.updatedAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
