import { useState, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useSidebarInfo } from '@/hooks/useSidebarInfo'
import { Sidebar } from '@/components/ui'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth()
  const sidebarInfo = useSidebarInfo(user?.id, user?.email)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved === 'true'
  })
  const [moreOpen, setMoreOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen((current) => {
      const next = !current
      localStorage.setItem('sidebarOpen', String(next))
      return next
    })
  }

  const handleSignOut = () => {
    void signOut()
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 md:flex">
      <Sidebar
        mobileMenuOpen={moreOpen}
        onCloseMobileMenu={() => setMoreOpen(false)}
        onSignOut={handleSignOut}
        onToggleMobileMenu={() => setMoreOpen((current) => !current)}
        onToggleSidebar={toggleSidebar}
        sidebarInfo={sidebarInfo}
        sidebarOpen={sidebarOpen}
      />

      <main
        className={`w-full flex-1 transition-[margin] duration-300 ${
          sidebarOpen ? 'md:ml-72 xl:ml-80' : 'md:ml-24'
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:py-10 lg:px-12">
          {children}
        </div>
      </main>

    </div>
  )
}
