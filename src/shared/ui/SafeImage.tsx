import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react'

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: ReactNode
}

export const SafeImage = ({ src, fallback = null, onError, ...props }: SafeImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | undefined>()

  useEffect(() => {
    setFailedSrc(undefined)
  }, [src])

  if (!src || failedSrc === src) return <>{fallback}</>

  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        setFailedSrc(src)
        onError?.(event)
      }}
    />
  )
}
