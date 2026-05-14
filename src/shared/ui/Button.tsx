import React from 'react'
import tw, { styled } from 'twin.macro'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  $fullWidth?: boolean // Используем $ для styled-components, чтобы проп не летел в DOM
}

export const Button = styled.button<ButtonProps>(({ variant = 'primary', $fullWidth }) => [
  tw`px-4 py-2 font-semibold rounded-full transition-colors duration-200 flex items-center justify-center gap-2`,
  $fullWidth && tw`w-full`,
  variant === 'primary' && tw`bg-blue-600 text-white hover:bg-blue-700`,
  variant === 'secondary' && tw`bg-gray-200 text-gray-800 hover:bg-gray-300`,
  variant === 'danger' && tw`bg-red-500 text-white hover:bg-red-600`,
  variant === 'ghost' && tw`bg-transparent text-gray-500 hover:bg-gray-100`,
])
