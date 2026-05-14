import React from 'react'
import tw, { styled } from 'twin.macro'

const Wrapper = tw.div`flex flex-col gap-1`

const Label = tw.label`text-xs font-bold text-[#1A1A1B] uppercase tracking-wider`

const StyledInput = styled.input`
  ${tw`px-3 py-2 bg-white border border-[#CCC] rounded-[4px] text-sm text-[#1A1A1B] transition-colors duration-200 outline-none`}
  &:focus { ${tw`border-[#0079D3]`} }
  &::placeholder { ${tw`text-[#787C7E]`} }
`

const StyledTextarea = styled.textarea`
  ${tw`px-3 py-2 bg-white border border-[#CCC] rounded-[4px] text-sm text-[#1A1A1B] transition-colors duration-200 outline-none resize-y`}
  &:focus { ${tw`border-[#0079D3]`} }
  &::placeholder { ${tw`text-[#787C7E]`} }
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
  ${tw`px-3 py-2 bg-white border border-[#CCC] rounded-[4px] text-sm text-[#1A1A1B] outline-none transition-colors duration-200`}
  &:focus { ${tw`border-[#0079D3]`} }
`
