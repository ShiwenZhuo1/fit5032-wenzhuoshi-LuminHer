// src/views/Map.vue
<template>
  <section class="container py-4">
    <h2 class="mb-2">Map Route Planner</h2>
    <p class="text-muted mb-3">
      Search start and destination to generate a route. Switch modes to compare travel options.
    </p>

    <!-- Top controls -->
    <div class="row g-3 align-items-center mb-2">
      <div class="col-12 col-lg-4">
        <div ref="startBox" class="geocoder"></div>
      </div>

      <div class="col-12 col-lg-3 d-flex align-items-center gap-2">
        <label class="me-2 fw-semibold small text-muted">Mode</label>
        <select class="form-select" v-model="mode" @change="onModeChange" style="max-width:200px">
          <option value="driving">Driving</option>
          <option value="walking">Walking</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>

      <div class="col-12 col-lg-4">
        <div ref="endBox" class="geocoder"></div>
      </div>
    </div>

    <!-- Route summary -->
    <div v-if="routeInfo.distanceKm || routeInfo.durationMin" class="alert alert-light border small mb-2">
      <strong>Route:</strong>
      <span v-if="routeInfo.distanceKm">{{ routeInfo.distanceKm.toFixed(2) }} km</span>
      <span v-if="routeInfo.durationMin"> • ~{{ Math.round(routeInfo.durationMin) }} min</span>
      <span class="text-muted"> ({{ modeLabel }})</span>
    </div>

    <!-- Map -->
    <div ref="mapEl" class="mapbox" />

    <!-- Recent searches -->
    <div class="card mt-3">
      <div class="card-body">
        <h6 class="fw-bold mb-2">Recent Searches</h6>
        <p v-if="!recents.length" class="text-muted small mb-2">No recent searches.</p>

        <ul v-else class="list-group small">
          <li
            v-for="(r, i) in recents"
            :key="i"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              {{ r.name }}
              <div class="text-muted">{{ r.center[1].toFixed(5) }}, {{ r.center[0].toFixed(5) }}</div>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-success" @click="useRecentAs('start', r)">Use as Start</button>
              <button class="btn btn-outline-danger" @click="useRecentAs('end', r)">Use as End</button>
            </div>
          </li>
        </ul>

        <small class="text-muted d-block mt-2">Stored locally on this device.</small>
      </div>
    </div>

    <!-- Help -->
    <ul class="small text-muted mt-3 mb-0">
      <li>Search left box for <span class="text-success">Start</span>, right box for <span class="text-danger">Destination</span>.</li>
      <li>When both are set, the route appears automatically.</li>
      <li>Switch “Mode” to change between driving, walking, or cycling.</li>
    </ul>
  </section>
</template>

<script setup>
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

/* Your Mapbox token */
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3d6MjciLCJhIjoiY21naHQyc2p2MDFvaTJrcHI4YzFza2Z3cSJ9.pfpz659HcIvoubpVMoWe6Q'

/* Refs */
const mapEl = ref(null)
const startBox = ref(null)
const endBox = ref(null)

/* State */
let map
let geocoderStart
let geocoderEnd
let startMarker
let endMarker
const startFeature = ref(null)
const endFeature = ref(null)
const mode = ref('driving')
const modeLabel = computed(() => mode.value.charAt(0).toUpperCase() + mode.value.slice(1))
const routeInfo = ref({ distanceKm: 0, durationMin: 0 })

/* Recent searches */
const RECENT_KEY = 'map_recents_v1'
const recents = ref([])

/* --- Local Storage helpers --- */
function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}
function pushRecent(feature) {
  if (!feature?.center) return
  const item = { name: feature.place_name || feature.text || 'Unnamed', center: feature.center }
  const list = loadRecents().filter(r => r.name !== item.name)
  list.unshift(item)
  recents.value = list.slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recents.value))
}

/* --- Map setup --- */
function initMap() {
  mapboxgl.accessToken = MAPBOX_TOKEN
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  geocoderStart = new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl,
    marker: false,
    placeholder: 'Search start…'
  })
  geocoderEnd = new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl,
    marker: false,
    placeholder: 'Search destination…'
  })

  startBox.value.appendChild(geocoderStart.onAdd(map))
  endBox.value.appendChild(geocoderEnd.onAdd(map))

  geocoderStart.on('result', e => {
    startFeature.value = e.result
    addMarker('start', e.result.center)
    pushRecent(e.result)
    updateRoute()
  })
  geocoderEnd.on('result', e => {
    endFeature.value = e.result
    addMarker('end', e.result.center)
    pushRecent(e.result)
    updateRoute()
  })
  geocoderStart.on('clear', () => {
    startFeature.value = null
    removeMarker('start')
    clearRoute()
  })
  geocoderEnd.on('clear', () => {
    endFeature.value = null
    removeMarker('end')
    clearRoute()
  })
}

/* --- Markers --- */
function addMarker(type, coords) {
  const color = type === 'start' ? '#2ecc71' : '#e74c3c'
  const marker = new mapboxgl.Marker({ color }).setLngLat(coords).addTo(map)
  if (type === 'start') {
    if (startMarker) startMarker.remove()
    startMarker = marker
  } else {
    if (endMarker) endMarker.remove()
    endMarker = marker
  }
}
function removeMarker(type) {
  if (type === 'start' && startMarker) { startMarker.remove(); startMarker = null }
  if (type === 'end' && endMarker) { endMarker.remove(); endMarker = null }
}

/* --- Routing --- */
async function updateRoute() {
  if (!startFeature.value || !endFeature.value) return
  const [sLng, sLat] = startFeature.value.center
  const [eLng, eLat] = endFeature.value.center
  const url = `https://api.mapbox.com/directions/v5/mapbox/${mode.value}/${sLng},${sLat};${eLng},${eLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) return

  const geojson = { type: 'Feature', geometry: route.geometry }
  if (map.getSource('route')) map.getSource('route').setData(geojson)
  else {
    map.addSource('route', { type: 'geojson', data: geojson })
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-width': 5, 'line-color': '#1f7aec' }
    })
  }

  routeInfo.value = {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60
  }

  const bounds = new mapboxgl.LngLatBounds()
  route.geometry.coordinates.forEach(c => bounds.extend(c))
  map.fitBounds(bounds, { padding: 60 })
}
function clearRoute() {
  if (!map.getSource('route')) return
  map.removeLayer('route')
  map.removeSource('route')
  routeInfo.value = { distanceKm: 0, durationMin: 0 }
}
function onModeChange() { updateRoute() }

/* --- Use Recent Search --- */
function useRecentAs(which, item) {
  const feature = { place_name: item.name, center: item.center }
  if (which === 'start') {
    startFeature.value = feature
    addMarker('start', feature.center)
    geocoderStart.setInput(item.name)
  } else {
    endFeature.value = feature
    addMarker('end', feature.center)
    geocoderEnd.setInput(item.name)
  }
  updateRoute()
}

/* --- Lifecycle --- */
onMounted(() => {
  recents.value = loadRecents()
  initMap()
})
onBeforeUnmount(() => {
  if (map) map.remove()
})
watch([startFeature, endFeature], () => updateRoute())
</script>

<style scoped>
@import 'mapbox-gl/dist/mapbox-gl.css';
@import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

.mapbox {
  width: 100%;
  height: 520px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 10px 24px rgba(0,0,0,.06);
}

.geocoder :deep(.mapboxgl-ctrl-geocoder) {
  min-width: 100%;
  max-width: 100%;
  border-radius: 10px;
}

:deep(.mapboxgl-ctrl-geocoder--input) {
  height: 40px;
  font-size: 14px;
}
</style>