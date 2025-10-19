"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockStaff, mockCertifications, mockStaffCerts } from "@/src/lib/mock-data"
import { useIsAdmin } from "@/components/auth-provider"

export function CertificationsManager() {
  const isAdmin = useIsAdmin()
  const technicians = mockStaff.filter((s) => s.role === "Technician")
  const [selectedTech, setSelectedTech] = useState<string>(technicians[0]?.id ?? "")
  const [techCerts, setTechCerts] = useState(mockStaffCerts)

  const rows = useMemo(() => {
    const tech = technicians.find((t) => t.id === selectedTech)
    const owned = techCerts.filter((c) => c.staffId === selectedTech)
    return owned.map((sc) => ({
      sc,
      cert: mockCertifications.find((c) => c.id === sc.certificationId)!,
      tech,
    }))
  }, [selectedTech, techCerts])

  const addCert = (certId: string) => {
    if (!selectedTech || !certId) return
    if (techCerts.find((c) => c.staffId === selectedTech && c.certificationId === certId)) return
    setTechCerts((prev) => [
      ...prev,
      { staffId: selectedTech, certificationId: certId, obtainedDate: new Date().toISOString().slice(0, 10) },
    ])
  }

  const removeCert = (certId: string) => {
    setTechCerts((prev) => prev.filter((c) => !(c.staffId === selectedTech && c.certificationId === certId)))
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>EV Certifications</CardTitle>
        <div className="flex gap-2">
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select onValueChange={addCert}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Add certification" />
              </SelectTrigger>
              <SelectContent>
                {mockCertifications.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certification</TableHead>
              <TableHead>Obtained</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ sc, cert }) => (
              <TableRow key={sc.staffId + sc.certificationId}>
                <TableCell className="font-medium">{cert.name}</TableCell>
                <TableCell className="text-muted-foreground">{sc.obtainedDate}</TableCell>
                <TableCell className="text-muted-foreground">{sc.level ?? "-"}</TableCell>
                <TableCell className="text-right">
                  {isAdmin && (
                    <Button variant="ghost" onClick={() => removeCert(sc.certificationId)}>
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
