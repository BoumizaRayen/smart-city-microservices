# GraphQL API Reference

GraphQL Endpoint: `http://localhost:3000/graphql`

## Schema

```graphql
type Traffic {
  id: ID!
  city: String!
  zone: String!
  status: String!           # FREE, MODERATE, CONGESTED, BLOCKED
  congestion_level: Int!    # 0-100
  road_condition: String!   # NORMAL, DANGEROUS, WET
  updated_at: String!
}

type Parking {
  id: ID!
  name: String!
  city: String!
  zone: String!
  total_spots: Int!
  available_spots: Int!
  is_full: Boolean!
  updated_at: String!
}

type Incident {
  id: ID!
  city: String!
  zone: String!
  type: String!       # ACCIDENT, EMERGENCY, ROAD_BLOCKED, WEATHER_ALERT
  severity: String!   # LOW, MEDIUM, HIGH, CRITICAL
  description: String
  status: String!     # ACTIVE, RESOLVED
  created_at: String!
  updated_at: String!
}

type Weather {
  id: ID!
  city: String!
  temperature: Float!
  wind_speed: Float!
  rainfall: Float!
  condition: String!    # CLEAR, CLOUDY, RAIN, STORM, FOG, SNOW
  is_dangerous: Boolean!
  updated_at: String!
}

type Notification {
  id: ID!
  city: String!
  type: String!         # INCIDENT, INCIDENT_RESOLVED, PARKING, TRAFFIC, WEATHER, INFO
  title: String!
  message: String!
  source_event: String! # Kafka topic name
  created_at: String!
}

type Dashboard {
  traffic: [Traffic]
  parkings: [Parking]
  incidents: [Incident]   # active only
  weather: Weather        # latest record
  notifications: [Notification]
}

type Query {
  dashboard(city: String!): Dashboard
  trafficStatus(city: String!): [Traffic]
  availableParkings(city: String!): [Parking]    # is_full = false only
  activeIncidents(city: String!): [Incident]     # status = ACTIVE only
  weatherStatus(city: String!): Weather          # latest record
  notifications(city: String!): [Notification]
}
```

## Example Queries

### Full City Dashboard
```graphql
query CityDashboard($city: String!) {
  dashboard(city: $city) {
    traffic {
      id
      zone
      status
      congestion_level
      road_condition
    }
    parkings {
      id
      name
      zone
      available_spots
      total_spots
      is_full
    }
    incidents {
      id
      zone
      type
      severity
      description
      status
    }
    weather {
      temperature
      wind_speed
      rainfall
      condition
      is_dangerous
    }
    notifications {
      type
      title
      message
      created_at
    }
  }
}
```

Variables: `{ "city": "Tunis" }`

### Quick curl
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ dashboard(city: \"Tunis\") { traffic { zone status congestion_level } parkings { name available_spots is_full } incidents { type severity description } weather { condition temperature is_dangerous } notifications { title message } } }"
  }'
```

### Traffic Status Query
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ trafficStatus(city: \"Tunis\") { zone status congestion_level road_condition } }"
  }'
```

### Available Parkings Only
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ availableParkings(city: \"Tunis\") { name zone available_spots total_spots } }"
  }'
```

### Active Incidents
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ activeIncidents(city: \"Tunis\") { zone type severity description status } }"
  }'
```

### Weather Status
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ weatherStatus(city: \"Tunis\") { condition temperature wind_speed rainfall is_dangerous } }"
  }'
```

### All Notifications
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ notifications(city: \"Tunis\") { type title message source_event created_at } }"
  }'
```
