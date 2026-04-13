import { Sidebar } from '@/components/layout/Sidebar'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-bg-primary">
          {children}
        </main>
      </div>
    </LocaleProvider>
  )
}
