import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto bg-background pl-12 pt-14 lg:pl-0 lg:pt-0">{children}</main>
    </div>
  )
}
