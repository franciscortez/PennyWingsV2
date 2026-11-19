/** Only a stored hex colour is trusted as an inline background. */
export const isHexColor = (value: string | null): value is string =>
  value !== null && /^#[0-9a-f]{3,8}$/i.test(value)
