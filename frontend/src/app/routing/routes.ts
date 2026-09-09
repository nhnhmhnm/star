export type AppPath = '/' | '/sky'

export function parseAppPath(pathname: string): AppPath {
  return pathname === '/sky' ? '/sky' : '/'
}
