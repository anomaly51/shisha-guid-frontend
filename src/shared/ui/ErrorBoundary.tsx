import { Component, type ErrorInfo, type ReactNode } from 'react'
import 'twin.macro'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI boundary caught error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div tw="rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-6 text-center text-sm font-semibold text-[rgb(var(--color-text-muted))]">
          Не удалось отобразить этот блок.
        </div>
      )
    }

    return this.props.children
  }
}
