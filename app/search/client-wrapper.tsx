"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"

import { Suspense } from "react"
import SearchImplementation from "./search-implementation"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchClientWrapper() {
  const isAuthorized = useRequireAuth() // Protect this route
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
            <Skeleton className="h-14 w-full bg-zinc-800/50 rounded-xl" />
            <Skeleton className="h-12 w-full bg-zinc-800/50 rounded-xl" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full bg-zinc-800/50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchImplementation />
    </Suspense>
  )
}

