import { supabase } from './supabase'

const MAX_SIDE = 1800
const QUALITY = 0.82

/** Reduce la foto en el navegador (las fotos de celular pesan 3–8 MB) y la
 *  convierte a WebP antes de subirla: el landing carga mucho más rápido. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', QUALITY))
  return blob ?? file
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await compress(file)
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  const path = `${folder}/${Date.now().toString(36)}-${base || 'foto'}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    if (/bucket/i.test(error.message)) throw new Error('Falta activar el almacenamiento de fotos en Supabase (migración media_storage).')
    if (/row-level|policy|unauthorized/i.test(error.message)) throw new Error('Tu cuenta no tiene permiso para subir fotos.')
    throw new Error(error.message)
  }
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
