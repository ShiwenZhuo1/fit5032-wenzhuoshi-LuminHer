<template>
  <div class="container my-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Create Plan</h2>

      <!-- Unit toggle -->
      <div class="btn-group btn-group-sm" role="group" aria-label="Units">
        <button
          type="button"
          class="btn"
          :class="units==='metric' ? 'btn-dark' : 'btn-outline-dark'"
          @click="setUnits('metric')"
        >
          Metric (cm / kg)
        </button>
        <button
          type="button"
          class="btn"
          :class="units==='imperial' ? 'btn-dark' : 'btn-outline-dark'"
          @click="setUnits('imperial')"
        >
          Imperial (ft/in / lb)
        </button>
      </div>
    </div>

    <Transition name="fade-slide">
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-4">
          <!-- Step header -->
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <div class="d-flex align-items-center gap-3">
              <span class="badge bg-dark fs-6 circle-badge">{{ step + 1 }}</span>
              <div>
                <div class="fw-bold mb-0">{{ steps[step].title }}</div>
                <small class="text-muted">{{ steps[step].sub }}</small>
              </div>
            </div>
            <div class="flex-grow-1 ms-lg-4" style="min-width:220px;">
              <div class="progress" style="height:6px;">
                <div
                  class="progress-bar"
                  role="progressbar"
                  :style="{ width: progress + '%' }"
                  :aria-valuenow="progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <small class="text-muted d-block mt-1">{{ step + 1 }} / {{ steps.length }}</small>
            </div>
          </div>

          <!-- Step body -->
          <div class="mt-3">
            <!-- 0) Basics -->
            <div v-if="step===0">
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label d-block">Sex <span class="text-danger">*</span></label>
                  <div class="d-flex gap-3">
                    <label class="form-check">
                      <input class="form-check-input" type="radio" value="female" v-model="form.sex" @change="validateSex(true)" />
                      <span class="form-check-label">Female</span>
                    </label>
                    <label class="form-check">
                      <input class="form-check-input" type="radio" value="male" v-model="form.sex" @change="validateSex(true)" />
                      <span class="form-check-label">Male</span>
                    </label>
                    <label class="form-check">
                      <input class="form-check-input" type="radio" value="other" v-model="form.sex" @change="validateSex(true)" />
                      <span class="form-check-label">Other</span>
                    </label>
                  </div>
                  <div v-if="errors.sex" class="invalid-feedback d-block">{{ errors.sex }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Date of birth <span class="text-danger">*</span></label>
                  <input
                    type="date"
                    class="form-control"
                    :class="{'is-invalid': errors.dob}"
                    v-model="form.dob"
                    @change="validateDOB(true)"
                  />
                  <div v-if="age" class="form-text">Age: {{ age }}</div>
                  <div v-if="errors.dob" class="invalid-feedback d-block">{{ errors.dob }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Height <span class="text-danger">*</span></label>
                  <template v-if="units==='metric'">
                    <div class="input-group">
                      <input
                        type="number"
                        min="120"
                        max="210"
                        class="form-control"
                        :class="{'is-invalid': errors.height}"
                        v-model.number="form.height_cm"
                        @input="validateHeight(false)"
                        @blur="validateHeight(true)"
                      />
                      <span class="input-group-text">cm</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="input-group">
                      <input type="number" min="3" max="7" class="form-control" v-model.number="height_ft" @input="syncHeightFromImperial" />
                      <span class="input-group-text">ft</span>
                      <input type="number" min="0" max="11" class="form-control" v-model.number="height_in" @input="syncHeightFromImperial" />
                      <span class="input-group-text">in</span>
                    </div>
                  </template>
                  <div v-if="errors.height" class="invalid-feedback d-block">{{ errors.height }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Current weight <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input
                      type="number"
                      class="form-control"
                      :class="{'is-invalid': errors.wtNow}"
                      v-model.number="weight_current_ui"
                      @input="syncCurrentWeight"
                      @blur="validateWeights(true)"
                    />
                    <span class="input-group-text">{{ units==='metric' ? 'kg' : 'lb' }}</span>
                  </div>
                  <div v-if="errors.wtNow" class="invalid-feedback d-block">{{ errors.wtNow }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Goal weight <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input
                      type="number"
                      class="form-control"
                      :class="{'is-invalid': errors.wtGoal}"
                      v-model.number="weight_goal_ui"
                      @input="syncGoalWeight"
                      @blur="validateWeights(true)"
                    />
                    <span class="input-group-text">{{ units==='metric' ? 'kg' : 'lb' }}</span>
                  </div>
                  <div v-if="errors.wtGoal" class="invalid-feedback d-block">{{ errors.wtGoal }}</div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Target date</label>
                  <input
                    type="date"
                    class="form-control"
                    :class="{'is-invalid': errors.targetDate}"
                    v-model="form.target_date"
                    @change="validateTargetDate(true)"
                  />
                  <div v-if="paceText" class="form-text">{{ paceText }}</div>
                  <div v-if="errors.targetDate" class="invalid-feedback d-block">{{ errors.targetDate }}</div>
                </div>
              </div>
            </div>

            <!-- 1) Activity -->
            <div v-else-if="step===1">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Daily activity level <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{'is-invalid': errors.activity}"
                    v-model="form.activity"
                    @change="validateActivity(true)"
                  >
                    <option value="" disabled>-- Select --</option>
                    <option>Sedentary</option>
                    <option>Light</option>
                    <option>Moderate</option>
                    <option>Active</option>
                    <option>Very Active</option>
                  </select>
                  <div v-if="errors.activity" class="invalid-feedback d-block">{{ errors.activity }}</div>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Workout days/week</label>
                  <input type="number" min="0" max="7" class="form-control" v-model.number="form.workout_days" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Sleep (hrs)</label>
                  <input type="number" min="4" max="12" class="form-control" v-model.number="form.sleep_hours" />
                </div>
                <div class="col-12 col-md-2">
                  <label class="form-label">Stress</label>
                  <select class="form-select" v-model="form.stress">
                    <option value="">--</option>
                    <option>Low</option>
                    <option>Med</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 2) Nutrition -->
            <div v-else-if="step===2">
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label">Diet style</label>
                  <select class="form-select" v-model="form.diet_style">
                    <option value="">-- Any --</option>
                    <option>Balanced</option>
                    <option>High-Protein</option>
                    <option>Mediterranean</option>
                    <option>Vegetarian</option>
                    <option>Vegan</option>
                    <option>Low-Carb</option>
                    <option>Halal</option>
                    <option>Kosher</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="col-12 col-md-8">
                  <label class="form-label">Allergies / avoid (comma separated)</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="e.g., dairy, nuts, alcohol"
                    v-model="allergyInput"
                    @change="syncAllergies"
                  />
                  <div class="form-text">Saved: {{ form.allergies.join(', ') || 'None' }}</div>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Budget per meal</label>
                  <select class="form-select" v-model="form.budget">
                    <option value="">--</option>
                    <option>Free</option>
                    <option>$</option>
                    <option>$$</option>
                    <option>$$$</option>
                  </select>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Cooking time</label>
                  <select class="form-select" v-model="form.cook_time">
                    <option value="">--</option>
                    <option>≤10m</option>
                    <option>≤20m</option>
                    <option>≤30m</option>
                    <option>30m+</option>
                  </select>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Meals/day</label>
                  <input type="number" min="2" max="5" class="form-control" v-model.number="form.meals_per_day" />
                </div>
              </div>
            </div>

            <!-- 3) Training -->
            <div v-else-if="step===3">
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label">Primary goal <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{'is-invalid': errors.goal}"
                    v-model="form.goal"
                    @change="validateGoal(true)"
                  >
                    <option value="" disabled>-- Select --</option>
                    <option>Fat loss</option>
                    <option>Recomp</option>
                    <option>Strength</option>
                  </select>
                  <div v-if="errors.goal" class="invalid-feedback d-block">{{ errors.goal }}</div>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Experience</label>
                  <select class="form-select" v-model="form.experience">
                    <option value="">--</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Location</label>
                  <select class="form-select" v-model="form.location">
                    <option value="">--</option>
                    <option>Gym</option>
                    <option>Home</option>
                    <option>Outdoor</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label">Available equipment (multi)</label>
                  <div class="d-flex flex-wrap gap-3">
                    <label v-for="eq in equipmentOptions" :key="eq" class="form-check">
                      <input type="checkbox" class="form-check-input" :value="eq" v-model="form.equipment" />
                      <span class="form-check-label">{{ eq }}</span>
                    </label>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Injury / constraints</label>
                  <input class="form-control" placeholder="e.g., knee—no jumping" v-model="form.constraints" />
                </div>
              </div>
            </div>

            <!-- 4) Safety & Coaching -->
            <div v-else-if="step===4">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Safety flags</label>
                  <div class="d-flex flex-wrap gap-3">
                    <label v-for="flag in safetyFlags" :key="flag" class="form-check">
                      <input type="checkbox" class="form-check-input" :value="flag" v-model="form.safety" />
                      <span class="form-check-label">{{ flag }}</span>
                    </label>
                  </div>
                  <div v-if="form.safety.length" class="alert alert-warning mt-3 p-2">
                    Use guidance only; please consult a professional.
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Weekly loss pace (kg/wk)</label>
                  <input type="range" min="0.25" max="1.0" step="0.25" class="form-range" v-model.number="form.weekly_loss" />
                  <div class="form-text">Current: {{ form.weekly_loss.toFixed(2) }} kg/week</div>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label d-block">Protein emphasis</label>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" v-model="form.protein_high" />
                    <label class="form-check-label">{{ form.protein_high ? 'High' : 'Normal' }}</label>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Plan strictness</label>
                  <input type="range" min="0" max="1" step="0.1" class="form-range" v-model.number="form.strictness" />
                  <div class="form-text">{{ strictnessLabel }}</div>
                </div>
              </div>
            </div>

            <!-- 5) Reminders -->
            <div v-else-if="step===5">
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label d-block">Weigh-in</label>
                  <select class="form-select" v-model="form.reminders.weigh_in">
                    <option value="">Off</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <div class="form-check mt-4">
                    <input class="form-check-input" type="checkbox" v-model="form.reminders.water" id="rWater" />
                    <label class="form-check-label" for="rWater">Water reminder</label>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label">Timezone</label>
                  <input class="form-control" v-model="form.reminders.timezone" />
                </div>
              </div>
            </div>

            <!-- 6) Review -->
            <div v-else-if="step===6">
              <div class="row g-3">
                <div class="col-12">
                  <div class="alert alert-secondary small">
                    Review your plan. Click <strong>Save Plan</strong> to store it and return to list.
                  </div>
                </div>
                <div class="col-12 col-lg-6">
                  <div class="border rounded p-3 mb-3">
                    <h6 class="fw-bold mb-2">Profile</h6>
                    <div class="text-muted">{{ formatProfile(previewPayload) }}</div>
                  </div>
                  <div class="border rounded p-3 mb-3">
                    <h6 class="fw-bold mb-2">Activity</h6>
                    <div class="text-muted">{{ formatActivity(previewPayload) }}</div>
                  </div>
                  <div class="border rounded p-3 mb-3">
                    <h6 class="fw-bold mb-2">Training</h6>
                    <div class="text-muted">{{ formatTraining(previewPayload) }}</div>
                  </div>
                </div>
                <div class="col-12 col-lg-6">
                  <div class="border rounded p-3 mb-3">
                    <h6 class="fw-bold mb-2">Nutrition</h6>
                    <div class="text-muted">{{ formatNutrition(previewPayload) }}</div>
                  </div>
                  <div class="border rounded p-3 mb-3">
                    <h6 class="fw-bold mb-2">Coaching</h6>
                    <div class="text-muted">{{ formatCoaching(previewPayload) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Share -->
          <div class="card mb-4 mt-4">
            <div class="card-header fw-bold">Share</div>
            <div class="card-body row g-3">
              <div class="col-12 col-md-8">
                <label class="form-label">Plan title</label>
                <input class="form-control" v-model.trim="share.title" placeholder="e.g., 8-week fat loss plan" />
              </div>
              <div class="col-12 col-md-4 d-flex align-items-end">
                <div class="form-check form-switch">
                  <input id="shareToggle" class="form-check-input" type="checkbox" v-model="share.publish" />
                  <label for="shareToggle" class="form-check-label">Share to community after saving</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="d-flex justify-content-between mt-3">
            <RouterLink class="btn btn-outline-secondary" :to="{ name: 'plans' }">← Back to Plans</RouterLink>
            <div class="d-flex gap-2">
              <RouterLink class="btn btn-outline-danger" :to="{ name: 'plans' }">Cancel</RouterLink>
              <button v-if="step < steps.length - 1" class="btn btn-primary" @click="nextStep">Next →</button>
              <button v-else class="btn btn-success" @click="savePlan">Save Plan</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { useRatings } from '../stores/ratings'
import { LS_PLANS } from '../utils/storageKeys'

/* Router & stores */
const router = useRouter()
const auth = useAuth()
const ratings = useRatings()

/* Wizard state */
const step = ref(0)
const steps = [
  { title: '1) Basics', sub: 'Sex, DOB, height & weight, target date' },
  { title: '2) Activity & lifestyle', sub: 'Activity level and habits' },
  { title: '3) Nutrition', sub: 'Diet, allergies, budget & meals' },
  { title: '4) Training', sub: 'Goal, experience, location, equipment' },
  { title: '5) Safety & Coaching', sub: 'Flags, loss pace, protein, strictness' },
  { title: '6) Reminders', sub: 'Weigh-in, water & timezone' },
  { title: '7) Review & Save', sub: 'Confirm details and save' },
]
const share = ref({ title: '', publish: false })

const progress = computed(() => Math.round(((step.value + 1) / steps.length) * 100))
function nextStep() {
  if (validateStep(step.value)) {
    step.value = Math.min(steps.length - 1, step.value + 1)
  }
}

/* Options */
const equipmentOptions = ['dumbbells','barbell','kettlebell','bands','treadmill','bike','none']
const safetyFlags = ['Hypertension','Diabetes','Pregnancy','Eating disorder history','Other']

/* Form model */
const form = ref({
  sex: '', dob: '', height_cm: null,
  weight_current_kg: null, weight_goal_kg: null, target_date: '',
  activity: '', workout_days: null, sleep_hours: null, stress: '',
  diet_style: '', allergies: [], budget: '', cook_time: '', meals_per_day: null,
  goal: '', experience: '', location: '', equipment: [], constraints: '',
  safety: [],
  weekly_loss: 0.5, protein_high: false, strictness: 0.6,
  reminders: { weigh_in: '', water: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
})

/* Units */
const units = ref('metric')
const height_ft = ref(null)
const height_in = ref(null)
const weight_current_ui = ref(null)
const weight_goal_ui = ref(null)

function setUnits(u) {
  if (u === units.value) return
  if (u === 'imperial') {
    if (form.value.height_cm) {
      const inches = form.value.height_cm / 2.54
      height_ft.value = Math.floor(inches / 12)
      height_in.value = Math.round(inches % 12)
    }
    weight_current_ui.value = form.value.weight_current_kg ? +(form.value.weight_current_kg * 2.20462).toFixed(1) : null
    weight_goal_ui.value    = form.value.weight_goal_kg    ? +(form.value.weight_goal_kg    * 2.20462).toFixed(1) : null
  } else {
    syncHeightFromImperial()
    weight_current_ui.value = form.value.weight_current_kg
    weight_goal_ui.value    = form.value.weight_goal_kg
  }
  units.value = u
}
function syncHeightFromImperial() {
  const ft = Number(height_ft.value || 0)
  const inch = Number(height_in.value || 0)
  const totalIn = ft * 12 + inch
  form.value.height_cm = totalIn ? +(totalIn * 2.54).toFixed(0) : null
  validateHeight(false)
}
function syncCurrentWeight() {
  form.value.weight_current_kg = units.value === 'metric'
    ? weight_current_ui.value
    : +(weight_current_ui.value / 2.20462).toFixed(1)
  validateWeights(false)
}
function syncGoalWeight() {
  form.value.weight_goal_kg = units.value === 'metric'
    ? weight_goal_ui.value
    : +(weight_goal_ui.value / 2.20462).toFixed(1)
  validateWeights(false)
}
watch(() => form.value.weight_current_kg, v => { if (units.value === 'metric') weight_current_ui.value = v })
watch(() => form.value.weight_goal_kg,    v => { if (units.value === 'metric') weight_goal_ui.value    = v })

/* Deriveds */
const age = computed(() => {
  if (!form.value.dob) return ''
  const dob = new Date(form.value.dob)
  const now = new Date()
  let a = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--
  return a
})
const paceText = computed(() => {
  const cur = form.value.weight_current_kg
  const goal = form.value.weight_goal_kg
  if (!cur || !goal || !form.value.target_date) return ''
  const diff = Math.max(0, cur - goal)
  const days = (new Date(form.value.target_date) - new Date()) / (1000 * 3600 * 24)
  if (days <= 0) return ''
  const weeks = days / 7
  const pace = diff / weeks
  if (!isFinite(pace) || pace <= 0) return ''
  return `Required pace ≈ ${pace.toFixed(2)} kg/week`
})
const strictnessLabel = computed(() => {
  const s = form.value.strictness
  if (s >= 0.8) return 'Very strict'
  if (s >= 0.6) return 'Strict'
  if (s >= 0.4) return 'Balanced'
  if (s >= 0.2) return 'Flexible'
  return 'Very flexible'
})

/* Validation */
const errors = ref({
  sex: null, dob: null, height: null, wtNow: null, wtGoal: null, targetDate: null,
  activity: null, goal: null
})
const validateSex = (strict) => { errors.value.sex = form.value.sex ? null : (strict ? 'Please choose your sex' : null) }
const validateDOB = (strict) => {
  const a = age.value
  errors.value.dob = (a && a >= 16 && a <= 80) ? null : (strict ? 'Enter a valid DOB (16–80)' : null)
}
function validateHeight(strict) {
  const h = form.value.height_cm
  errors.value.height = (h >= 120 && h <= 210) ? null : (strict ? 'Height must be 120–210 cm' : null)
}
function validateWeights(strict) {
  const now = form.value.weight_current_kg
  const goal = form.value.weight_goal_kg
  const okNow  = now  >= 35 && now  <= 250
  const okGoal = goal >= 35 && goal <= 250
  errors.value.wtNow  = okNow  ? null : (strict ? 'Current weight must be 35–250 kg' : null)
  errors.value.wtGoal = okGoal ? null : (strict ? 'Goal weight must be 35–250 kg' : null)
  if (!errors.value.wtNow && !errors.value.wtGoal) {
    if (goal >= now) errors.value.wtGoal = strict ? 'Goal must be lower than current' : errors.value.wtGoal
  }
}
function validateTargetDate(strict) {
  if (!form.value.target_date) { errors.value.targetDate = null; return }
  const ok = new Date(form.value.target_date) >= new Date(new Date().toDateString())
  errors.value.targetDate = ok ? null : (strict ? 'Target date must be today or later' : null)
}
const validateActivity = (strict) => { errors.value.activity = form.value.activity ? null : (strict ? 'Select an activity level' : null) }
const validateGoal     = (strict) => { errors.value.goal     = form.value.goal     ? null : (strict ? 'Select your primary goal' : null) }

function validateStep(i) {
  if (i === 0) { validateSex(true); validateDOB(true); validateHeight(true); validateWeights(true); validateTargetDate(true) }
  if (i === 1) { validateActivity(true) }
  if (i === 3) { validateGoal(true) }
  return Object.values(errors.value).every(v => !v)
}
function validateAll() {
  validateSex(true); validateDOB(true); validateHeight(true); validateWeights(true)
  validateTargetDate(true); validateActivity(true); validateGoal(true)
  return Object.values(errors.value).every(v => !v)
}

/* Nutrition: allergies */
const allergyInput = ref('')
function syncAllergies() {
  form.value.allergies = allergyInput.value
    ? allergyInput.value.split(',').map(s => s.trim()).filter(Boolean)
    : []
}

/* Formatters (for review) */
function kg(v) { return v ?? v === 0 ? `${Number(v).toFixed(0)} kg` : '—' }
function formatProfile(row) {
  const p = row.profile || {}
  const sex = p.sex || '—'
  const h = p.height_cm ? `${p.height_cm} cm` : '—'
  const weights = (p.weight_current_kg && p.weight_goal_kg)
    ? `${kg(p.weight_current_kg)} → ${kg(p.weight_goal_kg)}`
    : (p.weight_current_kg ? kg(p.weight_current_kg) : '—')
  const date = p.target_date || 'no date'
  return `${sex}, ${h}, ${weights} • target ${date}`
}
function formatActivity(row) {
  const a = row.lifestyle || {}
  const lvl = a.activity_level || '—'
  const days = a.workout_days_per_week ?? a.workout_days ?? '0'
  const sleep = a.sleep_hours ? `${a.sleep_hours}h` : '—'
  const stress = a.stress || '—'
  return `${lvl} • ${days} d/wk • sleep ${sleep} • stress ${stress}`
}
function formatTraining(row) {
  const t = row.training || {}
  const goal = t.goal || '—'
  const loc = t.location || '—'
  const eq = t.equipment && t.equipment.length ? t.equipment.join(', ') : 'none'
  const note = t.constraints ? ` • note: ${t.constraints}` : ''
  return `${goal} • ${loc} • eq: ${eq}${note}`
}
function formatNutrition(row) {
  const n = row.nutrition || {}
  const style = n.diet_style || 'Any'
  const avoid = n.allergies && n.allergies.length ? n.allergies.join(', ') : '—'
  const budget = n.budget || '—'
  const cook = n.cook_time || '—'
  const meals = n.meals_per_day ? `${n.meals_per_day}/day` : '—'
  return `${style} • avoid: ${avoid} • budget ${budget} • cook ${cook} • ${meals}`
}
function strictnessLabelFromRow(v) {
  if (v >= 0.8) return 'Very strict'
  if (v >= 0.6) return 'Strict'
  if (v >= 0.4) return 'Balanced'
  if (v >= 0.2) return 'Flexible'
  return 'Very flexible'
}
function formatCoaching(row) {
  const c = row.coaching || {}
  const pace = c.weekly_loss_kg || c.weekly_loss_kg === 0 ? `${Number(c.weekly_loss_kg).toFixed(2)} kg/wk` : '—'
  const protein = c.protein_high ? 'High protein' : 'Normal protein'
  const strict = strictnessLabelFromRow(c.strictness ?? 0.6)
  return `${pace} • ${protein} • ${strict}`
}

/* Build payload + preview */
function buildPayload() {
  return {
    profile: {
      sex: form.value.sex, dob: form.value.dob, height_cm: form.value.height_cm,
      weight_current_kg: form.value.weight_current_kg, weight_goal_kg: form.value.weight_goal_kg,
      target_date: form.value.target_date
    },
    lifestyle: {
      activity_level: form.value.activity,
      workout_days_per_week: form.value.workout_days,
      sleep_hours: form.value.sleep_hours, stress: form.value.stress
    },
    nutrition: {
      diet_style: form.value.diet_style, allergies: form.value.allergies,
      budget: form.value.budget, cook_time: form.value.cook_time, meals_per_day: form.value.meals_per_day
    },
    training: {
      goal: form.value.goal, experience: form.value.experience, location: form.value.location,
      equipment: form.value.equipment, constraints: form.value.constraints
    },
    safety: { flags: form.value.safety },
    coaching: {
      weekly_loss_kg: form.value.weekly_loss, protein_high: form.value.protein_high,
      strictness: form.value.strictness
    },
    reminders: { ...form.value.reminders }
  }
}
const previewPayload = computed(() => buildPayload())

/* Persistence: localStorage */
const STORAGE = 'luminher_plans'
function readAll() { try { return JSON.parse(localStorage.getItem(STORAGE) || '[]') } catch { return [] } }
function writeAll(list) { localStorage.setItem(STORAGE, JSON.stringify(list)) }

/* Save + optional share */
function savePlan() {
  if (!validateAll()) return
  const payload = buildPayload()

  // 1) save to local list
  const list = readAll()
  list.push(payload)
  writeAll(list)

  // 2) optional: share to community ratings store
  if (share.value.publish && auth.isAuthenticated) {
    ratings.sharePlan({
      title: share.value.title || 'My Plan',
      payload,
      ownerName: auth.user?.name || 'anonymous',
      ownerEmail: auth.user?.email || 'anonymous@local'
    })
    router.push({ name: 'community' })
    return
  }

  // 3) default: back to plans list
  router.push({ name: 'plans' })
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all .25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.circle-badge { width:42px; height:42px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; }
</style>