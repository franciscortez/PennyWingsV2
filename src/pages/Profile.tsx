import { KeyRound, ShieldAlert, User } from 'lucide-react'
import { useState } from 'react'

import Layout from '@/components/Layout'
import { DangerSection, GeneralSection, SecuritySection } from '@/sections/profile'

type TabType = 'general' | 'security' | 'danger'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('general')

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: KeyRound },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ] as const

  return (
    <Layout>
      {/* Header */}
      <header className="mb-10">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
          Settings
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          Profile & Account
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium italic text-gray-500 sm:text-base">
          Update your display name, avatars, safety settings, and login credentials.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-10 flex gap-2 border-b border-pink-100 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-all ${
                isActive
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="max-w-3xl">
        {activeTab === 'general' && <GeneralSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'danger' && <DangerSection />}
      </div>
    </Layout>
  )
}
