<script setup>
import { ref } from 'vue';
import FlightSearch from './components/FlightSearch.vue';
import FlightResults from './components/FlightResults.vue';

const flights = ref([]);
const carriers = ref({});
const loading = ref(false);
const error = ref('');
const hasSearched = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const handleSearch = async (searchParams) => {
  loading.value = true;
  error.value = '';
  hasSearched.value = true;
  flights.value = [];

  try {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE}/api/flights/search?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search flights');
    }

    flights.value = data.data || [];
    carriers.value = data.dictionaries?.carriers || {};
  } catch (err) {
    error.value = err.message || 'An error occurred while searching for flights';
    console.error('Search error:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>✈️ Flight Search</h1>
      <p>Find the best flights with Amadeus</p>
    </header>

    <main>
      <FlightSearch @search="handleSearch" />
      
      <FlightResults
        v-if="hasSearched"
        :flights="flights"
        :carriers="carriers"
        :loading="loading"
        :error="error"
      />
    </main>

    <footer class="app-footer">
      <p>Powered by Amadeus Flight API</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
}

.app-header p {
  margin: 0;
  color: #666;
}

main {
  flex: 1;
  padding: 0 1rem 2rem;
}

.app-footer {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.875rem;
}
</style>
