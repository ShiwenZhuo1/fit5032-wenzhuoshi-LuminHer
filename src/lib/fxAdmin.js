// src/lib/fxAdmin.js
// Cloud Functions client wrappers (callable). The Firebase Web SDK
// automatically sends the current user's ID token, so just call these
// after the user signs in.

import { getFunctions, httpsCallable } from 'firebase/functions'

const REGION = 'us-central1' // change if you deployed elsewhere
const functions = getFunctions(undefined, REGION)

// Promote current signed-in user to admin if email policy matches
export async function ensureAdminClaim() {
  const call = httpsCallable(functions, 'ensureAdminClaim')
  const { data } = await call({})
  return data
}

// List users (admin only)
export async function listUsers(pageToken, pageSize = 20) {
  const call = httpsCallable(functions, 'listUsers')
  const { data } = await call({ pageToken, pageSize })
  return data
}

// Create user (admin only)
export async function createUser({ email, password, displayName, admin }) {
  const call = httpsCallable(functions, 'createUser')
  const { data } = await call({ email, password, displayName, admin })
  return data
}

// Delete user by uid (admin only)
export async function deleteUser(uid) {
  const call = httpsCallable(functions, 'deleteUser')
  const { data } = await call({ uid })
  return data
}

// Set or unset admin role (admin only)
export async function setUserRole(uid, admin) {
  const call = httpsCallable(functions, 'setUserRole')
  const { data } = await call({ uid, admin })
  return data
}

// Generate password reset link (admin only)
export async function generateResetLink(email) {
  const call = httpsCallable(functions, 'generateResetLink')
  const { data } = await call({ email })
  return data
}