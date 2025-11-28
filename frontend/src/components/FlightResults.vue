<script setup>
import { computed } from 'vue';

const props = defineProps({
  flights: {
    type: Array,
    default: () => [],
  },
  carriers: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

const formatDuration = (duration) => {
  if (!duration) return '';
  // PT2H30M -> 2h 30m
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return duration;
  const hours = match[1] ? match[1].replace('H', 'h ') : '';
  const minutes = match[2] ? match[2].replace('M', 'm') : '';
  return `${hours}${minutes}`.trim();
};

const formatTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const getCarrierName = (code) => {
  return props.carriers[code] || code;
};

const getStopsLabel = (segments) => {
  const stops = segments.length - 1;
  if (stops === 0) return 'Direct';
  return `${stops} stop${stops > 1 ? 's' : ''}`;
};

const parsedFlights = computed(() => {
  return props.flights.map((offer) => ({
    id: offer.id,
    price: offer.price,
    itineraries: offer.itineraries.map((itinerary) => ({
      duration: formatDuration(itinerary.duration),
      segments: itinerary.segments,
      departure: itinerary.segments[0].departure,
      arrival: itinerary.segments[itinerary.segments.length - 1].arrival,
      stops: getStopsLabel(itinerary.segments),
    })),
    validatingAirlineCodes: offer.validatingAirlineCodes,
    numberOfBookableSeats: offer.numberOfBookableSeats,
  }));
});
</script>

<template>
  <div class="flight-results">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Searching for the best flights...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="parsedFlights.length === 0" class="no-results">
      <p>No flights found. Try adjusting your search criteria.</p>
    </div>

    <div v-else class="results-list">
      <h3>{{ parsedFlights.length }} Flight{{ parsedFlights.length > 1 ? 's' : '' }} Found</h3>

      <div v-for="flight in parsedFlights" :key="flight.id" class="flight-card">
        <div class="flight-itineraries">
          <div
            v-for="(itinerary, index) in flight.itineraries"
            :key="index"
            class="itinerary"
          >
            <div class="itinerary-label">
              {{ index === 0 ? 'Outbound' : 'Return' }}
            </div>
            <div class="itinerary-details">
              <div class="flight-time">
                <div class="time-info">
                  <span class="time">{{ formatTime(itinerary.departure.at) }}</span>
                  <span class="airport">{{ itinerary.departure.iataCode }}</span>
                </div>
                <div class="flight-path">
                  <div class="duration">{{ itinerary.duration }}</div>
                  <div class="path-line">
                    <span class="dot"></span>
                    <span class="line"></span>
                    <span class="dot"></span>
                  </div>
                  <div class="stops">{{ itinerary.stops }}</div>
                </div>
                <div class="time-info">
                  <span class="time">{{ formatTime(itinerary.arrival.at) }}</span>
                  <span class="airport">{{ itinerary.arrival.iataCode }}</span>
                </div>
              </div>
              <div class="flight-date">{{ formatDate(itinerary.departure.at) }}</div>
              <div class="carriers">
                <span
                  v-for="segment in itinerary.segments"
                  :key="segment.id"
                  class="carrier"
                >
                  {{ getCarrierName(segment.carrierCode) }} {{ segment.number }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flight-price">
          <div class="price-amount">
            {{ flight.price.currency }} {{ flight.price.total }}
          </div>
          <div class="price-per-person">per person</div>
          <div class="seats-available" v-if="flight.numberOfBookableSeats">
            {{ flight.numberOfBookableSeats }} seats left
          </div>
          <button class="select-button">Select</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flight-results {
  max-width: 900px;
  margin: 2rem auto;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #eee;
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  background: #fee;
  color: #c00;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.results-list h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.flight-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

.flight-itineraries {
  flex: 1;
  padding: 1.5rem;
}

.itinerary {
  margin-bottom: 1rem;
}

.itinerary:last-child {
  margin-bottom: 0;
}

.itinerary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  text-align: left;
}

.itinerary-details {
  text-align: left;
}

.flight-time {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-info {
  text-align: center;
}

.time {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.airport {
  display: block;
  font-size: 0.875rem;
  color: #666;
}

.flight-path {
  flex: 1;
  text-align: center;
}

.duration {
  font-size: 0.75rem;
  color: #666;
}

.path-line {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.25rem 0;
}

.dot {
  width: 8px;
  height: 8px;
  background: #646cff;
  border-radius: 50%;
}

.line {
  flex: 1;
  height: 2px;
  background: #646cff;
  margin: 0 4px;
}

.stops {
  font-size: 0.75rem;
  color: #666;
}

.flight-date {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.5rem;
}

.carriers {
  margin-top: 0.5rem;
}

.carrier {
  display: inline-block;
  font-size: 0.75rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-right: 0.5rem;
}

.flight-price {
  background: linear-gradient(135deg, #f8f9ff, #f0f2ff);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 150px;
  border-left: 1px solid #eee;
}

.price-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.price-per-person {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.seats-available {
  font-size: 0.75rem;
  color: #e67700;
  margin-bottom: 0.75rem;
}

.select-button {
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: #646cff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.select-button:hover {
  background: #535bf2;
}

@media (max-width: 600px) {
  .flight-card {
    flex-direction: column;
  }

  .flight-price {
    border-left: none;
    border-top: 1px solid #eee;
  }
}
</style>
