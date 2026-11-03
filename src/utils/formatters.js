export const priceFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export const mileageFormatter = new Intl.NumberFormat('en-US')
