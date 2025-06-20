// Add dynamic configuration
export const dynamic = 'force-dynamic' // Make this page dynamic
export const revalidate = 60 // Revalidate every 60 seconds

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Add your dashboard content here */}
    </div>
  )
} 