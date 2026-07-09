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
    <article className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmitDetails(onUpdateDetails)} className="space-y-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-pink-50 text-pink-500 shadow-inner">
              {selectedAvatarUrl ? (
                <img
                  src={selectedAvatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-black text-gray-800">Your Avatar</h3>
            <p className="text-xs font-bold text-gray-400">
              Choose one of our premium preset avatars or paste a custom image URL.
            </p>
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
            Preset Options
          </label>
          <div className="grid grid-cols-6 gap-3">
            {AVATAR_PRESETS.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setDetailsValue('avatarUrl', url)}
                className={`aspect-square overflow-hidden rounded-2xl border-2 bg-pink-50 transition-all hover:scale-105 ${
                  selectedAvatarUrl === url
                    ? 'border-pink-500 scale-105 shadow-md shadow-pink-100'
                    : 'border-pink-100'
                }`}
              >
                <img src={url} alt={`Preset ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Display Name"
              {...registerDetails('fullName')}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition-all ${
                detailsErrors.fullName
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-pink-100 focus:border-pink-500'
              }`}
            />
            {detailsErrors.fullName && (
              <p className="text-xs font-bold text-red-500">{detailsErrors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              Custom Avatar URL
            </label>
            <span className="flex items-center gap-1 text-[10px] font-bold text-pink-500">
              <ImageIcon className="h-3 w-3" /> Image URL
            </span>
          </div>
          <input
            type="text"
            placeholder="https://example.com/avatar.jpg"
            {...registerDetails('avatarUrl')}
            className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition-all ${
              detailsErrors.avatarUrl
                ? 'border-red-300 focus:border-red-500'
                : 'border-pink-100 focus:border-pink-500'
            }`}
          />
          {detailsErrors.avatarUrl && (
            <p className="text-xs font-bold text-red-500">{detailsErrors.avatarUrl.message}</p>
          )}
        </div>

        <AppButton type="submit" disabled={updatingProfile} className="w-full sm:w-auto">
          {updatingProfile ? 'Saving Changes...' : 'Save Profile'}
        </AppButton>
      </form>
    </article>
  )
}
