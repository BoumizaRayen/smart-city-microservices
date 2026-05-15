# Smart City Microservices Platform

A production-ready Node.js microservices architecture for Smart City management. The platform manages traffic, parking, incidents, weather, and notifications using gRPC for synchronous communication and Apache Kafka for asynchronous event-driven messaging.

## Architecture at a Glance

```
Client (REST / GraphQL)
         |
         v
  API Gateway :3000
  (Express + Apollo)
         |
    gRPC calls
         |
    +----+----+----+----+
    |    |    |    |    |
  Traffic Parking Incident Weather Notification
  :50051 :50052 :50053 :50054 :50055
    |    |    |    |    |
    +----+----+----+----+
              |
           Kafka :9092
```

## Services

| Service | Port | Database | Role |
|---|---|---|---|
| API Gateway | 3000 (HTTP) | — | REST + GraphQL entry point |
| Traffic Service | 50051 (gRPC) | SQLite3 | Traffic zones management |
| Parking Service | 50052 (gRPC) | RxDB (memory) | Parking lots management |
| Incident Service | 50053 (gRPC) | SQLite3 | City incidents management |
| Weather Service | 50054 (gRPC) | SQLite3 | Weather data management |
| Notification Service | 50055 (gRPC) | RxDB (memory) | Automated notifications |

## Prerequisites

- **Node.js** 18+ (required for all services)
- **npm** 9+
- **Docker** and **Docker Compose** (for Kafka + Zookeeper)

## Installation

### 1. Start Kafka with Docker

```bash
docker-compose up -d
```

This starts:
- Zookeeper on port 2181
- Kafka broker on port 9092
- Kafka UI on http://localhost:8080

Wait about 15 seconds for Kafka to be fully ready before starting services.

### 2. Install dependencies for each service

```bash
# API Gateway
cd api-gateway && npm install && cd ..

# Traffic Service
cd services/traffic-service && npm install && cd ../..

# Parking Service
cd services/parking-service && npm install && cd ../..

# Incident Service
cd services/incident-service && npm install && cd ../..

# Weather Service
cd services/weather-service && npm install && cd ../..

# Notification Service
cd services/notification-service && npm install && cd ../..
```

## Starting All Services

Open 6 separate terminal windows and run one command per terminal:

**Terminal 1 — Traffic Service:**
```bash
cd services/traffic-service && npm run dev
```

**Terminal 2 — Parking Service:**
```bash
cd services/parking-service && npm run dev
```

**Terminal 3 — Incident Service:**
```bash
cd services/incident-service && npm run dev
```

**Terminal 4 — Weather Service:**
```bash
cd services/weather-service && npm run dev
```

**Terminal 5 — Notification Service:**
```bash
cd services/notification-service && npm run dev
```

**Terminal 6 — API Gateway (start last):**
```bash
cd api-gateway && npm run dev
```

### Verify everything is running

```bash
curl http://localhost:3000/health
# Expected: {"status":"OK","service":"API Gateway","timestamp":"..."}
```

## Seed Test Data

With all services running:
```bash
node scripts/seed.js
```

This creates traffic, parking, weather, and incident records for Tunis and Sfax.

## REST API Quick Reference

### Traffic

```bash
# List all traffic
curl http://localhost:3000/api/traffic

# List traffic for a city
curl "http://localhost:3000/api/traffic?city=Tunis"

# Create traffic record
curl -X POST http://localhost:3000/api/traffic \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","zone":"Centre-Ville","status":"CONGESTED","congestion_level":80,"road_condition":"NORMAL"}'

# Update traffic (triggers jam event if congestion >= 70)
curl -X PUT http://localhost:3000/api/traffic/{id} \
  -H "Content-Type: application/json" \
  -d '{"congestion_level":90,"status":"CONGESTED"}'
```

### Parking

```bash
# List available parkings
curl "http://localhost:3000/api/parkings?city=Tunis"

# Create parking lot
curl -X POST http://localhost:3000/api/parkings \
  -H "Content-Type: application/json" \
  -d '{"name":"Parking Test","city":"Tunis","zone":"Lac","total_spots":100,"available_spots":50}'

# Fill parking lot (triggers PARKING_FULL Kafka event)
curl -X PUT http://localhost:3000/api/parkings/{id} \
  -H "Content-Type: application/json" \
  -d '{"available_spots":0}'
```

### Incidents

```bash
# Create incident (triggers INCIDENT_DETECTED Kafka event)
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","zone":"Centre-Ville","type":"ACCIDENT","severity":"HIGH","description":"Major accident"}'

# Resolve incident (triggers INCIDENT_RESOLVED Kafka event)
curl -X PUT http://localhost:3000/api/incidents/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED"}'
```

### Weather

```bash
# Create normal weather
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","temperature":22,"wind_speed":10,"rainfall":0,"condition":"CLEAR"}'

# Create DANGEROUS weather (triggers full cascade)
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","temperature":10,"wind_speed":95,"rainfall":80,"condition":"STORM"}'
```

### Notifications (auto-generated)

```bash
curl "http://localhost:3000/api/notifications?city=Tunis"
```

## GraphQL API

GraphQL Playground: http://localhost:3000/graphql

### City Dashboard (all data in one query)

```graphql
{
  dashboard(city: "Tunis") {
    traffic {
      zone
      status
      congestion_level
      road_condition
    }
    parkings {
      name
      zone
      available_spots
      total_spots
      is_full
    }
    incidents {
      zone
      type
      severity
      description
      status
    }
    weather {
      condition
      temperature
      wind_speed
      rainfall
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

### Other GraphQL Queries

```graphql
# Available parkings only
{ availableParkings(city: "Tunis") { name zone available_spots } }

# Active incidents only
{ activeIncidents(city: "Tunis") { zone type severity description } }

# Latest weather
{ weatherStatus(city: "Tunis") { condition temperature is_dangerous } }

# All notifications
{ notifications(city: "Tunis") { type title message } }
```

## Demo Scenarios

### Scenario 1: Traffic Jam Cascade

Watch notifications appear automatically when a traffic jam is detected:

```bash
# 1. Create a traffic record with high congestion
curl -X POST http://localhost:3000/api/traffic \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","zone":"Centre-Ville","status":"CONGESTED","congestion_level":85,"road_condition":"NORMAL"}'

# 2. Check notifications (a TRAFFIC notification will appear)
curl "http://localhost:3000/api/notifications?city=Tunis"
```

### Scenario 2: Accident -> Traffic Blocked

```bash
# 1. Create an accident in Centre-Ville
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","zone":"Centre-Ville","type":"ACCIDENT","severity":"CRITICAL","description":"Major collision"}'

# 2. Check traffic - Centre-Ville should now be BLOCKED
curl "http://localhost:3000/api/traffic?city=Tunis"

# 3. Check notifications
curl "http://localhost:3000/api/notifications?city=Tunis"
```

### Scenario 3: Dangerous Weather Full Cascade

This is the most impressive scenario - one weather POST triggers events across 4 services:

```bash
# 1. Report dangerous storm
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"city":"Tunis","temperature":8,"wind_speed":95,"rainfall":75,"condition":"STORM"}'

# Expected cascade:
# - Weather Service: stores record, publishes weather.dangerous
# - Traffic Service: marks ALL Tunis roads as DANGEROUS
# - Incident Service: auto-creates WEATHER_ALERT incident, publishes incident.detected
# - Traffic Service (again): marks ALL zone BLOCKED due to weather_alert
# - Notification Service: creates WEATHER + INCIDENT notifications

# 2. Verify - check traffic (all roads DANGEROUS)
curl "http://localhost:3000/api/traffic?city=Tunis"

# 3. Verify - check auto-created weather alert incident
curl "http://localhost:3000/api/incidents?city=Tunis"

# 4. Verify - check notifications (multiple created)
curl "http://localhost:3000/api/notifications?city=Tunis"

# 5. Full city dashboard
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ dashboard(city: \"Tunis\") { traffic { zone road_condition } incidents { type severity } weather { condition is_dangerous } notifications { title } } }"}'
```

### Scenario 4: Parking Full Alert

```bash
# 1. Create a parking lot
curl -X POST http://localhost:3000/api/parkings \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Parking","city":"Tunis","zone":"Lac","total_spots":50,"available_spots":5}'

# Note the ID from the response

# 2. Fill the parking lot (triggers PARKING_FULL event)
curl -X PUT http://localhost:3000/api/parkings/{id} \
  -H "Content-Type: application/json" \
  -d '{"available_spots":0}'

# 3. Check notifications
curl "http://localhost:3000/api/notifications?city=Tunis"

# 4. Free up spots (different state, no notification)
curl -X PUT http://localhost:3000/api/parkings/{id} \
  -H "Content-Type: application/json" \
  -d '{"available_spots":10}'
```

## Project Structure

```
smart-city-microservices/
  docker-compose.yml          # Kafka + Zookeeper + Kafka UI
  package.json                # Root scripts
  scripts/
    seed.js                   # Test data seeder
  proto/
    traffic.proto             # Traffic gRPC contract
    parking.proto             # Parking gRPC contract
    incident.proto            # Incident gRPC contract
    weather.proto             # Weather gRPC contract
    notification.proto        # Notification gRPC contract
  kafka/
    kafkaClient.js            # Shared Kafka client + topic constants
    topics.md                 # Topic documentation
  api-gateway/
    .env
    package.json
    src/
      index.js                # Express + Apollo Server
      config/config.js        # Port/host config
      grpc-clients/           # One client per service
        traffic.client.js
        parking.client.js
        incident.client.js
        weather.client.js
        notification.client.js
      routes/                 # REST route handlers
        traffic.routes.js
        parking.routes.js
        incident.routes.js
        weather.routes.js
        notification.routes.js
      graphql/
        schema.js             # GraphQL type definitions
        resolvers.js          # GraphQL resolvers
  services/
    traffic-service/
      .env
      package.json
      src/
        index.js              # gRPC server
        db.js                 # SQLite3 init
        handlers.js           # gRPC method handlers
        kafka/
          producer.js
          consumer.js
    parking-service/
      .env
      package.json
      src/
        index.js
        db/index.js           # RxDB init
        handlers.js
        kafka/
          producer.js
          consumer.js
    incident-service/         # Same structure as traffic
    weather-service/          # Same structure as traffic (no consumer)
    notification-service/     # RxDB, Kafka consumer only
  docs/
    architecture.md           # Full architecture description
    rest-endpoints.md         # REST API reference with curl examples
    graphql-schema.md         # GraphQL schema and example queries
    grpc-contracts.md         # gRPC proto contracts
    kafka-events.md           # Kafka topics and event schemas
    databases.md              # Database schemas
```

## Kafka Topics Summary

| Topic | Trigger | Effect |
|---|---|---|
| incident.detected | New incident created | Traffic blocked, notification sent |
| incident.resolved | Incident status -> RESOLVED | Notification sent |
| traffic.jam.detected | congestion_level >= 70 | Parking checked, notification sent |
| traffic.status.updated | Any traffic create/update | Monitoring |
| parking.full | available_spots -> 0 | Notification sent |
| parking.available | Parking spots free up | Monitoring |
| weather.dangerous | wind>80 OR rain>50 OR STORM/FOG | Roads DANGEROUS, auto-incident, notification |
| weather.updated | Any weather create/update | Monitoring |
| notification.created | Notification stored | Monitoring |

## Environment Variables

Each service has its own `.env` file. All variables have sensible defaults.

### API Gateway (.env)
```
PORT=3000
TRAFFIC_GRPC_HOST=localhost:50051
PARKING_GRPC_HOST=localhost:50052
INCIDENT_GRPC_HOST=localhost:50053
WEATHER_GRPC_HOST=localhost:50054
NOTIFICATION_GRPC_HOST=localhost:50055
```

### Microservices (.env)
```
GRPC_PORT=<service port>
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=<service-name>
DB_PATH=./<name>.db          # SQLite services only
DB_NAME=<name>_db            # RxDB services only
```

## Monitoring

- **Kafka UI**: http://localhost:8080 — view topics, messages, consumer groups
- **Health check**: http://localhost:3000/health

## Tech Stack

- **Runtime**: Node.js 18+
- **API Gateway**: Express.js, Apollo Server v4
- **gRPC**: @grpc/grpc-js, @grpc/proto-loader
- **Messaging**: KafkaJS, Apache Kafka
- **Databases**: better-sqlite3 (Traffic, Incident, Weather), RxDB (Parking, Notification)
- **Infrastructure**: Docker Compose, Confluent Kafka images
