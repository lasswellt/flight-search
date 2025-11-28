import express from 'express';
import cors from 'cors';
import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Check for required environment variables
const clientId = process.env.AMADEUS_CLIENT_ID;
const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

let amadeus = null;

if (clientId && clientSecret) {
  // Initialize Amadeus client
  amadeus = new Amadeus({
    clientId,
    clientSecret,
    hostname: process.env.AMADEUS_HOSTNAME || 'test', // 'test' for test environment, 'production' for production
  });
} else {
  console.warn('Warning: Amadeus credentials not configured. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
}

// Middleware to check if Amadeus is configured
const requireAmadeus = (req, res, next) => {
  if (!amadeus) {
    return res.status(503).json({
      error: 'Amadeus API is not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.',
    });
  }
  next();
};

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    amadeusConfigured: !!amadeus,
  });
});

// Search for flight offers
app.get('/api/flights/search', requireAmadeus, async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass,
      nonStop,
      currencyCode,
      maxPrice,
      max = 10,
    } = req.query;

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters: originLocationCode, destinationLocationCode, and departureDate are required',
      });
    }

    const searchParams = {
      originLocationCode: String(originLocationCode).toUpperCase(),
      destinationLocationCode: String(destinationLocationCode).toUpperCase(),
      departureDate,
      adults: parseInt(adults, 10),
      max: parseInt(max, 10),
    };

    // Add optional parameters if provided
    if (returnDate) searchParams.returnDate = returnDate;
    if (children) searchParams.children = parseInt(children, 10);
    if (infants) searchParams.infants = parseInt(infants, 10);
    if (travelClass) searchParams.travelClass = travelClass;
    if (nonStop !== undefined) searchParams.nonStop = nonStop === 'true';
    if (currencyCode) searchParams.currencyCode = currencyCode;
    if (maxPrice) searchParams.maxPrice = parseInt(maxPrice, 10);

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    res.json({
      data: response.data,
      dictionaries: response.result.dictionaries,
      meta: response.result.meta,
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(error.response?.statusCode || 500).json({
      error: error.description || error.message || 'Failed to search flights',
      details: error.response?.result || null,
    });
  }
});

// Get airport/city suggestions for autocomplete
app.get('/api/locations', requireAmadeus, async (req, res) => {
  try {
    const { keyword, subType = 'CITY,AIRPORT' } = req.query;

    if (!keyword) {
      return res.status(400).json({
        error: 'Missing required parameter: keyword',
      });
    }

    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType,
    });

    res.json({
      data: response.data,
    });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(error.response?.statusCode || 500).json({
      error: error.description || error.message || 'Failed to search locations',
    });
  }
});

// Get flight price confirmation
app.post('/api/flights/price', requireAmadeus, async (req, res) => {
  try {
    const { flightOffer } = req.body;

    if (!flightOffer) {
      return res.status(400).json({
        error: 'Missing required parameter: flightOffer',
      });
    }

    const response = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [flightOffer],
        },
      })
    );

    res.json({
      data: response.data,
    });
  } catch (error) {
    console.error('Price confirmation error:', error);
    res.status(error.response?.statusCode || 500).json({
      error: error.description || error.message || 'Failed to confirm price',
    });
  }
});

// Get flight schedules (future schedule availability)
app.get('/api/flights/schedules', requireAmadeus, async (req, res) => {
  try {
    const { carrierCode, flightNumber, scheduledDepartureDate } = req.query;

    if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
      return res.status(400).json({
        error: 'Missing required parameters: carrierCode, flightNumber, and scheduledDepartureDate are required',
      });
    }

    const response = await amadeus.schedule.flights.get({
      carrierCode,
      flightNumber,
      scheduledDepartureDate,
    });

    res.json({
      data: response.data,
    });
  } catch (error) {
    console.error('Flight schedule error:', error);
    res.status(error.response?.statusCode || 500).json({
      error: error.description || error.message || 'Failed to get flight schedules',
    });
  }
});

app.listen(port, () => {
  console.log(`Flight search backend running on http://localhost:${port}`);
});
