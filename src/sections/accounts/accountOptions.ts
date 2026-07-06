import type { AccountColor } from '@/types'

export const accountColors: AccountColor[] = [
  { background: 'bg-[#F472B6]', label: 'Pink', text: '#ffffff', value: '#F472B6' },
  { background: 'bg-[#EC4899]', label: 'Rose', text: '#ffffff', value: '#EC4899' },
  { background: 'bg-[#DB2777]', label: 'Berry', text: '#ffffff', value: '#DB2777' },
  { background: 'bg-[#60A5FA]', label: 'Sky', text: '#ffffff', value: '#60A5FA' },
  { background: 'bg-[#3B82F6]', label: 'Blue', text: '#ffffff', value: '#3B82F6' },
  { background: 'bg-[#2563EB]', label: 'Royal', text: '#ffffff', value: '#2563EB' },
  { background: 'bg-[#34D399]', label: 'Mint', text: '#ffffff', value: '#34D399' },
  { background: 'bg-[#10B981]', label: 'Green', text: '#ffffff', value: '#10B981' },
  { background: 'bg-[#059669]', label: 'Forest', text: '#ffffff', value: '#059669' },
  { background: 'bg-[#A78BFA]', label: 'Lilac', text: '#ffffff', value: '#A78BFA' },
  { background: 'bg-[#8B5CF6]', label: 'Violet', text: '#ffffff', value: '#8B5CF6' },
  { background: 'bg-[#7C3AED]', label: 'Purple', text: '#ffffff', value: '#7C3AED' },
  { background: 'bg-[#FBBF24]', label: 'Gold', text: '#0F172A', value: '#FBBF24' },
  { background: 'bg-[#F59E0B]', label: 'Amber', text: '#0F172A', value: '#F59E0B' },
  { background: 'bg-[#EF4444]', label: 'Red', text: '#ffffff', value: '#EF4444' },
  { background: 'bg-[#0F172A]', label: 'Slate', text: '#ffffff', value: '#0F172A' },
]

export const cardTypeOptions = [
  { label: 'Credit Card', value: 'credit' },
  { label: 'Debit Card', value: 'debit' },
  { label: 'Savings', value: 'savings' },
]

export const walletTypeOptions = [
  { label: 'GCash', value: 'gcash' },
  { label: 'Maya', value: 'maya' },
  { label: 'GrabPay', value: 'grabpay' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Other', value: 'other' },
]

export const traditionalBankOptions = [
  'BDO',
  'BPI',
  'Metrobank',
  'Unionbank',
  'Security Bank',
  'PNB',
  'Landbank',
  'Others',
]

export const digitalBankOptions = [
  'Maya',
  'Gotyme',
  'Maribank',
  'Tonik',
  'CIMB',
  'Uno Bank',
  'Others',
]

export const eWalletProviderOptions = ['GCash', 'Maya', 'GrabPay', 'PayPal']
