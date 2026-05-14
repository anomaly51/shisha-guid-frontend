import React, { useState } from 'react'
import { Modal } from '../shared/ui/Modal'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { useGoogleLoginMutation } from '../shared/api'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [googleLogin, { isLoading }] = useGoogleLoginMutation()
  const [error, setError] = useState('')

  const handleGoogleLogin = () => {
    const clientId = '645750411604-n2edc8gq4grmln17spaousvvgolrrr94.apps.googleusercontent.com'
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
        const result = await googleLogin({ code, client_id: clientId, redirect_uri: redirectUri }).unwrap()
        localStorage.setItem('token', result.access_token)
        window.location.reload()
      } catch {
        setError('Login failed. Please try again.')
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
    <Modal open={open} onClose={onClose} title="Log In">
      <div tw="flex flex-col gap-4">
        <p tw="text-sm text-[#787C7E]">
          Sign in with your Google account to create and share your shisha setups.
        </p>
        {error && <p tw="text-red-500 text-sm">{error}</p>}
        <Button variant="primary" size="lg" $fullWidth onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>
      </div>
    </Modal>
  )
}
