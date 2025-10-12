// src/plans/PlanForm.vue 里
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-1.5-flash-latest' // 或 'gemini-1.5-pro-latest'

async function getPlanAdvice(payload) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  // ✅ 正确的 v1beta 路径 + :generateContent
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

  // ✅ 正确的请求体：contents -> parts -> text
  const prompt = [
    'Please give concise, safe fitness & nutrition advice.',
    `Sex: ${payload?.profile?.sex || '-'}`,
    `Age: ${payload?.profile?.dob ? (new Date().getFullYear() - new Date(payload.profile.dob).getFullYear()) : '-'}`,
    `Height: ${payload?.profile?.height_cm || '-'} cm`,
    `Current: ${payload?.profile?.weight_current_kg || '-'} kg, Goal: ${payload?.profile?.weight_goal_kg || '-'} kg`,
    `Activity: ${payload?.lifestyle?.activity_level || '-'}, Sleep: ${payload?.lifestyle?.sleep_hours || '-'}`,
    `Diet: ${payload?.nutrition?.diet_style || 'Any'}, Avoid: ${(payload?.nutrition?.allergies || []).join(', ') || 'None'}`,
    `Goal: ${payload?.training?.goal || '-'}, Equipment: ${(payload?.training?.equipment || []).join(', ') || 'none'}`
  ].join('\n')

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  // 帮你把 404/400 的具体信息打出来，便于定位
  const text = await res.text()
  if (!res.ok) {
    console.error('Gemini request failed', res.status, res.statusText, text)
    // 把后端返回的 message 显示出来
    let msg = ''
    try { msg = JSON.parse(text)?.error?.message || '' } catch {}
    throw new Error(msg || `${res.status} ${res.statusText}`)
  }

  const data = JSON.parse(text)
  const out =
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  return out.trim()
}