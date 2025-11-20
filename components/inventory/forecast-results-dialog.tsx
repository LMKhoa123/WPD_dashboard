"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type ForecastResultItem, type CenterRecord, type AutoPartRecord } from "@/lib/api"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Sparkles, AlertTriangle, TrendingUp, CheckCircle2, Package, Calendar, Wrench, Loader2, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ForecastResultsDialogProps {
  trigger: React.ReactNode
}

export function ForecastResultsDialog({ trigger }: ForecastResultsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ForecastResultItem[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [parts, setParts] = useState<AutoPartRecord[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const loadCenters = async () => {
      try {
        const res = await api.getCenters({ page: 1, limit: 100 })
        setCenters(res.data.centers)
        if (res.data.centers.length > 0 && !selectedCenter) {
          setSelectedCenter(res.data.centers[0]._id)
        }
      } catch (e: any) {
        toast.error("Failed to load service centers. Please try again.")
      }
    }
    
    const loadParts = async () => {
      try {
        const res = await api.getAutoParts(1, 500)
        setParts(res.data.parts)
      } catch (e: any) {
        console.error("Failed to load parts:", e)
      }
    }
    
    loadCenters()
    loadParts()
  }, [open, api, toast, selectedCenter])

  useEffect(() => {
    if (!open || !selectedCenter) return
    const loadForecast = async () => {
      try {
        setLoading(true)
        const res = await api.getForecastInfo(selectedCenter)
        setResults(res.results || [])
      } catch (e: any) {
        toast.error(e?.message || "Failed to load forecast data")
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    loadForecast()
  }, [open, selectedCenter, api])

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return <Badge variant="outline">N/A</Badge>
    const level = riskLevel.toUpperCase()
    switch (level) {
      case "HIGH":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            HIGH
          </Badge>
        )
      case "MEDIUM":
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/50">
            <TrendingUp className="h-3 w-3 mr-1" />
            MEDIUM
          </Badge>
        )
      case "LOW":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg shadow-green-500/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            LOW
          </Badge>
        )
      default:
        return <Badge variant="outline">{riskLevel}</Badge>
    }
  }

  const getRiskGradient = (riskLevel?: string) => {
    if (!riskLevel) return "from-gray-500 to-gray-600"
    const level = riskLevel.toUpperCase()
    if (level === "HIGH") return "from-red-500 to-red-600"
    if (level === "MEDIUM") return "from-orange-500 to-orange-600"
    if (level === "LOW") return "from-green-500 to-green-600"
    return "from-gray-500 to-gray-600"
  }

  const getPartName = (partId: string) => {
    const part = parts.find(p => p._id === partId)
    return part?.name || partId
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[90vw] 
  max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI-Powered Inventory Forecast
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Smart predictions to optimize your parts inventory
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Service Center</Label>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Choose a center..." />
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center._id} value={center._id}>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      {center.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-muted-foreground font-medium">Analyzing inventory data...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-2xl opacity-20"></div>
                <Package className="h-20 w-20 text-gray-400 relative" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-700">No Forecast Data Available</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  There are no AI predictions for this center yet. Check back later for smart inventory insights.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-280px)] pr-4">
              <div className="space-y-3 pb-4">
                {results.map((result) => {
                  const isExpanded = expandedId === result._id
                  
                  return (
                    <div
                      key={result._id}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm hover:shadow-lg transition-all duration-300",
                        isExpanded ? "border-purple-300" : "hover:border-purple-200"
                      )}
                    >
                      {/* Gradient accent bar */}
                      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", getRiskGradient(result.analysis?.riskLevel))} />
                      
                      {/* Compact Row */}
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Icon + Part Name */}
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-br shadow-md flex-shrink-0",
                              getRiskGradient(result.analysis?.riskLevel)
                            )}>
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {getPartName(result.part_id)}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(result.createdAt).toLocaleDateString("en-US", { 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Risk Badge */}
                          <div className="flex-shrink-0">
                            {getRiskBadge(result.analysis?.riskLevel)}
                          </div>

                          {/* Order Quantity */}
                          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1.5 rounded-lg border border-purple-200 flex-shrink-0">
                            <ShoppingCart className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-sm font-bold text-purple-900">
                              {result.analysis?.suggestedOrderQty || 0} units
                            </span>
                          </div>

                          {/* Recommendation Preview */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">
                              {result.analysis?.title || 'No recommendation'}
                            </p>
                          </div>

                          {/* Expand/Collapse Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : result._id)}
                            className="flex-shrink-0 hover:bg-purple-50"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-3 animate-in slide-in-from-top-2">
                            {/* Full Recommendation */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-blue-900 mb-1">Recommendation</p>
                                  <p className="text-sm text-blue-800 leading-relaxed">
                                    {result.analysis?.title || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Full Analysis */}
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 mb-1">AI Analysis</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {result.analysis?.content || 'No detailed analysis available.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="hover:bg-gray-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
