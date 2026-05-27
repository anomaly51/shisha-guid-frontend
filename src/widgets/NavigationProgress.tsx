import { useEffect, useRef, useState } from 'react'
import { useSelector, useStore } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { prefetchRouteData } from '../app/prefetch'
import type { AppStore } from '../app/store'

const Bar = styled.div<{ $visible: boolean; $done: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 2px;
  width: 100%;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 160ms ease;

  &::before {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $done }) => ($done ? '100%' : '72%')};
    background: rgb(var(--color-accent));
    box-shadow: 0 0 10px rgb(var(--color-accent) / 0.35);
    transform-origin: left center;
    transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }
`

const isInternalLink = (anchor: HTMLAnchorElement) => {
  if (!anchor.href || anchor.target || anchor.hasAttribute('download')) return false
  return anchor.origin === window.location.origin
}

export const NavigationProgress = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const store = useStore() as AppStore
  const [visible, setVisible] = useState(false)
  const [done, setDone] = useState(false)
  const hideTimer = useRef<number | undefined>(undefined)
  const hasPendingApiRequest = useSelector((state: any) => {
    const apiState = state.api
    if (!apiState) return false
    return [...Object.values(apiState.queries || {}), ...Object.values(apiState.mutations || {})]
      .some((entry: any) => entry?.status === 'pending')
  })

  useEffect(() => {
    const handleClick = async (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target instanceof Element ? event.target.closest('a') : null
      if (!(target instanceof HTMLAnchorElement) || !isInternalLink(target)) return

      const targetUrl = new URL(target.href)
      const currentUrl = new URL(window.location.href)
      const targetRoute = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
      const currentRoute = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      const targetPage = `${targetUrl.pathname}${targetUrl.search}`
      const currentPage = `${currentUrl.pathname}${currentUrl.search}`

      if (targetRoute === currentRoute) return
      if (targetPage === currentPage && targetUrl.hash) return

      event.preventDefault()
      window.clearTimeout(hideTimer.current)
      setDone(false)
      setVisible(true)

      try {
        await prefetchRouteData(store, targetRoute)
        navigate(targetRoute)
      } finally {
        setDone(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [navigate, store])

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => {
      setVisible(false)
      setDone(false)
    }, 260)

    return () => window.clearTimeout(hideTimer.current)
  }, [location.pathname, location.search])

  useEffect(() => {
    window.clearTimeout(hideTimer.current)

    if (hasPendingApiRequest) {
      setDone(false)
      setVisible(true)
      return
    }

    setDone(true)
    hideTimer.current = window.setTimeout(() => {
      setVisible(false)
      setDone(false)
    }, 260)

    return () => window.clearTimeout(hideTimer.current)
  }, [hasPendingApiRequest])

  return <Bar $visible={visible} $done={done} aria-hidden />
}
