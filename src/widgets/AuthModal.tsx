import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Modal } from '../shared/ui/Modal'
import { Button } from '../shared/ui/Button'
import { useGoogleLoginMutation } from '../shared/api'
import { setAuthToken } from '../shared/authToken'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

const getLoginErrorMessage = (error: any, fallback: string) => {
  const detail = error?.data?.detail
  if (typeof detail === 'string') {
    if (detail.toLowerCase().includes('banned')) return 'Аккаунт заблокирован. Вход недоступен.'
    if (detail.toLowerCase().includes('verified')) return 'Email Google не подтверждён.'
  }
  return fallback
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [googleLogin, { isLoading }] = useGoogleLoginMutation()
  const [error, setError] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const { t } = useTranslation()
  const handledCodeRef = useRef('')
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)
  const authWindowRef = useRef<Window | null>(null)
  const authWindowPollRef = useRef<number | null>(null)

  const redirectUri = typeof window !== 'undefined' ? window.location.origin : ''

  const clearPopupAuth = useCallback(() => {
    if (authWindowPollRef.current) {
      window.clearInterval(authWindowPollRef.current)
      authWindowPollRef.current = null
    }
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current)
      messageHandlerRef.current = null
    }
    authWindowRef.current = null
    setAuthPending(false)
  }, [])

  const finishGoogleLogin = useCallback(async (code: string) => {
    if (!code || handledCodeRef.current === code) return
    handledCodeRef.current = code
    setAuthPending(true)
    try {
      const result = await googleLogin({ code, redirect_uri: redirectUri }).unwrap()
      setAuthToken(result.access_token, result.refresh_token, result.expires_in)
      sessionStorage.removeItem('google_oauth_state')
      window.location.reload()
    } catch (requestError) {
      handledCodeRef.current = ''
      setError(getLoginErrorMessage(requestError, t('auth.loginFailed')))
      setAuthPending(false)
    }
  }, [googleLogin, redirectUri, t])

  const handleGoogleLogin = () => {
    if (authPending || isLoading) return
    setError('')

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const scope = 'openid profile email'
    const state = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    sessionStorage.setItem('google_oauth_state', state)
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`

    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current)
      messageHandlerRef.current = null
    }
    if (authWindowPollRef.current) {
      window.clearInterval(authWindowPollRef.current)
      authWindowPollRef.current = null
    }

    const shouldUseRedirect = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    if (shouldUseRedirect) {
      window.location.assign(authUrl)
      return
    }

    const authWindow = window.open(authUrl, 'Google Login', 'width=600,height=600')

    if (!authWindow) {
      window.location.assign(authUrl)
      return
    }
    authWindowRef.current = authWindow

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const { code, state } = event.data
      if (!code) return
      if (state && state !== sessionStorage.getItem('google_oauth_state')) return
      clearPopupAuth()
      authWindow.close()
      await finishGoogleLogin(code)
    }
    messageHandlerRef.current = handleMessage
    window.addEventListener('message', handleMessage)
    authWindowPollRef.current = window.setInterval(() => {
      if (!authWindowRef.current || !authWindowRef.current.closed) return
      clearPopupAuth()
    }, 500)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const authError = params.get('error')

    if (authError) {
      setError(t('auth.loginFailed'))
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
      return
    }

    if (!code) return

    if (code && window.opener) {
      window.opener.postMessage({ code, state }, window.location.origin)
      window.close()
      return
    }

    if (state && state !== sessionStorage.getItem('google_oauth_state')) {
      setError(t('auth.loginFailed'))
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
      return
    }

    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
    sessionStorage.removeItem('google_oauth_state')
    void finishGoogleLogin(code)
  }, [finishGoogleLogin, t])

  useEffect(() => () => {
    clearPopupAuth()
  }, [clearPopupAuth])

  useEffect(() => {
    if (open) return
    handledCodeRef.current = ''
    clearPopupAuth()
  }, [clearPopupAuth, open])

  return (
    <Modal open={open} onClose={onClose} title={t('auth.title')}>
      <div tw="flex flex-col gap-4">
        <p tw="text-[13px] text-[rgb(var(--color-text-muted))] leading-relaxed">
          {t('auth.subtitle')}
        </p>
        {error && (
          <div tw="bg-[rgb(var(--color-danger-surface))] text-[rgb(var(--color-danger))] text-[13px] font-medium px-3 py-2 rounded-lg">{error}</div>
        )}
        <Button variant="primary" size="lg" $fullWidth onClick={handleGoogleLogin} disabled={isLoading || authPending}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading || authPending ? t('auth.signingIn') : t('auth.continueGoogle')}
        </Button>
      </div>
    </Modal>
  )
}
