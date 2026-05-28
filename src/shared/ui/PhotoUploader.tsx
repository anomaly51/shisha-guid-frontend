import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { useUploadMediaMutation } from '../api'

interface PhotoUploaderProps {
  label?: string
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

const Label = tw.label`text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide`
const configuredMaxUploadBytes = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES)

export const ACCEPTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ACCEPTED_MEDIA_INPUT = ACCEPTED_MEDIA_TYPES.join(',')
export const MAX_MEDIA_SIZE_BYTES = Number.isFinite(configuredMaxUploadBytes) && configuredMaxUploadBytes > 0
  ? configuredMaxUploadBytes
  : 5242880
export const LARGE_GIF_WARNING_BYTES = 2 * 1024 * 1024

export const isAcceptedMediaFile = (file: File) => (
  ACCEPTED_MEDIA_TYPES.includes(file.type) && file.size <= MAX_MEDIA_SIZE_BYTES
)

export const getBrowserUploadUrl = (uploadUrl: string) => {
  const publicUploadUrl = import.meta.env.VITE_UPLOAD_PUBLIC_URL
  if (publicUploadUrl) return publicUploadUrl

  if (typeof window === 'undefined') return uploadUrl

  const url = new URL(uploadUrl)
  if (url.hostname === 'minio') {
    url.hostname = window.location.hostname || 'localhost'
  }
  return url.toString().replace(/\/$/, '')
}

export const getPublicUrl = (uploadUrl: string, key: string) => {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  return `${uploadUrl.replace(/\/$/, '')}/${encodedKey}`
}

export const PhotoUploader = ({ label = 'Photos', value, onChange, max = 10 }: PhotoUploaderProps) => {
  const [uploadMedia] = useUploadMediaMutation()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const { t } = useTranslation()
  const availableSlots = Math.max(max - value.length, 0)
  const showsPreviewHint = max > 1
  const helperText = useMemo(() => t('uploader.helper', { current: value.length, max }), [max, t, value.length])

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || availableSlots === 0) return
    setUploading(true)
    setUploadProgress(null)
    setError('')
    try {
      const selected = Array.from(files)
        .filter(isAcceptedMediaFile)
        .slice(0, availableSlots)

      if (!selected.length) {
        setError(t('uploader.onlySupported', { label: t('common.mediaRules') }))
        return
      }

      const largeGif = selected.find((file) => file.type === 'image/gif' && file.size > LARGE_GIF_WARNING_BYTES)
      if (largeGif && !window.confirm(t('uploader.largeGifWarning'))) return

      setUploadProgress({ done: 0, total: selected.length })
      const uploaded = await Promise.all(selected.map(async (file) => {
        const response = await uploadMedia(file).unwrap()
        setUploadProgress((current) => ({ done: (current?.done || 0) + 1, total: current?.total || selected.length }))
        return response.url
      }))

      onChange([...value, ...uploaded])
    } catch {
      setError(t('common.uploadFailed'))
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= value.length) return
    const next = [...value]
    const current = next[index]
    next[index] = next[nextIndex]
    next[nextIndex] = current
    onChange(next)
  }

  return (
    <div tw="flex flex-col gap-2">
      <div tw="flex items-center justify-between gap-2">
        <Label>{label === 'Photos' ? t('common.photos') : label}</Label>
        <span tw="text-[10px] text-[rgb(var(--color-text-subtle))] font-medium">{helperText}</span>
      </div>

      {showsPreviewHint && (
        <div tw="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-accent-muted))] px-3 py-2">
          <div tw="flex items-center gap-2">
            <span tw="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[rgb(var(--color-accent))] px-1.5 text-[10px] font-bold text-white">1</span>
            <p tw="text-[12px] font-semibold leading-snug text-[rgb(var(--color-text-muted))]">{t('uploader.previewHint')}</p>
          </div>
        </div>
      )}

      <div tw="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            tw="relative aspect-square rounded-lg overflow-hidden bg-[rgb(var(--color-surface-muted))] border border-[rgb(var(--color-border))]"
            style={index === 0 ? { borderColor: 'rgb(var(--color-accent))', boxShadow: '0 0 0 2px rgb(var(--color-accent) / 0.16)' } : undefined}
          >
            <img src={url} alt="" tw="w-full h-full object-cover" />
            {showsPreviewHint && index === 0 && (
              <div tw="absolute left-1 top-1 rounded-md bg-[rgb(var(--color-accent))] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                {t('uploader.previewBadge')}
              </div>
            )}
            <div tw="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              <button
                type="button"
                onClick={() => movePhoto(index, -1)}
                disabled={index === 0}
                tw="w-6 h-6 rounded-md bg-[rgb(var(--color-surface))]/90 text-[rgb(var(--color-text))] text-xs disabled:opacity-30"
                aria-label={t('uploader.moveLeft')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, photoIndex) => photoIndex !== index))}
                tw="w-6 h-6 rounded-md bg-[rgb(var(--color-surface))]/90 text-[rgb(var(--color-danger))] text-xs font-semibold"
                aria-label={t('uploader.remove')}
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => movePhoto(index, 1)}
                disabled={index === value.length - 1}
                tw="w-6 h-6 rounded-md bg-[rgb(var(--color-surface))]/90 text-[rgb(var(--color-text))] text-xs disabled:opacity-30"
                aria-label={t('uploader.moveRight')}
              >
                ›
              </button>
            </div>
          </div>
        ))}

        {availableSlots > 0 && (
          <label tw="aspect-square rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))]/80 hover:bg-[rgb(var(--color-accent-muted))] transition-colors flex flex-col items-center justify-center gap-1.5 text-[rgb(var(--color-text-muted))] cursor-pointer">
            <span tw="w-6 h-6 rounded-md bg-[rgb(var(--color-surface-subtle))] flex items-center justify-center text-lg leading-none">+</span>
            <span tw="text-[11px] font-semibold">
              {uploading && uploadProgress
                ? t('uploader.uploadProgress', { done: uploadProgress.done, total: uploadProgress.total })
                : uploading ? t('common.uploading') : t('common.addMedia')}
            </span>
            <span tw="px-2 text-center text-[10px] leading-tight text-[rgb(var(--color-text-subtle))]">{t('common.mediaRules')}</span>
            <input
              type="file"
              accept={ACCEPTED_MEDIA_INPUT}
              multiple
              disabled={uploading}
              onChange={(event) => {
                uploadFiles(event.target.files)
                event.currentTarget.value = ''
              }}
              tw="hidden"
            />
          </label>
        )}
      </div>

      {error && <p tw="text-xs text-[rgb(var(--color-danger))] font-medium">{error}</p>}
      {value.length >= max && (
        <p tw="text-xs text-[rgb(var(--color-text-subtle))]">{t('uploader.limitReached')}</p>
      )}
    </div>
  )
}
