# Flight Search

A Vue.js flight search application powered by the Amadeus API, with an MCP server for AI assistant integration.

## Project Structure

```
flight-search/
├── frontend/          # Vue.js 3 + Vite frontend application
├── backend/           # Express.js API server with Amadeus integration
└── mcp-server/        # Model Context Protocol server for AI assistants
```

## Prerequisites

- Node.js 18+
- Amadeus API credentials (get them at https://developers.amadeus.com/)

## Setup

### 1. Get Amadeus API Credentials

1. Create an account at [Amadeus for Developers](https://developers.amadeus.com/)
2. Create a new application to get your API Key and API Secret
3. Use the test environment for development

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Amadeus credentials
npm run dev
```

The backend will run on http://localhost:3001

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Optionally edit .env to change the API URL
npm run dev
```

The frontend will run on http://localhost:5173

### 4. MCP Server Setup

```bash
cd mcp-server
npm install
cp .env.example .env
# Edit .env with your Amadeus credentials
npm start
```

## MCP Server Configuration

Add the following to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "flight-search": {
      "command": "node",
      "args": ["/path/to/flight-search/mcp-server/src/index.js"],
      "env": {
        "AMADEUS_CLIENT_ID": "your_client_id",
        "AMADEUS_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Available MCP Tools

- **search_flights**: Search for available flight offers between two locations
- **get_airport_info**: Search for airports or cities by keyword
- **get_flight_schedule**: Get the schedule for a specific flight

## API Endpoints

### Backend REST API

- `GET /api/health` - Health check
- `GET /api/flights/search` - Search for flight offers
- `GET /api/locations` - Search for airports/cities
- `POST /api/flights/price` - Get price confirmation for a flight offer
- `GET /api/flights/schedules` - Get flight schedules

### Query Parameters for Flight Search

| Parameter | Required | Description |
|-----------|----------|-------------|
| originLocationCode | Yes | IATA code of departure airport |
| destinationLocationCode | Yes | IATA code of arrival airport |
| departureDate | Yes | Departure date (YYYY-MM-DD) |
| returnDate | No | Return date for round trips |
| adults | No | Number of adults (default: 1) |
| children | No | Number of children |
| travelClass | No | ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST |
| nonStop | No | Filter for non-stop flights only |
| currencyCode | No | Currency code (e.g., USD, EUR) |
| max | No | Maximum results (default: 10) |

## Development

### Building the Frontend

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## License

MIT
