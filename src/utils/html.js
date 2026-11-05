export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function getSafeImageUrl(value) {
  if (!value) return '/src/assets/car-placeholder.svg'

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    return url.href
  } catch {
    return '/src/assets/car-placeholder.svg'
  }
}
