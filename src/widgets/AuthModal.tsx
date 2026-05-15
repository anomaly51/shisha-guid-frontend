import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Modal } from '../shared/ui/Modal'
import { Button } from '../shared/ui/Button'
import { useGoogleLoginMutation } from '../shared/api'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [googleLogin, { isLoading }] = useGoogleLoginMutation()
  const [error, setError] = useState('')
  const { t } = useTranslation()

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = window.location.origin
    const scope = 'openid profile email'
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
    const authWindow = window.open(authUrl, 'Google Login', 'width=600,height=600')

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const { code } = event.data
      if (!code) return
      window.removeEventListener('message', handleMessage)
      authWindow?.close()
      try {
        const result = await googleLogin({ code, redirect_uri: redirectUri }).unwrap()
        localStorage.setItem('token', result.access_token)
        window.location.reload()
      } catch {
        setError(t('auth.loginFailed'))
      }
    }
    window.addEventListener('message', handleMessage)
  }

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && window.opener) {
      window.opener.postMessage({ code }, window.location.origin)
      window.close()
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose} title={t('auth.title')}>
      <div tw="flex flex-col gap-4">
        <p tw="text-[13px] text-[rgb(var(--color-text-muted))] leading-relaxed">
          {t('auth.subtitle')}
        </p>
        {error && (
          <div tw="bg-[rgb(var(--color-danger-surface))] text-[rgb(var(--color-danger))] text-[13px] font-medium px-3 py-2 rounded-lg">{error}</div>
        )}
        <Button variant="primary" size="lg" $fullWidth onClick={handleGoogleLogin} disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? t('auth.signingIn') : t('auth.continueGoogle')}
        </Button>
      </div>
    </Modal>
  )
}
