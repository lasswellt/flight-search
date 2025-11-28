<script setup>
import { ref, computed } from 'vue';
import LocationInput from './LocationInput.vue';

const emit = defineEmits(['search']);

const origin = ref('');
const destination = ref('');
const departureDate = ref('');
const returnDate = ref('');
const tripType = ref('roundtrip');
const adults = ref(1);
const travelClass = ref('ECONOMY');
const loading = ref(false);

const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const minReturnDate = computed(() => {
  return departureDate.value || today.value;
});

const isFormValid = computed(() => {
  return (
    origin.value &&
    destination.value &&
    departureDate.value &&
    (tripType.value === 'oneway' || returnDate.value)
  );
});

const searchFlights = () => {
  if (!isFormValid.value) return;

  const searchParams = {
    originLocationCode: origin.value,
    destinationLocationCode: destination.value,
    departureDate: departureDate.value,
    adults: adults.value,
    travelClass: travelClass.value,
  };

  if (tripType.value === 'roundtrip' && returnDate.value) {
    searchParams.returnDate = returnDate.value;
  }

  emit('search', searchParams);
};
</script>

<template>
  <div class="search-form">
    <h2>Search Flights</h2>

    <div class="trip-type-selector">
      <label class="radio-label">
        <input type="radio" v-model="tripType" value="roundtrip" />
        Round Trip
      </label>
      <label class="radio-label">
        <input type="radio" v-model="tripType" value="oneway" />
        One Way
      </label>
    </div>

    <div class="form-row">
      <div class="form-group">
        <LocationInput
          v-model="origin"
          label="From"
          placeholder="City or airport"
        />
      </div>
      <div class="form-group">
        <LocationInput
          v-model="destination"
          label="To"
          placeholder="City or airport"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Departure Date</label>
        <input
          type="date"
          v-model="departureDate"
          :min="today"
          class="form-input"
        />
      </div>
      <div class="form-group" v-if="tripType === 'roundtrip'">
        <label class="form-label">Return Date</label>
        <input
          type="date"
          v-model="returnDate"
          :min="minReturnDate"
          class="form-input"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Passengers</label>
        <select v-model="adults" class="form-input">
          <option v-for="n in 9" :key="n" :value="n">{{ n }} Adult{{ n > 1 ? 's' : '' }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Class</label>
        <select v-model="travelClass" class="form-input">
          <option value="ECONOMY">Economy</option>
          <option value="PREMIUM_ECONOMY">Premium Economy</option>
          <option value="BUSINESS">Business</option>
          <option value="FIRST">First Class</option>
        </select>
      </div>
    </div>

    <button
      @click="searchFlights"
      :disabled="!isFormValid || loading"
      class="search-button"
    >
      {{ loading ? 'Searching...' : 'Search Flights' }}
    </button>
  </div>
</template>

<style scoped>
.search-form {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.search-form h2 {
  margin: 0 0 1.5rem;
  color: #333;
}

.trip-type-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  text-align: left;
}

.form-input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  background-color: #fff;
  color: #333;
}

.form-input:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.search-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #646cff, #535bf2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 1rem;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.search-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
