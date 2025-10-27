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
import { Eye, Car, Package, Calendar, Clock, DollarSign } from "lucide-react"
import type { VehicleSubscriptionRecord, VehicleRecord } from "@/lib/api"
import { useEffect, useMemo, useState } from "react"
import { getApiClient } from "@/lib/api"

interface VehicleSubscriptionDetailDialogProps {
  subscription: VehicleSubscriptionRecord
  trigger?: React.ReactNode
}

export function VehicleSubscriptionDetailDialog({ subscription, trigger }: VehicleSubscriptionDetailDialogProps) {
  const formatCurrency = (v: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString("vi-VN", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ACTIVE": return "bg-green-500"
      case "EXPIRED": return "bg-red-500"
      case "CANCELLED": return "bg-gray-500"
      default: return "bg-blue-500"
    }
  }

  const vehicle = typeof subscription.vehicleId === "object" ? subscription.vehicleId : null
  const packageInfo = typeof subscription.package_id === "object" ? subscription.package_id : null

  const [vehicleFull, setVehicleFull] = useState<VehicleRecord | null>(null)
  const vehicleId = useMemo(
    () => (typeof subscription.vehicleId === "string" ? subscription.vehicleId : subscription.vehicleId?._id),
    [subscription.vehicleId]
  )

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (!vehicleId) return
        // If we already have an image, no need to fetch
        if (vehicle && (vehicle as any).image) return
        const api = getApiClient()
        const data = await api.getVehicleById(vehicleId)
        if (mounted) setVehicleFull(data)
      } catch {}
    }
    load()
    return () => {
      mounted = false
    }
  }, [vehicleId])

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Chi tiết đăng ký dịch vụ</DialogTitle>
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status}
            </Badge>
          </div>
          <DialogDescription>
            Thông tin chi tiết về đăng ký gói bảo dưỡng xe
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Vehicle Information */}
          {vehicle && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Thông tin xe</h3>
              </div>
              {(vehicleFull?.image || (vehicle as any).image) && (
                <div className="mb-4">
                  <img
                    src={vehicleFull?.image || (vehicle as any).image}
                    alt={vehicle.vehicleName || "Vehicle"}
                    className="h-40 w-40 rounded object-cover border"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tên xe:</span>
                  <p className="font-medium">{vehicle.vehicleName || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <p className="font-medium">{vehicle.model || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">VIN:</span>
                  <p className="font-mono text-xs">{vehicle.VIN || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Package Information */}
          {packageInfo && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Gói dịch vụ</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Tên gói:</span>
                  <p className="font-semibold text-lg">{packageInfo.name || "—"}</p>
                </div>
                {packageInfo.description && (
                  <div>
                    <span className="text-muted-foreground text-sm">Mô tả:</span>
                    <p className="text-sm leading-relaxed mt-1">{packageInfo.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">Giá</span>
                      </div>
                      <p className="font-bold text-green-600">
                        {packageInfo.price ? formatCurrency(packageInfo.price) : "—"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-muted-foreground">Thời gian</span>
                      </div>
                      <p className="font-bold text-blue-600">
                        {packageInfo.duration ? `${packageInfo.duration} ngày` : "—"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-muted-foreground">KM</span>
                      </div>
                      <p className="font-bold text-orange-600">
                        {packageInfo.km_interval ? `${packageInfo.km_interval.toLocaleString()} km` : "—"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Period */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Thời gian đăng ký</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground text-sm">Ngày bắt đầu:</span>
                <p className="font-medium text-lg">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Ngày kết thúc:</span>
                <p className="font-medium text-lg">
                  {subscription.end_date ? formatDate(subscription.end_date) : "Không giới hạn"}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
            <div>
              <span className="font-medium">Tạo lúc:</span>{" "}
              {new Date(subscription.createdAt).toLocaleString("vi-VN")}
            </div>
            <div>
              <span className="font-medium">Cập nhật:</span>{" "}
              {new Date(subscription.updatedAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
