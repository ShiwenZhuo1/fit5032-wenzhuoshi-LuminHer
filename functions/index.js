const { onRequest } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')

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

// ✅ API: /listUsers (原始写法，已带 cors)
exports.listUsers = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
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
})