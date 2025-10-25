"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Award } from "lucide-react"
import { getApiClient, type SystemUserRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Certificate {
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  credentialUrl: string
}

interface StaffDialogProps {
  systemUser: SystemUserRecord
  trigger?: React.ReactNode
  onSuccess?: (updated: SystemUserRecord) => void
}

export function StaffDialog({ systemUser, trigger, onSuccess }: StaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(systemUser.name || "")
      setDateOfBirth(systemUser.dateOfBirth ? systemUser.dateOfBirth.split("T")[0] : "")
      setCertificates(
        systemUser.certificates?.map((c) => ({
          name: c.name,
          issuingOrganization: c.issuingOrganization,
          issueDate: c.issueDate.split("T")[0],
          expirationDate: c.expirationDate.split("T")[0],
          credentialUrl: c.credentialUrl,
        })) || []
      )
    } else {
      resetForm()
    }
  }, [open, systemUser])

  const resetForm = () => {
    setName("")
    setDateOfBirth("")
    setCertificates([])
  }

  const addCertificate = () => {
    setCertificates([
      ...certificates,
      {
        name: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
        credentialUrl: "",
      },
    ])
  }

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index))
  }

  const updateCertificate = (index: number, field: keyof Certificate, value: string) => {
    const updated = [...certificates]
    updated[index] = { ...updated[index], [field]: value }
    setCertificates(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      const api = getApiClient()
      const updated = await api.updateSystemUser(systemUser._id, {
        name,
        dateOfBirth: dateOfBirth || null,
        certificates: certificates.filter((c) => c.name && c.issuingOrganization), // Only include filled certificates
      })

      toast({ title: "Cập nhật nhân viên thành công" })
      setOpen(false)
      onSuccess?.(updated)
    } catch (e: any) {
      toast({
        title: "Cập nhật thất bại",
        description: e?.message || "Failed to update staff member",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Edit Staff
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff information and manage certifications</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>

            {/* Certificates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Certifications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCertificate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certificate
                </Button>
              </div>

              {certificates.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
                  No certificates. Click "Add Certificate" to add one.
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Certificate {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCertificate(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <Label className="text-xs">Certificate Name</Label>
                            <Input
                              value={cert.name}
                              onChange={(e) => updateCertificate(index, "name", e.target.value)}
                              placeholder="AWS Certified Solutions Architect"
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-xs">Issuing Organization</Label>
                            <Input
                              value={cert.issuingOrganization}
                              onChange={(e) =>
                                updateCertificate(index, "issuingOrganization", e.target.value)
                              }
                              placeholder="Amazon"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                              <Label className="text-xs">Issue Date</Label>
                              <Input
                                type="date"
                                value={cert.issueDate}
                                onChange={(e) => updateCertificate(index, "issueDate", e.target.value)}
                                required
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label className="text-xs">Expiration Date</Label>
                              <Input
                                type="date"
                                value={cert.expirationDate}
                                onChange={(e) =>
                                  updateCertificate(index, "expirationDate", e.target.value)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-xs">Credential URL</Label>
                            <Input
                              type="url"
                              value={cert.credentialUrl}
                              onChange={(e) => updateCertificate(index, "credentialUrl", e.target.value)}
                              placeholder="https://www.cert-url.com/123"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
