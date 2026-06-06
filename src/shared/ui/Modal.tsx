import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'
import { CloseIcon } from './Icons'

const Overlay = styled.div`
  ${tw`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4`}
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Content = styled.div`
  ${tw`bg-[rgb(var(--color-surface))] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full max-h-[90vh] overflow-y-auto`}
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => {
      const target = contentRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      target?.focus()
    })
    return () => {
      window.cancelAnimationFrame(frame)
      previousActive?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <Overlay onClick={onClose}>
      <Content
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <div tw="flex items-center justify-between px-5 py-3.5 border-b border-[rgb(var(--color-border-muted))]">
            <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              tw="w-8 h-8 flex items-center justify-center rounded-lg text-[rgb(var(--color-text-subtle))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-muted))] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div tw="p-5">{children}</div>
      </Content>
    </Overlay>
  )
}
