import tw, { styled } from 'twin.macro'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  $fullWidth?: boolean
}

export const Button = styled.button<ButtonProps>(({ variant = 'primary', size = 'md', $fullWidth }) => [
  tw`font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-2 border`,
  $fullWidth && tw`w-full`,
  size === 'sm' && tw`px-3 py-1 text-xs`,
  size === 'md' && tw`px-4 py-1.5 text-sm`,
  size === 'lg' && tw`px-6 py-2 text-base`,
  variant === 'primary' && tw`bg-[#FF4500] text-white border-[#FF4500] hover:bg-[#E03D00]`,
  variant === 'secondary' && tw`bg-[#0079D3] text-white border-[#0079D3] hover:bg-[#006CBD]`,
  variant === 'danger' && tw`bg-white text-red-500 border-red-500 hover:bg-red-50`,
  variant === 'ghost' && tw`bg-transparent text-[#1A1A1B] border-transparent hover:bg-[#EDEFF1]`,
  variant === 'outline' && tw`bg-white text-[#0079D3] border-[#0079D3] hover:bg-[#F6F7F8]`,
  `&:disabled { ${tw`opacity-50 cursor-not-allowed`} }`,
])
