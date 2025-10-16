const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const admin = require('firebase-admin')
const cors = require('cors')
const sgMail = require('@sendgrid/mail')

admin.initializeApp()
const corsHandler = cors({ origin: true })  // 允许所有来源，或可指定为：origin: 'http://localhost:5173'

function requireApiKey(req) {
  const correctKey = process.env.API_KEY
  const clientKey = req.get('x-api-key') || req.query.key
  if (!clientKey || clientKey !== correctKey) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
}

// ✅ API: /apiMetrics
exports.apiMetrics = onRequest(
  { region: 'australia-southeast1', secrets: ['API_KEY'] },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
        requireApiKey(req)
        const auth = getAuth()
        const users = await auth.listUsers()
        const total = users.users.length
        const admins = users.users.filter(u => u.customClaims?.admin).length
        res.json({
          ok: true,
          metrics: {
            users_total: total,
            admins_total: admins,
            ts: Date.now()
          }
        })
      } catch (err) {
        res.status(err.status || 500).json({ ok: false, error: err.message })
      }
    })
  }
)

// ✅ API: /apiProgress
exports.apiProgress = onRequest(
  { region: 'australia-southeast1', secrets: ['API_KEY'] },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
        requireApiKey(req)
        const uid = req.query.uid
        if (!uid) throw new Error('Missing uid')

        const db = getFirestore()
        const snap = await db.collection('users').doc(uid).collection('progress').get()
        const items = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        res.json({ ok: true, uid, items })
      } catch (err) {
        res.status(err.status || 500).json({ ok: false, error: err.message })
      }
    })
  }
)

// ✅ API: /apiHealth
exports.apiHealth = onRequest(
  { region: 'australia-southeast1' },
  (req, res) => {
    corsHandler(req, res, () => {
      res.json({
        ok: true,
        service: 'luminher-api',
        region: process.env.FUNCTION_REGION || 'australia-southeast1',
        timestamp: new Date().toISOString()
      })
    })
  }
)

// ✅ API: /apiListUsersLegacy (原始写法，已带 cors) 保留以兼容旧调用（若有）
exports.apiListUsersLegacy = onRequest(
  { region: 'australia-southeast1' },
  (req, res) => {
  corsHandler(req, res, async () => {
    try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
      const listUsersResult = await admin.auth().listUsers(1000)
      const users = listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customClaims: userRecord.customClaims || {},
        metadata: userRecord.metadata
      }))
      res.status(200).json({ data: { users } })
    } catch (error) {
      console.error('Error listing users:', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })
  }
)

// ---------- Firebase Callable (used by src/lib/fxAdmin.js) ----------
// v2 onCall with region option
exports.ensureAdminClaim = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const user = await getAuth().getUser(uid)
  const email = user.email || ''
  const isAdminEmail = email.endsWith('@admin.com')
  const current = user.customClaims || {}
  if (isAdminEmail && !current.admin) {
    await getAuth().setCustomUserClaims(uid, { ...current, admin: true })
  }
  return { ok: true, admin: isAdminEmail || !!current.admin }
})

// listUsers (callable): returns basic info for client-side table
exports.listUsers = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const caller = await getAuth().getUser(uid)
  if (!caller.customClaims?.admin) throw new HttpsError('permission-denied', 'Admin only')
  const pageSize = Math.min(Number(request.data?.pageSize) || 100, 1000)
  const list = await getAuth().listUsers(pageSize)
  const users = list.users.map(u => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    admin: !!u.customClaims?.admin,
    createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime).getTime() : null,
    lastSignIn: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).getTime() : null,
  }))
  return { users }
})

exports.createUser = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const caller = await getAuth().getUser(uid)
  if (!caller.customClaims?.admin) throw new HttpsError('permission-denied', 'Admin only')
  const { email, password, displayName, admin: makeAdmin } = request.data || {}
  if (!email || !password) throw new HttpsError('invalid-argument', 'Email and password required')
  const created = await getAuth().createUser({ email, password, displayName })
  if (makeAdmin) await getAuth().setCustomUserClaims(created.uid, { admin: true })
  return { uid: created.uid }
})

exports.deleteUser = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const caller = await getAuth().getUser(uid)
  if (!caller.customClaims?.admin) throw new HttpsError('permission-denied', 'Admin only')
  const target = request.data?.uid
  if (!target) throw new HttpsError('invalid-argument', 'uid required')
  await getAuth().deleteUser(target)
  return { ok: true }
})

exports.setUserRole = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const caller = await getAuth().getUser(uid)
  if (!caller.customClaims?.admin) throw new HttpsError('permission-denied', 'Admin only')
  const target = request.data?.uid
  const adminFlag = !!request.data?.admin
  if (!target) throw new HttpsError('invalid-argument', 'uid required')
  const targetUser = await getAuth().getUser(target)
  const current = targetUser.customClaims || {}
  await getAuth().setCustomUserClaims(target, { ...current, admin: adminFlag })
  return { ok: true }
})

exports.generateResetLink = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required')
  const caller = await getAuth().getUser(uid)
  if (!caller.customClaims?.admin) throw new HttpsError('permission-denied', 'Admin only')
  const email = request.data?.email
  if (!email) throw new HttpsError('invalid-argument', 'email required')
  const link = await getAuth().generatePasswordResetLink(email)
  return { link }
})

// ---------- New API: /apiDailySignups (last 30 days) ----------
exports.apiDailySignups = onRequest(
  { region: 'australia-southeast1', secrets: ['API_KEY'] },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
        requireApiKey(req)
        const days = 30
        const end = new Date()
        const start = new Date(end)
        start.setUTCDate(end.getUTCDate() - (days - 1))

        // Init buckets
        const buckets = {}
        for (let d = 0; d < days; d++) {
          const dt = new Date(start)
          dt.setUTCDate(start.getUTCDate() + d)
          const key = dt.toISOString().slice(0, 10) // YYYY-MM-DD
          buckets[key] = 0
        }

        // List users (up to 1000) and bucket by creation date (UTC)
        const auth = getAuth()
        let pageToken
        do {
          const resp = await auth.listUsers(1000, pageToken)
          resp.users.forEach(u => {
            const ts = u.metadata?.creationTime ? new Date(u.metadata.creationTime) : null
            if (!ts) return
            const key = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate())).toISOString().slice(0, 10)
            if (key in buckets) buckets[key]++
          })
          pageToken = resp.pageToken
        } while (pageToken)

        const series = Object.keys(buckets).sort().map(k => ({ date: k, count: buckets[k] }))
        res.json({ ok: true, range: { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }, series })
      } catch (err) {
        res.status(err.status || 500).json({ ok: false, error: err.message })
      }
    })
  }
)

// ✅ API: /apiSendEmail — send email to selected registered users (by uid) via SendGrid
exports.apiSendEmail = onRequest(
  { region: 'australia-southeast1', secrets: ['API_KEY', 'SENDGRID_API_KEY'] },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
        requireApiKey(req)
        if (req.method !== 'POST') {
          res.status(405).json({ ok: false, error: 'Method Not Allowed' })
          return
        }

        const { uids, subject, html, text, from, attachments } = req.body || {}
        if (!Array.isArray(uids) || uids.length === 0) throw new Error('Missing recipients')
        if (!subject) throw new Error('Missing subject')
        if (!html && !text) throw new Error('Missing content (html or text)')

        // Resolve uids to emails and ensure all exist
        const auth = getAuth()
        const users = await Promise.all(
          uids.map(async (uid) => {
            const ur = await auth.getUser(uid)
            return { uid: ur.uid, email: ur.email }
          })
        )

        const recipients = users.map(u => u.email).filter(Boolean)
        if (recipients.length === 0) throw new Error('No valid recipient emails')

        // Configure SendGrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)

        const msg = {
          to: recipients,
          from: from || 'no-reply@luminher.app', // TODO: set to a verified sender in SendGrid
          subject,
          text: text || undefined,
          html: html || undefined,
          attachments: Array.isArray(attachments) ? attachments.map(a => ({
            filename: a.filename,
            type: a.type || 'application/octet-stream',
            content: a.content, // base64 string
            disposition: 'attachment'
          })) : undefined,
        }

        // Send as single API call (SendGrid will send to each recipient)
        await sgMail.sendMultiple(msg)

        res.json({ ok: true, sent: recipients.length })
      } catch (err) {
        console.error('apiSendEmail error:', err)
        res.status(err.status || 500).json({ ok: false, error: err.message || 'send failed' })
      }
    })
  }
)

// ✅ API: /apiGemini — server-side proxy to Google Generative Language API to avoid CORS and protect key
exports.apiGemini = onRequest(
  { region: 'australia-southeast1', secrets: ['API_KEY', 'GEMINI_API_KEY'] },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return }
        requireApiKey(req)
        if (req.method !== 'POST') { res.status(405).json({ ok:false, error:'Method Not Allowed' }); return }

        const model = req.query.model || 'models/gemini-2.0-flash-001'
        const apiVer = req.query.v || 'v1beta'
        const url = `https://generativelanguage.googleapis.com/${apiVer}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`

        const body = req.body && Object.keys(req.body).length ? req.body : { contents: [] }
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const text = await r.text()
        res.status(r.status).type('application/json').send(text)
      } catch (err) {
        console.error('apiGemini error:', err)
        res.status(500).json({ ok:false, error: err?.message || 'gemini failed' })
      }
    })
  }
)