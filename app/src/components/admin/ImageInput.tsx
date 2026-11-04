import { useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { asset } from '../../lib/asset'
import { uploadImage } from '../../lib/media'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Primitives'

/** Campo de imagen del panel: sube una foto desde el teléfono o computador
 *  (se comprime antes de enviarla) o acepta una URL pegada. */
export function ImageInput({
  label,
  value,
  onChange,
  folder,
  aspect = 'aspect-[16/10]',
  hint,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  aspect?: string
  hint?: string
}) {
  const { push } = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const placeholder = !value || value.startsWith('images/')

  const onFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
      push('Foto subida', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'No se pudo subir la foto', 'error')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-bark-500">{hint}</span>}
      </div>
      <div
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed ${
          placeholder ? 'border-sun-400/60' : 'border-transparent'
        } bg-cream-100 ${aspect}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void onFile(e.dataTransfer.files?.[0])
        }}
      >
        {value && <img src={asset(value)} alt="" className="size-full object-cover" />}
        {placeholder && (
          <span className="absolute left-2 top-2 rounded-full bg-sun-400 px-2.5 py-1 text-[0.68rem] font-bold text-bark-900">
            Ilustración de ejemplo
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-bark-900/70 to-transparent p-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-bark-900 shadow-soft transition hover:bg-cream-100"
          >
            {busy ? <Spinner className="size-3.5" /> : <Icon name="upload" className="size-3.5" />}
            {busy ? 'Subiendo…' : value ? 'Cambiar foto' : 'Subir foto'}
          </button>
          <button
            type="button"
            onClick={() => setShowUrl((v) => !v)}
            className="rounded-full bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            Pegar URL
          </button>
        </div>
      </div>
      {showUrl && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…/foto.jpg"
          className="mt-2 w-full rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
        />
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  )
}
