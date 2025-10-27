export type AppointmentStatus = "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"

export type UserRole = "Admin" | "Staff"

export interface AuthUser {
  name: string
  email: string
  role: UserRole
}

export interface Customer {
  id: string
  customerName: string
  email: string
  phone: string
  address: string
  vehicleCount: number
  registeredDate: string
}

export interface Vehicle {
  id: string
  customerId: string
  customerName: string
  vehicleName: string
  model: string
  vin: string
}

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  vehicleId: string
  vehicleName: string
  service: string
  technician: string
  startTime: Date
  endTime: Date
  status: AppointmentStatus
}

export interface AutoPart {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  minStock: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: "Admin" | "Staff" | "Technician"
  phone: string
  status: "Active" | "Inactive"
}

export interface Certification {
  id: string
  name: string
  description?: string
}

export interface StaffCertification {
  staffId: string
  certificationId: string
  obtainedDate: string
  expiresDate?: string
  level?: "Associate" | "Professional" | "Expert"
}

export interface UserProfile {
  _id: string
  userId: {
    _id: string
    email: string
    role: "ADMIN" | "STAFF"
  }
  name: string
  dateOfBirth: string | null
  certification: string
  isOnline: boolean
  createdAt: string
  updatedAt: string
}
