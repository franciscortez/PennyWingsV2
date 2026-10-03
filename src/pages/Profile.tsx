import { PageHeader } from '@/components/ui'
import { appChoice, appChoiceActive, appChoiceIdle } from '@/sections/shared/appDesignStyles'
import { KeyRound, ShieldAlert, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { consumePendingGoogleDeletion } from '@/lib/accountDeletion'
import { alerts } from '@/lib/alert'
import { DangerSection, GeneralSection, SecuritySection } from '@/sections/profile'

type TabType = 'general' | 'security' | 'danger'

export default function ProfilePage() {
  const { user } = useAuth()
  const [googleReauthenticationStatus] = useState(() =>
    user ? consumePendingGoogleDeletion(user) : 'none',
  )
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    googleReauthenticationStatus === 'valid' ? 'danger' : 'general',
  )
  const [googleReauthenticationComplete, setGoogleReauthenticationComplete] =
    useState(googleReauthenticationStatus === 'valid')

  useEffect(() => {
    if (googleReauthenticationStatus === 'expired') {
      void alerts.warning(
        'Google verification expired. Start account deletion again.',
      )
    } else if (googleReauthenticationStatus === 'user-mismatch') {
      void alerts.error(
        'Google account did not match. Account deletion was canceled.',
      )
    } else if (googleReauthenticationStatus === 'not-completed') {
      void alerts.warning(
        'Google verification was not completed. Account deletion was canceled.',
      )
    }
  }, [googleReauthenticationStatus])

  const handleGoogleReauthenticationHandled = useCallback(() => {
    setGoogleReauthenticationComplete(false)
  }, [])

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: KeyRound },
    { id: 'danger', label: 'Danger', icon: ShieldAlert },
  ] as const

  return (
    <Layout>
      <div className="app-design min-w-0">
      <PageHeader title="Settings" description="Update your display name, avatar, and account security." />
      <div className="my-8 flex flex-wrap gap-2" aria-label="Settings views">
        {tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className={`${appChoice} ${activeTab === tab.id ? appChoiceActive : appChoiceIdle}`}>
          <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />{tab.label}
        </button>)}
      </div>
      {/* Content */}
      <div className="min-w-0 max-w-3xl">
        {activeTab === 'general' && <GeneralSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'danger' && (
          <DangerSection
            googleReauthenticationComplete={googleReauthenticationComplete}
            onGoogleReauthenticationHandled={
              handleGoogleReauthenticationHandled
            }
          />
        )}
      </div>
      </div>
    </Layout>
  )
}
