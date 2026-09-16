export type AppPath = '/' | '/map' | '/sky'

export function parseAppPath(pathname: string): AppPath {
  if (pathname === '/map' || pathname === '/sky') {
    return pathname
  }

  return '/'
}
