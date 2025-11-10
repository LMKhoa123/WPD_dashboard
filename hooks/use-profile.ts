"use client"

import { useEffect, useState } from "react"
import { getApiClient, type ProfileData } from "@/lib/api"

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const api = getApiClient()
        const res = await api.getProfile()
        setProfile(res.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return { profile, loading, error }
}
