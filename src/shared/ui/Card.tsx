import React from 'react'
import tw from 'twin.macro'

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
}

export const Card = ({ children, onClick }: CardProps) => (
  <div
    onClick={onClick}
    tw="bg-white border border-gray-200 rounded-md overflow-hidden hover:border-gray-300 transition-colors"
  >
    {children}
  </div>
)
