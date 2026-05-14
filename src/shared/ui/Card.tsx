import React from 'react'
import tw from 'twin.macro'

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'hover'
}

export const Card = ({ children, onClick, variant = 'default' }: CardProps) => (
  <div
    onClick={onClick}
    css={[
      tw`bg-white border border-[#CCC] rounded-[4px] overflow-hidden`,
      variant === 'hover' && tw`hover:border-[#898989] cursor-pointer transition-colors`,
    ]}
  >
    {children}
  </div>
)
