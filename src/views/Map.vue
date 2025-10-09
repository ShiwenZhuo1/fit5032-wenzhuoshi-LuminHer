<script setup>
import { onMounted, ref, computed, watchEffect } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { auth, db } from '../firebase'
import {
  addDoc, collection, query, where, orderBy,
  getDocs, serverTimestamp, deleteDoc, doc
} from 'firebase/firestore'

// If you do NOT import these CSS files globally, uncomment both lines:
// import 'mapbox-gl/dist/mapbox-gl.css'
// import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

// ===== Mapbox token =====
mapboxgl.accessToken = 'pk.eyJ1Ijoic3d6MjciLCJhIjoiY21naHQyc2p2MDFvaTJrcHI4YzFza2Z3cSJ9.pfpz659HcIvoubpVMoWe6Q'

// ===== Refs =====
const mapEl = ref(null)
const startBox = ref(null)
const endBox = ref(null)

let map
let startMarker = null
let endMarker = null
const routeLayerId = 'route-line'
const routeSourceId = 'route-source'

// travel profile: driving / walking / cycling
const profile = ref('driving')

// route stats
const distanceKm = ref(null) // km
const durationMin = ref(null) // minutes

// favorites (saved places)
const favorites = ref([]) // [{id?, label, lng, lat, ownerUid?}]
const favLoading = ref(false)
const favErr = ref('')

// recent search history (localStorage only)
const history = ref([]) // [{label, lng, lat}]
const HISTORY_KEY = 'map_recent_places_v1'

// helpers for UI
const canSaveStart = computed(() => !!startMarker)
const canSaveEnd = computed(() => !!endMarker)
const isAuthed = computed(() => !!auth.currentUser)

// ===== Local helpers =====
function clearRoute() {
  if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId)
  if (map.getSource(routeSourceId)) map.removeSource(routeSourceId)
  distanceKm.value = null
  durationMin.value = null
}

function fitBounds(a, b) {
  const bounds = new mapboxgl.LngLatBounds()
  bounds.extend(a)
  bounds.extend(b)
  map.fitBounds(bounds, { padding: 60, duration: 800 })
}

function setStatsFromRoute(route) {
  if (!route) return
  // meters -> km, seconds -> minutes
  distanceKm.value = route.distance ? (route.distance / 1000) : null
  durationMin.value = route.duration ? (route.duration / 60) : null
}

async function drawRoute(a, b) {
  clearRoute()
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile.value}/${a[0]},${a[1]};${b[0]},${b[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('Directions error:', await res.text())
    alert('Failed to fetch route. Please try again.')
    return
  }
  const data = await res.json()
  const route = data?.routes?.[0]
  const geom = route?.geometry
  if (!geom) return

  map.addSource(routeSourceId, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: geom }
  })
  map.addLayer({
    id: routeLayerId,
    type: 'line',
    source: routeSourceId,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#0d6efd', 'line-width': 5 }
  })
  setStatsFromRoute(route)
}

function makeGeocoder(placeholder, onPicked) {
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl,
    marker: false,
    placeholder,
  })
  geocoder.on('result', (e) => {
    const coord = e.result.center
    const label = e.result.place_name || e.result.text || 'Location'
    onPicked(coord, label)
    pushHistory({ label, lng: coord[0], lat: coord[1] })
  })
  geocoder.on('clear', () => onPicked(null, null))
  return geocoder
}

// ===== Favorites: Firestore (authed) or localStorage (guest) =====
const FAV_KEY = 'map_favorites_guest_v1'

async function loadFavorites() {
  favErr.value = ''
  favLoading.value = true
  try {
    if (isAuthed.value && db) {
      const uid = auth.currentUser.uid
      const q = query(
        collection(db, 'places'),
        where('ownerUid', '==', uid),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      favorites.value = snap.docs.map(d => ({
        id: d.id,
        label: d.data().label,
        lng: d.data().lng,
        lat: d.data().lat,
        ownerUid: d.data().ownerUid
      }))
    } else {
      const raw = localStorage.getItem(FAV_KEY)
      favorites.value = raw ? JSON.parse(raw) : []
    }
  } catch (e) {
    favErr.value = e?.message || 'Failed to load favorites'
  } finally {
    favLoading.value = false
  }
}

async function saveFavorite(label, lngLat) {
  if (!label || !lngLat) return
  const item = { label, lng: lngLat[0], lat: lngLat[1] }
  try {
    if (isAuthed.value && db) {
      const uid = auth.currentUser.uid
      await addDoc(collection(db, 'places'), {
        ...item,
        ownerUid: uid,
        createdAt: serverTimestamp(),
      })
    } else {
      const list = [...favorites.value]
      list.unshift(item)
      // keep last 20
      favorites.value = list.slice(0, 20)
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
    }
    await loadFavorites()
  } catch (e) {
    alert(e?.message || 'Failed to save place')
  }
}

async function removeFavorite(fav) {
  try {
    if (fav.id && isAuthed.value && db) {
      await deleteDoc(doc(db, 'places', fav.id))
      await loadFavorites()
    } else {
      favorites.value = favorites.value.filter(
        x => !(x.label === fav.label && x.lng === fav.lng && x.lat === fav.lat)
      )
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
    }
  } catch (e) {
    alert(e?.message || 'Failed to delete place')
  }
}

function applyFavoriteAsStart(fav) {
  if (startMarker) startMarker.remove()
  startMarker = new mapboxgl.Marker({ color: 'green' })
    .setLngLat([fav.lng, fav.lat])
    .setPopup(new mapboxgl.Popup().setText(fav.label))
    .addTo(map)
  map.flyTo({ center: [fav.lng, fav.lat], zoom: 13, speed: 1.2 })
  if (endMarker) drawRoute(startMarker.getLngLat().toArray(), endMarker.getLngLat().toArray())
}
function applyFavoriteAsEnd(fav) {
  if (endMarker) endMarker.remove()
  endMarker = new mapboxgl.Marker({ color: 'red' })
    .setLngLat([fav.lng, fav.lat])
    .setPopup(new mapboxgl.Popup().setText(fav.label))
    .addTo(map)
  map.flyTo({ center: [fav.lng, fav.lat], zoom: 13, speed: 1.2 })
  if (startMarker) {
    drawRoute(startMarker.getLngLat().toArray(), endMarker.getLngLat().toArray())
    fitBounds(startMarker.getLngLat().toArray(), [fav.lng, fav.lat])
  }
}

// ===== Recent History (localStorage only) =====
function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY)
  history.value = raw ? JSON.parse(raw) : []
}
function pushHistory(item) {
  const list = [item, ...history.value].filter(Boolean)
  // remove duplicates by label+lng+lat
  const key = (x) => `${x.label}|${x.lng}|${x.lat}`
  const dedup = []
  const seen = new Set()
  for (const x of list) {
    const k = key(x)
    if (!seen.has(k)) { seen.add(k); dedup.push(x) }
  }
  history.value = dedup.slice(0, 8)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}
function applyHistory(h, as) {
  const fav = { label: h.label, lng: h.lng, lat: h.lat }
  as === 'start' ? applyFavoriteAsStart(fav) : applyFavoriteAsEnd(fav)
}

// ===== Lifecycle =====
onMounted(async () => {
  // Create map
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // Geocoders
  const startGeo = makeGeocoder('Search start…', (coord, label) => {
    if (startMarker) { startMarker.remove(); startMarker = null }
    if (coord) {
      startMarker = new mapboxgl.Marker({ color: 'green' })
        .setLngLat(coord)
        .setPopup(new mapboxgl.Popup().setText(label || 'Start'))
        .addTo(map)
      map.flyTo({ center: coord, zoom: 13, speed: 1.2 })
    }
    if (coord && endMarker) {
      drawRoute(coord, endMarker.getLngLat().toArray())
      fitBounds(coord, endMarker.getLngLat().toArray())
    }
    if (!coord) clearRoute()
  })
  startGeo.addTo(startBox.value)

  const endGeo = makeGeocoder('Search destination…', (coord, label) => {
    if (endMarker) { endMarker.remove(); endMarker = null }
    if (coord) {
      endMarker = new mapboxgl.Marker({ color: 'red' })
        .setLngLat(coord)
        .setPopup(new mapboxgl.Popup().setText(label || 'Destination'))
        .addTo(map)
      map.flyTo({ center: coord, zoom: 13, speed: 1.2 })
    }
    if (coord && startMarker) {
      const a = startMarker.getLngLat().toArray()
      drawRoute(a, coord)
      fitBounds(a, coord)
    }
    if (!coord) clearRoute()
  })
  endGeo.addTo(endBox.value)

  loadFavorites()
  loadHistory()
})

// When profile changes, re-route if both markers exist
watchEffect(async () => {
  if (startMarker && endMarker && map) {
    const a = startMarker.getLngLat().toArray()
    const b = endMarker.getLngLat().toArray()
    await drawRoute(a, b)
  }
})
</script>

<template>
  <div class="container py-4">
    <h2 class="fw-bold mb-2">Interactive Map</h2>
    <p class="text-muted mb-3">Search locations, save favorites, and generate routes.</p>

    <!-- Controls -->
    <div class="row g-2 align-items-center mb-2">
      <div class="col-12 col-md-6">
        <div ref="startBox"></div>
      </div>
      <div class="col-12 col-md-6">
        <div ref="endBox"></div>
      </div>

      <div class="col-12 d-flex flex-wrap gap-3 align-items-center mt-2">
        <div class="d-flex align-items-center gap-2">
          <label class="form-label m-0">Mode</label>
          <select class="form-select form-select-sm" v-model="profile" style="width:180px">
            <option value="driving">Driving</option>
            <option value="walking">Walking</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>

        <div class="vr d-none d-md-block"></div>

        <div class="small text-muted">
          <span v-if="distanceKm !== null">🚗 Distance: <strong>{{ distanceKm.toFixed(2) }} km</strong></span>
          <span v-if="durationMin !== null" class="ms-3">⏱ Duration: <strong>{{ Math.round(durationMin) }} min</strong></span>
          <span v-if="distanceKm === null && durationMin === null">Pick start and destination to see distance & time.</span>
        </div>

        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" :disabled="!canSaveStart" @click="saveFavorite('Start', startMarker?.getLngLat()?.toArray?.())">
            Save Start
          </button>
          <button class="btn btn-outline-danger btn-sm" :disabled="!canSaveEnd" @click="saveFavorite('Destination', endMarker?.getLngLat()?.toArray?.())">
            Save Destination
          </button>
        </div>
      </div>
    </div>

    <!-- Map -->
    <div ref="mapEl" class="shadow-sm rounded" style="height:560px; width:100%; overflow:hidden;"></div>

    <!-- Panels -->
    <div class="row g-3 mt-3">
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold d-flex align-items-center justify-content-between">
              <span>Favorites</span>
              <small v-if="isAuthed" class="text-muted">Synced with your account</small>
              <small v-else class="text-muted">Saved locally</small>
            </h6>

            <p v-if="favErr" class="text-danger small mb-2">{{ favErr }}</p>
            <div v-if="favLoading" class="text-muted small">Loading…</div>

            <ul class="list-group list-group-flush">
              <li v-for="f in favorites" :key="f.id || f.label + f.lng + f.lat" class="list-group-item d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-semibold">{{ f.label }}</div>
                  <small class="text-muted">{{ f.lng.toFixed(5) }}, {{ f.lat.toFixed(5) }}</small>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-success" @click="applyFavoriteAsStart(f)">Use as Start</button>
                  <button class="btn btn-outline-danger"  @click="applyFavoriteAsEnd(f)">Use as End</button>
                  <button class="btn btn-outline-secondary" @click="removeFavorite(f)">Remove</button>
                </div>
              </li>
              <li v-if="!favorites.length" class="list-group-item text-muted small">No favorites yet. Pick a point and click “Save”.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold">Recent searches</h6>
            <ul class="list-group list-group-flush">
              <li v-for="h in history" :key="h.label + h.lng + h.lat" class="list-group-item d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-semibold">{{ h.label }}</div>
                  <small class="text-muted">{{ h.lng.toFixed(5) }}, {{ h.lat.toFixed(5) }}</small>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-success" @click="applyHistory(h, 'start')">Use as Start</button>
                  <button class="btn btn-outline-danger"  @click="applyHistory(h, 'end')">Use as End</button>
                </div>
              </li>
              <li v-if="!history.length" class="list-group-item text-muted small">No searches yet.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 small text-secondary">
      <div>🟢 Search in the left box to set <strong>Start</strong>. 🔴 Search in the right box to set <strong>Destination</strong>.</div>
      <div>➡️ When both are set, a route is generated automatically. Switch "Mode" to change the travel profile.</div>
      <div>🧹 Clearing any box removes the route. Favorites are synced to Firestore when signed-in, or stored locally when not.</div>
    </div>
  </div>
</template>

<style scoped>
/* Keep defaults */
</style>