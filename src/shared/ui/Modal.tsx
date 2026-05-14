import React, { useEffect } from 'react'
import tw from 'twin.macro'

const Overlay = tw.div`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4`
const Content = tw.div`bg-white rounded-[4px] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto`

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <Overlay onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        {title && (
          <div tw="flex items-center justify-between px-4 py-3 border-b border-[#EDEFF1]">
            <h2 tw="text-base font-bold text-[#1A1A1B]">{title}</h2>
            <button onClick={onClose} tw="text-[#878A8C] hover:text-[#1A1A1B] text-lg leading-none px-1">
              ✕
            </button>
          </div>
        )}
        <div tw="p-4">{children}</div>
      </Content>
    </Overlay>
  )
}
