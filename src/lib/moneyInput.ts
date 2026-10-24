/** Keep editing values as strings so grouping never rounds amounts or removes trailing decimals. */
export function parseMoneyInput(value: string): string | null {
  const raw = value.replace(/,/g, '')
  return /^-?\d*(?:\.\d*)?$/.test(raw) ? raw : null
}

export function formatMoneyInput(value: string): string {
  const [integer, fraction] = value.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}
