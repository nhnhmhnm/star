import { useEffect, useState } from 'react'

import { parseAppPath, type AppPath } from './routes'

export function useRoute(): { path: AppPath } {
  const [path, setPath] = useState<AppPath>(() => parseAppPath(window.location.pathname))

  useEffect(() => {
    const updatePath = () => {
      setPath(parseAppPath(window.location.pathname))
    }

    window.addEventListener('popstate', updatePath)

    return () => {
      window.removeEventListener('popstate', updatePath)
    }
  }, [])

  return { path }
}
