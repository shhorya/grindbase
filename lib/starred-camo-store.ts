"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "grindbase-starred-camo"

export function useStarredCamo() {
  const [starredId, setStarredId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setStarredId(localStorage.getItem(STORAGE_KEY))
    setHydrated(true)
  }, [])

  const toggleStar = useCallback((camoId: string) => {
    setStarredId((prev) => {
      const next = prev === camoId ? null : camoId
      if (next) {
        localStorage.setItem(STORAGE_KEY, next)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      return next
    })
  }, [])

  return { starredId, toggleStar, hydrated }
}   