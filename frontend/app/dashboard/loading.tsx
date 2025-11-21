import { Skeleton } from '@/components/ui/skeleton'
import { Layers } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Skeleton */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-96 hidden md:block" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <aside className="w-72 border-r border-border bg-background h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]">
          <div className="p-6">
            <Skeleton className="h-6 w-24 mb-8" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-12 w-full rounded-lg mb-2" />
                  <div className="pl-3 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
