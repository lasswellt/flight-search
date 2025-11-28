<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Enter city or airport',
  },
  label: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'select']);

const suggestions = ref([]);
const showSuggestions = ref(false);
const loading = ref(false);
const inputValue = ref(props.modelValue);
const selectedLocation = ref(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

let debounceTimer = null;

const searchLocations = async (keyword) => {
  if (!keyword || keyword.length < 2) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `${API_BASE}/api/locations?keyword=${encodeURIComponent(keyword)}`
    );
    const data = await response.json();
    suggestions.value = data.data || [];
    showSuggestions.value = suggestions.value.length > 0;
  } catch (error) {
    console.error('Error searching locations:', error);
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
};

const handleInput = (event) => {
  const value = event.target.value;
  inputValue.value = value;
  selectedLocation.value = null;
  emit('update:modelValue', '');

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    searchLocations(value);
  }, 300);
};

const selectLocation = (location) => {
  selectedLocation.value = location;
  inputValue.value = `${location.name} (${location.iataCode})`;
  emit('update:modelValue', location.iataCode);
  emit('select', location);
  showSuggestions.value = false;
};

const handleBlur = () => {
  // Delay hiding to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};
</script>

<template>
  <div class="location-input">
    <label v-if="label" class="location-label">{{ label }}</label>
    <div class="input-wrapper">
      <input
        type="text"
        :value="inputValue"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="showSuggestions = suggestions.length > 0"
        @blur="handleBlur"
        class="location-field"
      />
      <span v-if="loading" class="loading-indicator">...</span>
    </div>
    <ul v-if="showSuggestions" class="suggestions-list">
      <li
        v-for="location in suggestions"
        :key="location.id"
        @click="selectLocation(location)"
        class="suggestion-item"
      >
        <span class="location-name">{{ location.name }}</span>
        <span class="location-code">{{ location.iataCode }}</span>
        <span class="location-type">{{ location.subType }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.location-input {
  position: relative;
  width: 100%;
}

.location-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: inherit;
  text-align: left;
}

.input-wrapper {
  position: relative;
}

.location-field {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  background-color: #fff;
  color: #333;
}

.location-field:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.loading-indicator {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 8px 8px;
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  text-align: left;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.location-name {
  flex: 1;
}

.location-code {
  font-weight: 600;
  color: #646cff;
}

.location-type {
  font-size: 0.75rem;
  color: #999;
  text-transform: capitalize;
}
</style>
