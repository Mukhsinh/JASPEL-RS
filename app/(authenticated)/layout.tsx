import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/navigation/Sidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/layout/Footer'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify session exists
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      {/* pt-14 on mobile gives space below the fixed hamburger button */}
      <main className="flex-1 overflow-y-auto lg:ml-72 flex flex-col pt-14 lg:pt-0">
        <div className="flex-1">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <Footer />
      </main>
    </div>
  )
}
