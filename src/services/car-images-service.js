import { getSupabaseClient } from './supabase-client.js'
import { CAR_IMAGE_EXTENSIONS, MAX_CAR_IMAGES, validateCarImages } from '../utils/car-images.js'

const BUCKET_NAME = 'car-images'

export async function removeCarImages(paths) {
  if (!paths.length) return

  const supabase = getSupabaseClient()
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths)
  if (error) throw error
}

export async function uploadCarImages(files, ownerId) {
  const validationError = validateCarImages(files)
  if (validationError) throw new Error(validationError)
  if (!files.length) return { coverUrl: null, imageUrls: [], paths: [] }

  const supabase = getSupabaseClient()
  if (!ownerId) throw new Error('You must be logged in to upload vehicle images.')
  const folder = `${ownerId}/${crypto.randomUUID()}`
  const paths = []
  const imageUrls = []

  try {
    for (const [index, file] of files.entries()) {
      const extension = CAR_IMAGE_EXTENSIONS[file.type]
      const filename = `${String(index).padStart(3, '0')}-${crypto.randomUUID()}.${extension}`
      const path = `${folder}/${filename}`
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

      if (error) throw error

      paths.push(path)
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
      imageUrls.push(data.publicUrl)
    }
  } catch (error) {
    if (paths.length) {
      try {
        await removeCarImages(paths)
      } catch (cleanupError) {
        console.error('Failed to clean up partially uploaded car images:', cleanupError)
      }
    }
    throw error
  }

  return { coverUrl: imageUrls[0], imageUrls, paths }
}

export function getStorageFolderFromPublicUrl(publicUrl) {
  if (!publicUrl) return null

  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null

    const storagePath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
    const pathParts = storagePath.split('/')
    pathParts.pop()
    return pathParts.join('/') || null
  } catch {
    return null
  }
}

export async function getCarImageUrls(coverUrl) {
  if (!coverUrl) return []

  const folder = getStorageFolderFromPublicUrl(coverUrl)
  if (!folder) return [coverUrl]

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
    limit: MAX_CAR_IMAGES,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) throw error

  const urls = (data ?? [])
    .filter((file) => file.name && file.id)
    .map((file) => {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${folder}/${file.name}`)
      return publicUrlData.publicUrl
    })

  return [coverUrl, ...urls.filter((url) => url !== coverUrl)]
}
