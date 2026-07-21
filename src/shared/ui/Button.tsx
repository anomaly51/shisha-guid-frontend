import styled from 'styled-components'
import tw from 'twin.macro'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  $fullWidth?: boolean
}

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $variant?: ButtonProps['variant']
  $size?: ButtonProps['size']
  $fullWidth?: boolean
}

const StyledButton = styled.button<StyledButtonProps>(({ $variant = 'primary', $size = 'md', $fullWidth }) => [
  tw`font-medium rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-1.5 select-none whitespace-nowrap`,
  `--button-icon-size: 14px;`,
  $fullWidth && tw`w-full`,
  $size === 'sm' && [tw`px-2.5 py-1.5 text-xs`, `--button-icon-size: 12px;`],
  $size === 'md' && [tw`px-3.5 py-2 text-[13px]`, `--button-icon-size: 13px;`],
  $size === 'lg' && [tw`px-4 py-2 text-sm`, `--button-icon-size: 14px;`],
  $size === 'xl' && [tw`px-5 py-2.5 text-[14px]`, `--button-icon-size: 15px;`],
  $variant === 'primary' && tw`bg-[rgb(var(--color-accent))] text-white hover:bg-[rgb(var(--color-accent-hover))] active:bg-[rgb(var(--color-accent))] active:scale-[0.98]`,
  $variant === 'secondary' && tw`bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-subtle))] active:bg-[rgb(var(--color-surface-subtle))] active:scale-[0.98]`,
  $variant === 'danger' && tw`bg-[rgb(var(--color-surface))] text-[rgb(var(--color-danger))] border border-[rgb(var(--color-danger-border))] hover:bg-[rgb(var(--color-danger-surface))] active:bg-[rgb(var(--color-surface))]`,
  $variant === 'ghost' && tw`bg-transparent text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-subtle))] active:bg-transparent`,
  $variant === 'outline' && tw`bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border-strong))] hover:bg-[rgb(var(--color-accent-muted))] hover:border-[rgb(var(--color-accent))] active:bg-[rgb(var(--color-surface))]`,
  $variant === 'subtle' && tw`bg-transparent text-[rgb(var(--color-text-subtle))] hover:text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-subtle))] active:bg-transparent`,
  `& > svg[aria-hidden="true"] {
    width: var(--button-icon-size);
    height: var(--button-icon-size);
  }`,
  `&:disabled, [disabled] { ${tw`opacity-40 cursor-not-allowed pointer-events-none`} }`,
])

export const Button = ({ variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps) => (
  <StyledButton $variant={variant} $size={size} type={type} {...props} />
)
