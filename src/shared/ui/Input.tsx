import React from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'

const Wrapper = tw.div`flex flex-col gap-1`

const Label = tw.label`text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide`

const inputStyles = `
  min-height: 38px;
  &:focus { border-color: rgb(var(--color-accent)); box-shadow: 0 0 0 2px rgb(var(--color-accent) / 0.12); }
  &:disabled { background: rgb(var(--color-surface-muted)); color: rgb(var(--color-text-subtle)); cursor: not-allowed; }
  &:disabled { opacity: 0.5; }
`

const StyledInput = styled.input`
  ${tw`px-3 py-2 bg-[rgb(var(--color-surface))]/95 border border-[rgb(var(--color-border-strong))] rounded-lg text-[13px] text-[rgb(var(--color-text))] transition-all duration-150 outline-none placeholder:text-[rgb(var(--color-text-subtle))] disabled:opacity-50 disabled:cursor-not-allowed`}
  ${inputStyles}
`
const StyledTextarea = styled.textarea`
  ${tw`px-3 py-2 bg-[rgb(var(--color-surface))]/95 border border-[rgb(var(--color-border-strong))] rounded-lg text-[13px] text-[rgb(var(--color-text))] transition-all duration-150 outline-none placeholder:text-[rgb(var(--color-text-subtle))] resize-y leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed`}
  ${inputStyles}
`

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = ({ label, ...props }: InputProps) => (
  <Wrapper>
    {label && <Label>{label}</Label>}
    <StyledInput {...props} />
  </Wrapper>
)

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = ({ label, ...props }: TextareaProps) => (
  <Wrapper>
    {label && <Label>{label}</Label>}
    <StyledTextarea {...props} />
  </Wrapper>
)

export const Select = styled.select`
  ${tw`px-3 py-2 bg-[rgb(var(--color-surface))]/95 border border-[rgb(var(--color-border-strong))] rounded-lg text-[13px] text-[rgb(var(--color-text))] outline-none transition-all duration-150 appearance-none`}
  min-height: 38px;
  &:focus { border-color: rgb(var(--color-accent)); box-shadow: 0 0 0 2px rgb(var(--color-accent) / 0.12); }
`
