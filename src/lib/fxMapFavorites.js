// src/lib/fxMapFavorites.js
// Firestore CRUD for map favorites: save start/dest per user
import { db, auth } from '../firebase'
import {
  collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore'

function assertAuthed() {
  const u = auth.currentUser
  if (!u) throw new Error('Please log in to use favorites')
  return u
}

// Save a favorite point (type: 'start' | 'dest')
export async function saveFavoritePoint(type, place) {
  const u = assertAuthed()
  const col = collection(db, 'users', u.uid, 'favorites')
  // use timestamp id to avoid overwrite
  const id = `${type}_${Date.now()}`
  await setDoc(doc(col, id), {
    type,                               // 'start' | 'dest'
    name: place?.place_name || place?.text || 'Unnamed',
    coords: {
      lng: Number(place?.center?.[0] ?? place?.lng),
      lat: Number(place?.center?.[1] ?? place?.lat),
    },
    createdAt: serverTimestamp()
  })
  return id
}

// Optional: list favorites (ordered)
export async function listFavorites() {
  const u = assertAuthed()
  const col = collection(db, 'users', u.uid, 'favorites')
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}