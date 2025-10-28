import type React from "react"
import { TechnicianOnly } from "@/components/role-guards"

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return <TechnicianOnly>{children}</TechnicianOnly>
}
