import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
} 