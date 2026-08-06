import { SessionManager } from './sessionManager'

/** Admin / owner — matches salon enroll admin rule. */
export function isPosAdmin(): boolean {
  const roleId = Number(SessionManager.roleId || 0)
  if (roleId === 1) return true
  const roleName = String(SessionManager.roleName || '')
    .trim()
    .toLowerCase()
  if (!roleName) return false
  return roleName.includes('admin') || roleName === 'owner'
}
