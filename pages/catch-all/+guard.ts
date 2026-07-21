import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import { isKnownAppPath } from '../../src/app/routePaths'

export const guard = (pageContext: PageContextServer) => {
  if (!isKnownAppPath(pageContext.urlOriginal)) {
    throw render(404)
  }
}
