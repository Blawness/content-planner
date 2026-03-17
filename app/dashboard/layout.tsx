import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto bg-white pl-12 lg:pl-0 pt-14 lg:pt-0">{children}</main>
    </div>
  )
}
