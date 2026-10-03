import { Check } from 'lucide-react'
import { fieldInput, fieldLabel, fieldError } from '@/components/ui/fieldStyles'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image as ImageIcon, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { AppButton } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import type { ProfileDetailsFormValues } from '@/types'
import { profileDetailsSchema } from '@/validation/profileSchemas'

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Boots',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigger',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
]

export default function GeneralSection() {
  const { user, profile, updateProfile } = useAuth()
  const [updatingProfile, setUpdatingProfile] = useState(false)

  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    setValue: setDetailsValue,
    watch: watchDetails,
    formState: { errors: detailsErrors },
    reset: resetDetails,
  } = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      avatarUrl: '',
      fullName: '',
    },
  })

  // Sync profile details when loaded
  useEffect(() => {
    if (profile) {
      resetDetails({
        avatarUrl: profile.avatar_url ?? '',
        fullName: profile.full_name ?? '',
      })
    }
  }, [profile, resetDetails])

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedAvatarUrl = watchDetails('avatarUrl')

  const onUpdateDetails = async (values: ProfileDetailsFormValues) => {
    setUpdatingProfile(true)
    const { error } = await updateProfile({
      avatar_url: values.avatarUrl || null,
      full_name: values.fullName,
    })
    setUpdatingProfile(false)

    if (error) {
      alerts.error(error.message)
    } else {
      alerts.success('Profile details updated successfully.')
    }
  }

  return (
    <article className="rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <form onSubmit={handleSubmitDetails(onUpdateDetails)} className="space-y-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-pink-50 text-pink-700 dark:bg-slate-800 dark:text-pink-400">
              {selectedAvatarUrl ? (
                <img
                  src={selectedAvatarUrl}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  className="h-full w-full rounded-[2rem] object-cover"
                />
              ) : (
                <User className="h-10 w-10" aria-hidden="true" />
              )}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 tracking-tighter">Your avatar</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose a preset avatar or paste a custom image URL.
            </p>
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="space-y-3">
          <p id="avatar-presets-label" className={fieldLabel}>Avatar presets</p>
          <div role="group" aria-labelledby="avatar-presets-label" className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-3">
            {AVATAR_PRESETS.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setDetailsValue('avatarUrl', url)}
                aria-label={`Choose avatar ${i + 1}`}
                aria-pressed={selectedAvatarUrl === url}
                className={`relative min-h-14 aspect-square rounded-[1.25rem] border-2 bg-pink-50 transition-colors hover:border-pink-800 dark:hover:border-pink-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300 dark:bg-slate-800 ${
                  selectedAvatarUrl === url
                    ? 'border-pink-800 dark:border-pink-300'
                    : 'border-pink-100 dark:border-slate-700'
                }`}
              >
                <img src={url} alt={`Preset ${i + 1}`} width={112} height={112} className="h-full w-full rounded-[1.25rem] object-cover" />
                {selectedAvatarUrl === url ? <span data-selection-check className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-950 shadow-wing"><Check className="h-4 w-4" aria-hidden="true" /></span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="profile-name" className={fieldLabel}>
              Full name
            </label>
            <input
              type="text"
              placeholder="Display Name"
              id="profile-name"
              autoComplete="name"
              aria-invalid={!!detailsErrors.fullName}
              aria-describedby={detailsErrors.fullName ? 'profile-name-error' : undefined}
              {...registerDetails('fullName')}
              className={fieldInput(!!detailsErrors.fullName, 'min-w-0')}
            />
            {detailsErrors.fullName && (
              <p id="profile-name-error" aria-live="polite" className={fieldError}>{detailsErrors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-email" className={fieldLabel}>
              Email address
            </label>
            <input
              id="profile-email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              type="email"
              disabled
              value={user?.email || ''}
              className={fieldInput(false, "cursor-not-allowed")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="profile-avatar-url" className={fieldLabel}>
              Custom avatar URL
            </label>
            <span className="flex items-center gap-1 text-xs font-medium text-pink-700 dark:text-pink-400">
              <ImageIcon className="h-3 w-3" aria-hidden="true" /> Image URL
            </span>
          </div>
          <input
            type="text"
            placeholder="https://example.com/avatar.jpg"
            id="profile-avatar-url"
            autoComplete="off"
            inputMode="url"
            spellCheck={false}
              aria-invalid={!!detailsErrors.avatarUrl}
              aria-describedby={detailsErrors.avatarUrl ? 'profile-avatar-url-error' : undefined}
              {...registerDetails('avatarUrl')}
            className={fieldInput(!!detailsErrors.avatarUrl, 'min-w-0')}
          />
          {detailsErrors.avatarUrl && (
            <p id="profile-avatar-url-error" aria-live="polite" className={fieldError}>{detailsErrors.avatarUrl.message}</p>
          )}
        </div>

        <AppButton type="submit" disabled={updatingProfile} className="w-full sm:w-auto">
          {updatingProfile ? 'Saving...' : 'Save profile'}
        </AppButton>
      </form>
    </article>
  )
}
