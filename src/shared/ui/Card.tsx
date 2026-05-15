import React from 'react'
import tw from 'twin.macro'

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'hover' | 'flat'
  className?: string
}

export const Card = ({ children, onClick, variant = 'default', className }: CardProps) => (
  <div
    onClick={onClick}
    className={className}
    css={[
      tw`bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border-muted))] overflow-hidden`,
      variant === 'default' && `box-shadow: var(--shadow-card);`,
      variant === 'hover' && [
        `box-shadow: var(--shadow-card);`,
        tw`hover:border-[rgb(var(--color-border))] hover:-translate-y-0.5 cursor-pointer transition-all duration-200`,
        `&:hover { box-shadow: var(--shadow-card-hover); }`,
      ],
      variant === 'flat' && tw`shadow-none border-none`,
    ]}
  >
    {children}
  </div>
)
