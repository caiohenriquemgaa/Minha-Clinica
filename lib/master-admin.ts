export const MASTER_ADMIN_SESSION_COOKIE = "master_admin_session"
export const MASTER_ADMIN_SESSION_VALUE = "verified"

export function getMasterAdminEmails() {
  return (process.env.MASTER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getMasterAdminPassword() {
  return process.env.MASTER_ADMIN_PASSWORD || ""
}

export function isMasterAdmin(email?: string | null) {
  if (!email) return false
  const allowed = getMasterAdminEmails()
  return allowed.includes(email.toLowerCase())
}

export function isMasterAdminPasswordValid(password: string) {
  if (!password) return false
  const expected = getMasterAdminPassword()
  if (!expected) return false
  return password === expected
}

export function hasMasterAdminSession(cookieValue?: string | null) {
  if (!cookieValue) return false
  return cookieValue === MASTER_ADMIN_SESSION_VALUE
}
