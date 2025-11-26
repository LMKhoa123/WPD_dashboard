"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User, Car, Building2, Mail, Edit, Trash2 } from "lucide-react"
import { getApiClient, type AppointmentRecord, type AppointmentStatus, type SystemUserRecord } from "@/lib/api"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useIsAdmin, useIsStaff } from "@/components/auth-provider"
import AppointmentServiceRecords from "@/components/appointments/appointment-service-records"

const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  // confirmed: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  "waiting-for-parts": "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  // scheduled: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const api = useMemo(() => getApiClient(), [])

  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [staffDetails, setStaffDetails] = useState<SystemUserRecord | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(false)

  const appointmentId = params.id as string

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await api.getAppointmentById(appointmentId)
        setAppointment(data)

        if (data.staffId && typeof data.staffId === 'string') {
          setLoadingStaff(true)
          try {
            const staffData = await api.getSystemUserById(data.staffId)
            setStaffDetails(staffData)
          } catch (err) {
            console.error("Failed to load staff details:", err)
          } finally {
            setLoadingStaff(false)
          }
        }

      } catch (e: any) {
        toast.error(e?.message || "Failed to load appointment details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [appointmentId, api, toast])

  const handleDelete = async () => {
    if (!appointment) return
    try {
      setDeleting(true)
      await api.deleteAppointment(appointment._id)
      toast.success("Deleted appointment successfully")
      router.push("/appointments")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete appointment")
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdated = (updated: AppointmentRecord) => {
    setAppointment(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Loading...
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button onClick={() => router.push("/appointments")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
        </Button>
      </div>
    )
  }

  const slot = appointment.slot_id && typeof appointment.slot_id === 'object' ? appointment.slot_id : null
  const vehicle = typeof appointment.vehicle_id === 'object' ? appointment.vehicle_id : null
  const customer = typeof appointment.customer_id === 'object' ? appointment.customer_id : null
  const center = typeof appointment.center_id === 'object' ? appointment.center_id : null
  const staff = typeof appointment.staffId === 'object' ? appointment.staffId : staffDetails

  const isFullStaff = (s: any): s is SystemUserRecord => {
    return s && 'userId' in s && 'isOnline' in s
  }

  const appointmentDate = slot
    ? new Date(slot.slot_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : appointment.startTime
      ? new Date(appointment.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : "—"

  const timeRange = slot
    ? `${slot.start_time} - ${slot.end_time}`
    : appointment.startTime && appointment.endTime
      ? `${new Date(appointment.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
      : "—"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/appointments")} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointment Details</h1>
            <p className="text-muted-foreground">ID: {appointment._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={statusColors[appointment.status as AppointmentStatus]}>
            {appointment.status.replace("-", " ").toUpperCase()}
          </Badge>
          {(isAdmin || isStaff) && (
            <>
              <AppointmentDialog
                appointment={appointment}
                onUpdated={handleUpdated}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={deleting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm delete appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The appointment will be permanently deleted from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Appointment Date</p>
                  <p className="text-sm text-muted-foreground">{appointmentDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">{timeRange}</p>
                  {slot && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Slot: {slot.booked_count}/{slot.capacity} • {slot.status}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Created at: {new Date(appointment.createdAt).toLocaleString('en-US')}</p>
                <p>Updated at: {new Date(appointment.updatedAt).toLocaleString('en-US')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Service Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {center ? (
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Center Name</p>
                  <p className="text-lg font-semibold">{center.name}</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{center.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">{center.phone}</p>
                  </div>
                </div>
                {(center as any).image && (
                  <div className="mt-2">
                    <img
                      src={(center as any).image}
                      alt={center.name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Service center information is not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle ? (
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Vehicle Name</p>
                  <p className="text-lg font-semibold">{vehicle.vehicleName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium">Plate Number</p>
                    <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Model</p>
                    <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                  </div>
                </div>
                {vehicle.mileage !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Mileage</p>
                    <p className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                )}
                {(vehicle as any).image && (
                  <div className="mt-2">
                    <img
                      src={(vehicle as any).image}
                      alt={vehicle.vehicleName}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Vehicle information is not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer ? (
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Customer Name</p>
                  <p className="text-lg font-semibold">{customer.customerName || "—"}</p>
                </div>
                {(customer as any).userId && typeof (customer as any).userId === 'object' && (
                  <>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{(customer as any).userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-muted-foreground">{(customer as any).userId.phone || "—"}</p>
                      </div>
                    </div>
                  </>
                )}
                {(customer as any).address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{(customer as any).address}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Customer information is not available</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff in Charge
              {loadingStaff && <Spinner className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staff || typeof appointment.staffId === 'string' ? (
              isFullStaff(staff) ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Staff Name</p>
                    <p className="text-lg font-semibold">{staff.name || "—"}</p>
                  </div>
                  {staff.userId && typeof staff.userId === 'object' && (
                    <>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{staff.userId.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Role</p>
                        <Badge variant="outline">{staff.userId.role}</Badge>
                      </div>
                      {staff.userId.phone && (
                        <div>
                          <p className="text-sm font-medium">Phone Number</p>
                          <p className="text-sm text-muted-foreground">{staff.userId.phone}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={staff.isOnline ? "default" : "secondary"}>
                      {staff.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  {(staff as any).centerId && (
                    <div>
                      <p className="text-sm font-medium">Center ID</p>
                      <p className="text-sm text-muted-foreground">{typeof (staff as any).centerId === 'string' ? (staff as any).centerId : (staff as any).centerId._id}</p>
                    </div>
                  )}
                  {staff.certificates && staff.certificates.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium mb-2">Certificates</p>
                      <div className="space-y-2">
                        {staff.certificates.map((cert: any, idx: number) => (
                          <div key={idx} className="text-sm p-2 bg-muted rounded">
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-xs text-muted-foreground">{cert.issuingOrganization}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : loadingStaff ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner /> Loading staff information...
                </div>
              ) : staff ? (
                <div className="grid gap-3">
                  <div>
                    <p className="text-sm font-medium">Staff Name</p>
                    <p className="text-lg font-semibold">{staff.name || "—"}</p>
                  </div>
                  {staff.email && (
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Staff ID: {typeof appointment.staffId === 'string' ? appointment.staffId : appointment.staffId._id}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No staff assigned</p>
            )}
          </CardContent>
        </Card>

     
        <div className="md:col-span-2">
          <AppointmentServiceRecords appointmentId={appointmentId} />
        </div>
      </div>
    </div>
  )
}
