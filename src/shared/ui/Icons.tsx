import type { SVGProps } from 'react'

export type CatalogIconName =
  | 'feed'
  | 'bowl'
  | 'tobacco'
  | 'coal'
  | 'kaloud'
  | 'placement'
  | 'setupType'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

const iconPaths: Record<CatalogIconName, JSX.Element> = {
  feed: (
    <>
      <path d="M4.5 16.5c1.2-2.8 3.7-4.5 7.5-4.5s6.3 1.7 7.5 4.5" />
      <path d="M8 19.5h8" />
      <path d="M8.5 12.2V8.8A3.5 3.5 0 0 1 12 5.3h0a3.5 3.5 0 0 1 3.5 3.5v3.4" />
      <path d="M9 8.8h6" />
      <path d="M6.2 17.6c.8 1.3 2.8 2.1 5.8 2.1s5-.8 5.8-2.1" />
    </>
  ),
  bowl: (
    <>
      <path d="M5 10.5h14" />
      <path d="M6.5 10.5c.5 4.3 2.2 6.8 5.5 6.8s5-2.5 5.5-6.8" />
      <path d="M8.2 17.3h7.6" />
      <path d="M9 7.4c.5-.8 1.5-1.4 3-1.4s2.5.6 3 1.4" />
    </>
  ),
  tobacco: (
    <>
      <path d="M5.5 16.5c5.5-.2 9.2-3.9 11-10" />
      <path d="M5.5 16.5C5 11.4 8.5 6.8 16.5 5.5c.2 5.6-3.2 10.6-11 11Z" />
      <path d="M9 13.5c1.1-.1 2.2.1 3.2.6" />
      <path d="M10.4 10.6c1.4.1 2.6.5 3.6 1.3" />
    </>
  ),
  coal: (
    <>
      <path d="M6.2 9.2 9.4 7l3.2 2.2v3.7l-3.2 2.2-3.2-2.2V9.2Z" />
      <path d="m12.6 9.2 3.1-2.1 2.8 2v3.4l-2.8 2-3.1-2.1" />
      <path d="m7.8 7.8 1.6 1.1 1.6-1.1" />
      <path d="M9.4 8.9v6.2" />
      <path d="M15.7 7.1v7.4" />
    </>
  ),
  kaloud: (
    <>
      <path d="M6.5 8.5h11l1 6.8a2 2 0 0 1-2 2.3h-9a2 2 0 0 1-2-2.3l1-6.8Z" />
      <path d="M8 8.5V7.3A2.3 2.3 0 0 1 10.3 5h3.4A2.3 2.3 0 0 1 16 7.3v1.2" />
      <path d="M8.6 12h6.8" />
      <path d="M9.2 15h5.6" />
      <path d="M10.2 5.2 8.6 3.8" />
      <path d="M13.8 5.2 15.4 3.8" />
    </>
  ),
  placement: (
    <>
      <path d="M5.3 7.2 8.1 5l2.8 2.2v3.4l-2.8 2.2-2.8-2.2V7.2Z" />
      <path d="M13.1 7.2 15.9 5l2.8 2.2v3.4l-2.8 2.2-2.8-2.2V7.2Z" />
      <path d="M9.2 14.1 12 12l2.8 2.1v3.5L12 19.8l-2.8-2.2v-3.5Z" />
      <path d="M8.1 5v7.8" />
      <path d="M15.9 5v7.8" />
      <path d="M12 12v7.8" />
    </>
  ),
  setupType: (
    <>
      <path d="M6 7.2h12" />
      <path d="M7.3 7.2c.4 2.5 2 4.1 4.7 4.1s4.3-1.6 4.7-4.1" />
      <path d="M8.6 13h6.8" />
      <path d="M7 16.5h10" />
      <path d="M9.3 4.6h5.4" />
      <path d="M10.2 19h3.6" />
    </>
  ),
}

export const CatalogIcon = ({ name, size = 16, ...props }: IconProps & { name: CatalogIconName }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {iconPaths[name]}
  </svg>
)

export const ShishaGuidLogo = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M9 12.5h9.4" />
    <path d="M10 12.5c.4 3.4 1.9 5.3 4.7 5.3 2.7 0 4.2-1.9 4.6-5.3" />
    <path d="M13.3 17.8v4.7" />
    <path d="M10.7 25h5.2" />
    <path d="M7.8 25h10.9" />
    <path d="M11.2 9.4c.6-1.2 1.8-1.9 3.5-1.9 1.6 0 2.8.7 3.4 1.9" />
    <path d="M19.4 14.7c4.8.2 7.4 1.8 7.4 4.5 0 2.4-2.2 4.2-5.3 4.2" />
    <path d="M21.4 21.1c1.5 0 2.6-.7 2.6-1.8 0-1.2-1.4-2-4.1-2.1" />
    <path d="M8.1 10.1 5.8 7.8" />
    <path d="M21.6 12.4h2.8" />
  </svg>
)

export const PlusIcon = ({ size = 13, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M7 3v8M3 7h8" />
  </svg>
)

export const EditIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M7.4 3.1 10.9 6.6" />
    <path d="M3 10.9 4 7.2l5.1-5.1a1.4 1.4 0 0 1 2 2L6 9.2l-3 .8Z" />
    <path d="M2.5 12h9" />
  </svg>
)

export const TrashIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M2.5 4h9" />
    <path d="M5.5 4V2.8h3V4" />
    <path d="M3.8 4.8 4.3 12h5.4l.5-7.2" />
    <path d="M6 6.5v3.2M8 6.5v3.2" />
  </svg>
)

export const BackIcon = ({ size = 13, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M9 3 4.5 7 9 11" />
  </svg>
)

export const ChevronDownIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3.5 5.25 7 8.75l3.5-3.5" />
  </svg>
)

export const LogoutIcon = ({ size = 12, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M5 3H3.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5M9.5 10 12 7 9.5 4M12 7H5.5" />
  </svg>
)

export const LockIcon = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const EmptyIcon = ({ size = 24, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M14 8v8M10 14h8" />
    <rect x="4" y="4" width="20" height="20" rx="4" />
  </svg>
)

export const AlertIcon = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
)

export const CheckIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="m2.5 7.2 3 3 6-6.4" />
  </svg>
)

export const SendIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 2 6.8 12 5.3 7.3 2 5.5 12 2Z" />
    <path d="M5.4 7.2 8 5.5" />
  </svg>
)

export const MicIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="5" y="1.8" width="4" height="6.6" rx="2" />
    <path d="M2.8 6.6a4.2 4.2 0 0 0 8.4 0" />
    <path d="M7 10.8v1.4M5 12.2h4" />
  </svg>
)

export const ExpandIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M5.5 2.5h-3v3M2.5 2.5 6 6" />
    <path d="M8.5 11.5h3v-3M11.5 11.5 8 8" />
  </svg>
)

export const CloseIcon = ({ size = 12, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M1 1 13 13M13 1 1 13" />
  </svg>
)

export const EyeIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
)

export const HeartIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20.2 5.8a5.2 5.2 0 0 0-7.4 0L12 6.6l-.8-.8a5.2 5.2 0 0 0-7.4 7.4l.8.8L12 21.4 19.4 14l.8-.8a5.2 5.2 0 0 0 0-7.4Z" />
  </svg>
)

export const CommentIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.5 9.5 0 0 1-3.8-.8L3 21l1.8-4.8A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
)

export const ShareIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
  </svg>
)

export const VoteUpIcon = ({ size = 13, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M7 2.5v9M3.5 6 7 2.5 10.5 6" />
  </svg>
)

export const VoteDownIcon = ({ size = 13, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M7 11.5v-9M3.5 8 7 11.5 10.5 8" />
  </svg>
)
