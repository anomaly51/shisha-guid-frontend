declare module 'react-dom/server.browser' {
  import type { ReactNode } from 'react'

  export interface ReactReadableStream extends ReadableStream<Uint8Array> {
    allReady: Promise<void>
  }

  export interface RenderToReadableStreamOptions {
    signal?: AbortSignal
    onError?: (error: unknown) => void
  }

  export function renderToReadableStream(
    children: ReactNode,
    options?: RenderToReadableStreamOptions,
  ): Promise<ReactReadableStream>
}
