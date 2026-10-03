import { zodResolver } from '@hookform/resolvers/zod'
import {
  FaArrowLeft,
  FaBuilding,
  FaHandHoldingDollar,
  FaMobileScreenButton,
  FaMoneyBillWave,
  FaWallet,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  useForm,
  type FieldErrors,
  type FieldPath,
  type FieldPathValue,
} from 'react-hook-form'
import { z } from 'zod'

import { AccountColorChoices } from '@/sections/accounts/AccountColorChoices'
import { AppButton } from '@/components/ui/Button'
import { fieldInput, fieldLabel, fieldError } from '@/components/ui/fieldStyles'
import { textMuted } from '@/components/ui/surfaces'
import { accountModalPanel, accountChoice, accountChoiceActive, accountChoiceIdle } from '@/sections/accounts/accountStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'

import type { AccountColor, AccountCreateValues } from '@/types'
import { BankCardFace } from '@/sections/accounts/BankCardFace'
import { MoneyNoteFace } from '@/sections/accounts/MoneyNoteFace'
import {
  buildCustomCardDesign,
  getDesignForProvider,
  noteColors,
} from '@/sections/accounts/bankCardDesigns'
import {
  accountColors,
  digitalBankOptions,
  eWalletProviderOptions,
  traditionalBankOptions,
} from '@/sections/accounts/accountOptions'
import { accountSchema } from '@/validation/accountSchemas'

type AccountCreationWizardProps = {
  hasCashAccount: boolean
  saving: boolean
  onClose: () => void
  onCreate: (values: AccountCreateValues) => Promise<boolean>
}

type SetupType = 'traditional' | 'digital' | 'ewallet' | 'cash' | 'lent'
type Step = 1 | 2 | 3

type WizardForm = {
  accountName: string
  balance: string
  color: AccountColor
  provider: string
  setupType: SetupType | ''
}

const initialForm: WizardForm = {
  accountName: '',
  balance: '',
  color: accountColors[0],
  provider: '',
  setupType: '',
}

const wizardSchema = z
  .object({
    accountName: z.string(),
    balance: z.string(),
    color: z.custom<AccountColor>(),
    provider: z.string(),
    setupType: z.enum(['', 'traditional', 'digital', 'ewallet', 'cash', 'lent']),
  })
  .superRefine((form, context) => {
    if (!form.setupType) {
      context.addIssue({
        code: 'custom',
        message: 'Choose an account type.',
        path: ['setupType'],
      })
      return
    }

    if (!isDirectSetupType(form.setupType) && !form.provider) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a bank or wallet provider.',
        path: ['provider'],
      })
      return
    }

    const result = buildCreateValues(form)
    if (result.success) return

    for (const issue of result.error.issues) {
      const field = issue.path[0]
      const path =
        field === 'name'
          ? ['accountName']
          : field === 'balance'
            ? ['balance']
            : field === 'color' || field === 'textColor'
              ? ['color']
              : field === 'accountType' || field === 'kind'
                ? ['provider']
                : ['accountName']

      context.addIssue({ code: 'custom', message: issue.message, path })
    }
  })

const accountTypes: Array<{
  icon: IconType
  id: SetupType
  label: string
}> = [
  { id: 'traditional', label: 'Traditional Bank', icon: FaBuilding },
  { id: 'digital', label: 'Digital Bank', icon: FaMobileScreenButton },
  { id: 'ewallet', label: 'E-Wallet', icon: FaWallet },
  { id: 'cash', label: 'Cash on Hand', icon: FaMoneyBillWave },
  { id: 'lent', label: 'Lent Money', icon: FaHandHoldingDollar },
]

const directSetupTypes = ['cash', 'lent'] as const

const isDirectSetupType = (
  setupType: SetupType | '',
): setupType is (typeof directSetupTypes)[number] =>
  directSetupTypes.includes(setupType as (typeof directSetupTypes)[number])

const providerOptions: Record<Exclude<SetupType, 'cash' | 'lent'>, string[]> = {
  digital: digitalBankOptions,
  ewallet: eWalletProviderOptions,
  traditional: traditionalBankOptions,
}

const formatProviderValue = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '')

const getWizardDesign = (form: Pick<WizardForm, 'provider' | 'setupType'>) =>
  form.setupType && !isDirectSetupType(form.setupType)
    ? getDesignForProvider(form.provider)
    : null

function buildCreateValues(form: WizardForm) {
  const design = getWizardDesign(form)
  const name =
    form.setupType === 'cash'
      ? 'Cash on Hand'
      : form.setupType === 'lent'
        ? form.accountName.trim()
        : form.accountName.trim() || form.provider
  const accountType =
    form.setupType === 'cash'
      ? 'cash'
      : form.setupType === 'lent'
        ? 'lent'
        : form.setupType === 'ewallet'
          ? formatProviderValue(form.provider)
          : form.setupType === 'traditional'
            ? 'savings'
            : 'debit'
  const kind =
    form.setupType === 'cash'
      ? 'cash'
      : form.setupType === 'lent'
        ? 'lent'
        : form.setupType === 'ewallet'
          ? 'wallet'
          : 'card'

  const noteKind =
    form.setupType === 'cash' || form.setupType === 'lent'
      ? form.setupType
      : null

  return accountSchema.safeParse({
    accountType,
    balance: form.balance,
    color: design
      ? design.primary
      : noteKind
        ? noteColors[noteKind]
        : form.color.value,
    kind,
    name,
    textColor: design ? design.text : noteKind ? '#ffffff' : form.color.text,
  })
}

export function AccountCreationWizard({
  hasCashAccount,
  onClose,
  onCreate,
  saving,
}: AccountCreationWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit: handleWizardSubmit,
    setValue,
    trigger,
    watch,
  } = useForm<WizardForm>({
    defaultValues: initialForm,
    resolver: zodResolver(wizardSchema),
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const form = watch()

  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bodyRef.current) return

    if (typeof bodyRef.current.scrollTo === 'function') {
      bodyRef.current.scrollTo({ behavior: 'instant', top: 0 })
    } else {
      bodyRef.current.scrollTop = 0
    }
  }, [step])

  const handleFieldChange = useCallback(
    <TField extends FieldPath<WizardForm>>(
      field: TField,
      value: FieldPathValue<WizardForm, TField>,
    ) => {
      setValue(field, value, { shouldDirty: true })
      clearErrors(field)
    },
    [clearErrors, setValue],
  )

  const handleSelectType = useCallback(
    (setupType: SetupType) => {
      setValue(
        'accountName',
        setupType === 'cash'
          ? 'Cash on Hand'
          : setupType === 'lent'
            ? ''
            : form.accountName,
        { shouldDirty: true },
      )
      setValue('provider', '', { shouldDirty: true })
      setValue('setupType', setupType, { shouldDirty: true })
      clearErrors(['accountName', 'provider', 'setupType'])
    },
    [clearErrors, form.accountName, setValue],
  )

  const handleStep1Next = async () => {
    if (!(await trigger('setupType'))) return

    setStep(isDirectSetupType(form.setupType) ? 3 : 2)
  }

  const handleStep2Next = async () => {
    if (!(await trigger('provider'))) return

    setStep(3)
  }

  const handleBack = () => {
    setStep((current) => {
      if (current === 3 && isDirectSetupType(form.setupType)) {
        return 1
      }

      return current === 3 ? 2 : 1
    })
  }

  const handleSubmit = handleWizardSubmit(async (values) => {
    const result = buildCreateValues(values)
    if (!result.success) return

    const created = await onCreate(result.data as AccountCreateValues)

    if (created) {
      onClose()
    }
  })

  const title = isDirectSetupType(form.setupType)
    ? form.setupType === 'cash'
      ? 'Cash on Hand'
      : 'Lent Money'
    : `Step ${step} of 3`

  const backButton =
    step > 1 ? (
      <button
        type="button"
        onClick={handleBack}
        className={`${accountChoice} ${textMuted} flex h-11 w-11 shrink-0 items-center justify-center p-0`}
        aria-label="Back"
      >
        <FaArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
    ) : null

  return (
    <ModalFrame
      bodyRef={bodyRef}
      closeDisabled={saving}
      closeLabel="Close account setup"
      headerLeading={backButton}
      onClose={onClose}
      panelClassName={`${accountModalPanel} max-w-md`}
      title={title}
      titleId="account-creation-title"
    >
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-pink-100 dark:bg-slate-800"
          >
            <div
              className="absolute inset-0 bg-pink-700 transition-all duration-200 ease-out"
              style={{
                width:
                  item <= step || isDirectSetupType(form.setupType)
                    ? '100%'
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div key={step} className="animate-fade-in">
        {step === 1 ? (
          <StepOne
            errors={errors}
            form={form}
            hasCashAccount={hasCashAccount}
            onNext={handleStep1Next}
            onSelectType={handleSelectType}
          />
        ) : null}

        {step === 2 && form.setupType && !isDirectSetupType(form.setupType) ? (
          <StepTwo
            errors={errors}
            form={form}
            providers={providerOptions[form.setupType]}
            onChange={handleFieldChange}
            onNext={handleStep2Next}
          />
        ) : null}

        {step === 3 ? (
          <StepThree
            errors={errors}
            form={form}
            saving={saving}
            onChange={handleFieldChange}
            onSubmit={() => void handleSubmit()}
          />
        ) : null}
      </div>
    </ModalFrame>
  )
}

const StepOne = memo(function StepOne({
  errors,
  form,
  hasCashAccount,
  onNext,
  onSelectType,
}: {
  errors: FieldErrors<WizardForm>
  form: WizardForm
  hasCashAccount: boolean
  onNext: () => void | Promise<void>
  onSelectType: (type: SetupType) => void
}) {
  return (
    <div className="space-y-6">
      <label className={`mb-3 block ${fieldLabel}`}>
        What kind of account?
      </label>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
        {accountTypes
          .filter(
            (type) =>
              !(type.id === 'cash' && hasCashAccount),
          )
          .map((type) => {
            const Icon = type.icon
            const active = form.setupType === type.id

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onSelectType(type.id)}
                aria-pressed={active}
                className={`${accountChoice} flex flex-col items-center justify-center gap-3 ${active ? accountChoiceActive : accountChoiceIdle}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center"
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                </span>
                <span
                  className="break-words text-sm"
                >
                  {type.label}
                </span>
              </button>
            )
          })}
      </div>
      {errors.setupType ? (
        <p className={`mt-2 ${fieldError}`}>{errors.setupType.message}</p>
      ) : null}
      <AppButton
        type="button"
        onClick={() => void onNext()}
        className="w-full min-w-0 whitespace-normal"
      >
        Continue
      </AppButton>
    </div>
  )
})

const StepTwo = memo(function StepTwo({
  errors,
  form,
  onChange,
  onNext,
  providers,
}: {
  errors: FieldErrors<WizardForm>
  form: WizardForm
  providers: string[]
  onChange: <TField extends FieldPath<WizardForm>>(
    field: TField,
    value: FieldPathValue<WizardForm, TField>,
  ) => void
  onNext: () => void | Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="account-provider" className={`mb-3 block ${fieldLabel}`}>
          Select Provider
        </label>
        <select
          id="account-provider"
          aria-describedby={errors.provider ? 'account-provider-error' : undefined}
          aria-invalid={Boolean(errors.provider)}
          value={form.provider}
          onChange={(event) => onChange('provider', event.target.value)}
          className={fieldInput(false, "min-w-0")}
        >
          <option value="" className="dark:bg-slate-900">Choose a bank/wallet...</option>
          {providers.map((provider) => (
            <option key={provider} value={provider} className="dark:bg-slate-900">
              {provider}
            </option>
          ))}
        </select>
        {errors.provider ? (
          <p id="account-provider-error" className={`mt-2 ${fieldError}`}>
            {errors.provider.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="account-custom-name" className={`mb-3 block ${fieldLabel}`}>
          Custom Name (Optional)
        </label>
        <input
          id="account-custom-name"
          type="text"
          placeholder="e.g. My Savings"
          value={form.accountName}
          onChange={(event) => onChange('accountName', event.target.value)}
          className={fieldInput(false, "min-w-0")}
        />
      </div>

      <AppButton
        type="button"
        onClick={() => void onNext()}
        className="w-full min-w-0 whitespace-normal"
      >
        Continue
      </AppButton>
    </div>
  )
})

const StepThree = memo(function StepThree({
  errors,
  form,
  onChange,
  onSubmit,
  saving,
}: {
  errors: FieldErrors<WizardForm>
  form: WizardForm
  saving: boolean
  onChange: <TField extends FieldPath<WizardForm>>(
    field: TField,
    value: FieldPathValue<WizardForm, TField>,
  ) => void
  onSubmit: () => void
}) {
  const handleColorClick = useCallback(
    (color: AccountColor) => onChange('color', color),
    [onChange],
  )

  const design = getWizardDesign(form)
  const isCardAccount =
    Boolean(form.setupType) && !isDirectSetupType(form.setupType)
  const previewTypeLabel =
    form.setupType === 'traditional'
      ? 'Savings'
      : form.setupType === 'digital'
        ? 'Debit'
        : 'Wallet'

  return (
    <div className="space-y-8">
      {form.setupType === 'lent' ? (
        <div>
          <label
            htmlFor="lent-account-name"
            className={`mb-3 block ${fieldLabel}`}
          >
            Person or Lending Label
          </label>
          <input
            aria-describedby={errors.accountName ? 'lent-account-name-error' : undefined}
            aria-invalid={Boolean(errors.accountName)}
            id="lent-account-name"
            type="text"
            placeholder="e.g. Juan's utang"
            value={form.accountName}
            onChange={(event) => onChange('accountName', event.target.value)}
            className={fieldInput(false, "min-w-0")}
          />
          {errors.accountName ? (
            <p id="lent-account-name-error" className={`mt-2 ${fieldError}`}>
              {errors.accountName.message}
            </p>
          ) : null}
          <p className={`mt-2 text-xs ${textMuted}`}>
            Use a name that identifies who owes you this money.
          </p>
        </div>
      ) : null}

      <div className="text-center">
        <label htmlFor="account-initial-balance" className={`mb-3 block ${fieldLabel}`}>
          Initial Balance
        </label>
        <div className="relative inline-block w-full">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-slate-600 dark:text-slate-400">
            PHP
          </span>
          <input
            id="account-initial-balance"
            aria-describedby={errors.balance ? 'account-balance-error' : undefined}
            aria-invalid={Boolean(errors.balance)}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.balance}
            onChange={(event) => onChange('balance', event.target.value)}
            className={fieldInput(Boolean(errors.balance), "pl-16 font-geist-mono")}
          />
        </div>
        {errors.balance ? (
          <p id="account-balance-error" className={`mt-2 ${fieldError}`}>
            {errors.balance.message}
          </p>
        ) : null}
      </div>

      {isCardAccount && !design ? (
        <div className="space-y-2">
          <AccountColorChoices label="Card Color" value={form.color.value} onChange={handleColorClick} />
          {errors.color ? (
            <p className={`mt-2 ${fieldError}`}>{errors.color.message}</p>
          ) : null}
        </div>
      ) : null}

      {isCardAccount ? (
        <div className="space-y-3">
          <label className={`mb-3 block ${fieldLabel}`}>
            {design ? 'Official Card Design' : 'Card Preview'}
          </label>
          <div data-account-artwork>
            <BankCardFace
              className="aspect-[8/5] w-full"
              design={design ?? buildCustomCardDesign(form.color.value, form.color.text)}
              holderName={form.accountName.trim() || form.provider}
              numberLine="••••  ••••  ••••  ••••"
              typeLabel={previewTypeLabel}
            />
          </div>
          {design ? (
            <p className={`ml-1 text-xs ${textMuted}`}>
              {design.wordmark}&rsquo;s official card design is applied
              automatically.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <label className={`mb-3 block ${fieldLabel}`}>
            Note Preview
          </label>
          <div data-account-artwork>
            <MoneyNoteFace
              className="aspect-[8/5] w-full"
              serial={form.setupType === 'lent' ? 'IOU 00000000' : 'PW 00000000'}
              subtitle={
                form.setupType === 'lent' ? 'Money lent out' : 'Cash on hand'
              }
              title={
                form.setupType === 'lent'
                  ? form.accountName.trim() || 'Lent Money'
                  : 'Cash on Hand'
              }
              variant={form.setupType === 'lent' ? 'lent' : 'cash'}
            />
          </div>
          <p className={`ml-1 text-xs ${textMuted}`}>
            {form.setupType === 'lent' ? 'Lent money' : 'Cash'} accounts use
            this fixed banknote design.
          </p>
        </div>
      )}

      <AppButton
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="w-full min-w-0 whitespace-normal"
      >
        {saving ? 'Creating...' : 'Finalize Account'}
      </AppButton>
    </div>
  )
})
