import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockCustomers, mockVehicles, mockAppointments } from "@/src/lib/mock-data"
import { Mail, Phone, MapPin, Calendar } from "lucide-react"

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = mockCustomers.find((c) => c.id === params.id)

  if (!customer) {
    notFound()
  }

  const customerVehicles = mockVehicles.filter((v) => v.customerId === customer.id)
  const customerAppointments = mockAppointments
    .filter((a) => a.customerId === customer.id)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{customer.customerName}</h1>
        <p className="text-muted-foreground">Customer details and service history</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Registered: {new Date(customer.registeredDate).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
            <CardDescription>Customer's registered vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{vehicle.vehicleName}</p>
                    <p className="text-sm text-muted-foreground">Model: {vehicle.model}</p>
                  </div>
                  <Badge variant="secondary">VIN: {vehicle.vin.slice(-6)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
          <CardDescription>Service history for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="text-muted-foreground">{appointment.startTime.toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{appointment.vehicleName}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell className="text-muted-foreground">{appointment.technician}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{appointment.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
