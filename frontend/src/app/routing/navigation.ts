import type { AppPath } from './routes'

export function navigateTo(path: AppPath): void {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path)
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}
