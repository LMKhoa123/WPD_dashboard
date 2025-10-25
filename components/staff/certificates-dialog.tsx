"use client"

import { useState } from "react"
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
import { getApiClient, type SystemUserRecord } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Plus, X } from "lucide-react"

interface Certificate {
  _id?: string
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  credentialUrl: string
}

interface CertificatesDialogProps {
  systemUser: SystemUserRecord
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CertificatesDialog({ systemUser, trigger, onSuccess }: CertificatesDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [certificates, setCertificates] = useState<Certificate[]>(
    systemUser.certificates?.map((cert: any) => ({
      _id: cert._id,
      name: cert.name || "",
      issuingOrganization: cert.issuingOrganization || "",
      issueDate: cert.issueDate || "",
      expirationDate: cert.expirationDate || "",
      credentialUrl: cert.credentialUrl || ""
    })) || []
  )

  const handleAddCertificate = () => {
    setCertificates([
      ...certificates,
      {
        name: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
        credentialUrl: ""
      }
    ])
  }

  const handleRemoveCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index))
  }

  const handleCertificateChange = (index: number, field: keyof Certificate, value: string) => {
    const newCertificates = [...certificates]
    newCertificates[index] = { ...newCertificates[index], [field]: value }
    setCertificates(newCertificates)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const api = getApiClient()
      
      // Only update certificates
      await api.updateSystemUser(systemUser._id, {
        certificates: certificates.map(({ _id, ...cert }) => cert)
      })

      toast({
        title: "Success",
        description: "Certificates updated successfully",
      })
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update certificates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Manage Certificates</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage Certificates</DialogTitle>
            <DialogDescription>
              Add, edit, or remove professional certificates for this staff member.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {certificates.map((cert, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleRemoveCertificate(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="grid gap-2">
                  <Label htmlFor={`cert-name-${index}`}>Certificate Name *</Label>
                  <Input
                    id={`cert-name-${index}`}
                    value={cert.name}
                    onChange={(e) => handleCertificateChange(index, "name", e.target.value)}
                    placeholder="e.g., ASE Master Technician"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`cert-org-${index}`}>Issuing Organization *</Label>
                  <Input
                    id={`cert-org-${index}`}
                    value={cert.issuingOrganization}
                    onChange={(e) => handleCertificateChange(index, "issuingOrganization", e.target.value)}
                    placeholder="e.g., National Institute for Automotive Service Excellence"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`cert-issue-${index}`}>Issue Date *</Label>
                    <Input
                      id={`cert-issue-${index}`}
                      type="date"
                      value={cert.issueDate}
                      onChange={(e) => handleCertificateChange(index, "issueDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`cert-exp-${index}`}>Expiration Date</Label>
                    <Input
                      id={`cert-exp-${index}`}
                      type="date"
                      value={cert.expirationDate}
                      onChange={(e) => handleCertificateChange(index, "expirationDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`cert-url-${index}`}>Credential URL</Label>
                  <Input
                    id={`cert-url-${index}`}
                    type="url"
                    value={cert.credentialUrl}
                    onChange={(e) => handleCertificateChange(index, "credentialUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddCertificate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
