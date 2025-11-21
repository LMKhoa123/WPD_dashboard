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
import { formatVND, formatDateTime, formatNumber } from "@/lib/utils"

interface ServicePackageDetailDialogProps {
  servicePackage: ServicePackageRecord
  trigger?: React.ReactNode
}

export function ServicePackageDetailDialog({ servicePackage, trigger }: ServicePackageDetailDialogProps) {
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
          <DialogDescription>Service package details</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
            <p className="text-sm leading-relaxed">{servicePackage.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Price</div>
                <div className="text-2xl font-bold text-primary">
                  {formatVND(servicePackage.price)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="text-2xl font-bold">
                  {servicePackage.duration} <span className="text-base font-normal">days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Maintenance Distance</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(servicePackage.km_interval)} <span className="text-base font-normal">km</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Maintenance Interval</div>
                <div className="text-2xl font-bold text-blue-600">
                  {servicePackage.service_interval_days} <span className="text-base font-normal">days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <div>
              <span className="font-medium">Created At:</span>{" "}
              {formatDateTime(servicePackage.createdAt)}
            </div>
            <div>
              <span className="font-medium">Updated At:</span>{" "}
              {formatDateTime(servicePackage.updatedAt)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
