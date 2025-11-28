#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
const clientId = process.env.AMADEUS_CLIENT_ID;
const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

let amadeus = null;

if (clientId && clientSecret) {
  // Initialize Amadeus client
  amadeus = new Amadeus({
    clientId,
    clientSecret,
    hostname: process.env.AMADEUS_HOSTNAME || 'test',
  });
} else {
  console.error('Warning: Amadeus credentials not configured. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
}

// Create server instance
const server = new Server(
  {
    name: 'flight-search-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_flights',
        description: 'Search for available flight offers between two locations. Returns flight options with prices, durations, and carrier information.',
        inputSchema: {
          type: 'object',
          properties: {
            originLocationCode: {
              type: 'string',
              description: 'IATA code of the departure airport (e.g., NYC, LAX, JFK)',
            },
            destinationLocationCode: {
              type: 'string',
              description: 'IATA code of the arrival airport (e.g., PAR, LON, CDG)',
            },
            departureDate: {
              type: 'string',
              description: 'Departure date in YYYY-MM-DD format',
            },
            returnDate: {
              type: 'string',
              description: 'Return date in YYYY-MM-DD format (optional, for round trips)',
            },
            adults: {
              type: 'number',
              description: 'Number of adult passengers (default: 1)',
              minimum: 1,
              maximum: 9,
            },
            travelClass: {
              type: 'string',
              description: 'Travel class',
              enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
            },
            nonStop: {
              type: 'boolean',
              description: 'If true, only return non-stop flights',
            },
            currencyCode: {
              type: 'string',
              description: 'Currency code for prices (e.g., USD, EUR, GBP)',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
              minimum: 1,
              maximum: 250,
            },
          },
          required: ['originLocationCode', 'destinationLocationCode', 'departureDate'],
        },
      },
      {
        name: 'get_airport_info',
        description: 'Search for airports or cities by keyword. Returns location codes and names for use in flight searches.',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search keyword (city name or airport code)',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'get_flight_schedule',
        description: 'Get the schedule for a specific flight by carrier code and flight number.',
        inputSchema: {
          type: 'object',
          properties: {
            carrierCode: {
              type: 'string',
              description: 'Two-letter IATA carrier code (e.g., AA, DL, UA)',
            },
            flightNumber: {
              type: 'string',
              description: 'Flight number (e.g., 100, 1234)',
            },
            scheduledDepartureDate: {
              type: 'string',
              description: 'Scheduled departure date in YYYY-MM-DD format',
            },
          },
          required: ['carrierCode', 'flightNumber', 'scheduledDepartureDate'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check if Amadeus is configured
  if (!amadeus) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Amadeus API is not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.',
        },
      ],
      isError: true,
    };
  }

  try {
    if (name === 'search_flights') {
      const searchParams = {
        originLocationCode: String(args.originLocationCode).toUpperCase(),
        destinationLocationCode: String(args.destinationLocationCode).toUpperCase(),
        departureDate: args.departureDate,
        adults: args.adults || 1,
        max: args.maxResults || 5,
      };

      if (args.returnDate) searchParams.returnDate = args.returnDate;
      if (args.travelClass) searchParams.travelClass = args.travelClass;
      if (args.nonStop !== undefined) searchParams.nonStop = args.nonStop;
      if (args.currencyCode) searchParams.currencyCode = args.currencyCode;

      const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

      // Format the response for better readability
      const flights = response.data.map((offer, index) => {
        const itineraries = offer.itineraries.map((itinerary, itinIndex) => {
          const segments = itinerary.segments.map((segment) => ({
            departure: `${segment.departure.iataCode} at ${segment.departure.at}`,
            arrival: `${segment.arrival.iataCode} at ${segment.arrival.at}`,
            carrier: segment.carrierCode,
            flightNumber: segment.number,
            duration: segment.duration,
            aircraft: segment.aircraft?.code,
          }));

          return {
            type: itinIndex === 0 ? 'Outbound' : 'Return',
            duration: itinerary.duration,
            segments,
          };
        });

        return {
          offerNumber: index + 1,
          price: `${offer.price.total} ${offer.price.currency}`,
          itineraries,
          numberOfBookableSeats: offer.numberOfBookableSeats,
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                totalFlightsFound: response.data.length,
                flights,
                carriers: response.result.dictionaries?.carriers || {},
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_airport_info') {
      const response = await amadeus.referenceData.locations.get({
        keyword: args.keyword,
        subType: 'CITY,AIRPORT',
      });

      const locations = response.data.map((loc) => ({
        name: loc.name,
        iataCode: loc.iataCode,
        type: loc.subType,
        cityName: loc.address?.cityName,
        countryCode: loc.address?.countryCode,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                locationsFound: locations.length,
                locations,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_flight_schedule') {
      const response = await amadeus.schedule.flights.get({
        carrierCode: args.carrierCode,
        flightNumber: args.flightNumber,
        scheduledDepartureDate: args.scheduledDepartureDate,
      });

      const schedules = response.data.map((schedule) => ({
        flightDesignator: schedule.flightDesignator,
        departure: schedule.flightPoints?.[0],
        arrival: schedule.flightPoints?.[1],
        duration: schedule.legs?.[0]?.scheduledLegDuration,
        aircraft: schedule.legs?.[0]?.aircraftEquipment,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                schedulesFound: schedules.length,
                schedules,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.description || error.message || 'An error occurred'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Flight Search MCP Server running on stdio');
}

main().catch(console.error);
