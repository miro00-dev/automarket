export const MAX_CAR_IMAGES = 10
export const MAX_CAR_IMAGE_SIZE = 10 * 1024 * 1024
export const CAR_IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function validateCarImages(files) {
  if (files.length > MAX_CAR_IMAGES) return `Select no more than ${MAX_CAR_IMAGES} images.`

  const unsupportedFile = files.find((file) => !CAR_IMAGE_EXTENSIONS[file.type])
  if (unsupportedFile) return 'Only JPG, PNG, and WebP images are supported.'

  const oversizedFile = files.find((file) => file.size > MAX_CAR_IMAGE_SIZE)
  if (oversizedFile) return 'Each image must be 10 MB or smaller.'

  return ''
}
