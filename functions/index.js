// functions/index.js
const { onCall } = require('firebase-functions/v2/https')
const { HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

// Optional: SendGrid for emails (D.2)
// const sgMail = require('@sendgrid/mail')
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)

initializeApp()

// --- helpers ---
function assertIsAdmin(context) {
  const isAuthed = !!context.auth
  const isAdmin = !!context.auth?.token?.admin
  if (!isAuthed) throw new HttpsError('unauthenticated', 'Sign-in required.')
  if (!isAdmin) throw new HttpsError('permission-denied', 'Admin only.')
}

// 1) Promote the caller to admin if their email matches the policy.
//    IMPORTANT: never copy token fields into custom claims; only set { admin: true }.
exports.ensureAdminClaim = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  const email = request.auth?.token?.email || ''
  if (!uid) throw new HttpsError('unauthenticated', 'Sign-in required.')

  const shouldBeAdmin = email.endsWith('@admin.com') // customize your rule here
  const alreadyAdmin = !!request.auth?.token?.admin

  if (shouldBeAdmin && !alreadyAdmin) {
    await getAuth().setCustomUserClaims(uid, { admin: true })
    return { updated: true, admin: true }
  }
  return { updated: false, admin: alreadyAdmin }
})

// 2) List users with pagination (admin only)
exports.listUsers = onCall({ region: 'us-central1' }, async (request) => {
  assertIsAdmin(request)
  const pageToken = request.data?.pageToken || undefined
  const pageSize = Math.min(Number(request.data?.pageSize) || 20, 1000)

  const res = await getAuth().listUsers(pageSize, pageToken)
  const users = res.users.map(u => ({
    uid: u.uid,
    email: u.email || null,
    displayName: u.displayName || null,
    disabled: !!u.disabled,
    admin: !!u.customClaims?.admin,
    createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime).getTime() : null,
    lastSignIn: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).getTime() : null,
  }))
  return { users, nextPageToken: res.pageToken || null }
})

// 3) Create a user (optional admin flag) - admin only
exports.createUser = onCall({ region: 'us-central1' }, async (request) => {
  assertIsAdmin(request)
  const { email, password, displayName, admin } = request.data || {}
  if (!email || !password) throw new HttpsError('invalid-argument', 'email and password required')

  const user = await getAuth().createUser({ email, password, displayName })
  if (admin) await getAuth().setCustomUserClaims(user.uid, { admin: true })
  return { uid: user.uid }
})

// 4) Delete user - admin only
exports.deleteUser = onCall({ region: 'us-central1' }, async (request) => {
  assertIsAdmin(request)
  const { uid } = request.data || {}
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  await getAuth().deleteUser(uid)
  return { ok: true }
})

// 5) Set or unset admin custom claim - admin only
exports.setUserRole = onCall({ region: 'us-central1' }, async (request) => {
  assertIsAdmin(request)
  const { uid, admin } = request.data || {}
  if (!uid || typeof admin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid and admin(boolean) are required')
  }
  const user = await getAuth().getUser(uid)
  const claims = { ...(user.customClaims || {}) }
  claims.admin = admin
  await getAuth().setCustomUserClaims(uid, claims)
  return { ok: true }
})

// 6) Generate password reset link (you can email it via SendGrid) - admin only
exports.generateResetLink = onCall({ region: 'us-central1' }, async (request) => {
  assertIsAdmin(request)
  const { email } = request.data || {}
  if (!email) throw new HttpsError('invalid-argument', 'email is required')

  const link = await getAuth().generatePasswordResetLink(email)

  // Optional: send via SendGrid (uncomment if needed)
  // await sgMail.send({
  //   to: email,
  //   from: 'no-reply@yourdomain.com',
  //   subject: 'Password Reset',
  //   html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
  //   attachments: [] // add attachments to meet D.2 if required
  // })

  return { link }
})