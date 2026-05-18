# Smart City Microservices - Architecture

## Overview

The Smart City platform is built as a set of Node.js microservices following the microservices architecture pattern. Services communicate synchronously via gRPC and asynchronously via Apache Kafka.

```
Client
  |
  v
API Gateway (REST + GraphQL) :3000
  |
  +-- gRPC --> Traffic Service      :50051  (SQLite3)
  |
  +-- gRPC --> Parking Service      :50052  (RxDB in-memory)
  |
  +-- gRPC --> Incident Service     :50053  (SQLite3)
  |
  +-- gRPC --> Weather Service      :50054  (SQLite3)
  |
  +-- gRPC --> Notification Service :50055  (RxDB in-memory)

                Kafka :9092
                  |
     +------------+------------+
     |            |            |
  Traffic      Parking    Incident
  Service      Service    Service
     |                       |
     +----------+------------+
                |
           Weather Service
                |
          Notification Service
```

## Components

### API Gateway
- **Framework**: Express.js
- **REST API**: Full CRUD for all 5 domains
- **GraphQL API**: Apollo Server v4 with dashboard query
- **Port**: 3000
- **Role**: Single entry point, routes to microservices via gRPC

### Traffic Service
- **Database**: SQLite3 via better-sqlite3
- **Port**: 50051 (gRPC)
- **Kafka Producer**: Publishes traffic.status.updated, traffic.jam.detected
- **Kafka Consumer**: Subscribes to incident.detected, weather.dangerous
- **Business Logic**: Marks zones BLOCKED on incidents, DANGEROUS roads on bad weather

### Parking Service
- **Database**: RxDB with in-memory storage
- **Port**: 50052 (gRPC)
- **Kafka Producer**: Publishes parking.full, parking.available
- **Kafka Consumer**: Subscribes to traffic.jam.detected
- **Business Logic**: State-change detection (was full -> available, was available -> full)

### Incident Service
- **Database**: SQLite3 via better-sqlite3
- **Port**: 50053 (gRPC)
- **Kafka Producer**: Publishes incident.detected, incident.resolved
- **Kafka Consumer**: Subscribes to weather.dangerous
- **Business Logic**: Auto-creates WEATHER_ALERT incidents on dangerous weather

### Weather Service
- **Database**: SQLite3 via better-sqlite3
- **Port**: 50054 (gRPC)
- **Kafka Producer**: Publishes weather.updated, weather.dangerous
- **Business Logic**: Calculates dangerousness (wind>80, rain>50, STORM/FOG conditions)

### Notification Service
- **Database**: RxDB with in-memory storage
- **Port**: 50055 (gRPC)
- **Kafka Consumer**: Subscribes to incident.detected, incident.resolved, parking.full, traffic.jam.detected, weather.dangerous
- **Business Logic**: Builds human-readable notifications from Kafka events

## Communication Patterns

### Synchronous (gRPC)
- Client -> API Gateway: HTTP REST or GraphQL
- API Gateway -> Services: gRPC unary calls
- Proto files in `/proto/` directory

### Asynchronous (Kafka)
- Cross-service communication via events
- 9 topics defined in `kafka/kafkaClient.js`
- Each service has its own producer and consumer group

## Data Storage

| Service | Storage | Persistence |
|---|---|---|
| Traffic | SQLite3 (file) | Persistent (traffic.db) |
| Parking | RxDB (memory) | In-memory (resets on restart) |
| Incident | SQLite3 (file) | Persistent (incident.db) |
| Weather | SQLite3 (file) | Persistent (weather.db) |
| Notification | RxDB (memory) | In-memory (resets on restart) |

## Event-Driven Cascades

### Weather Storm -> Multiple Services
1. Client POSTs dangerous weather to `/api/weather`
2. Weather Service creates record and publishes `weather.dangerous`
3. Traffic Service receives event, marks all city roads as DANGEROUS
4. Incident Service receives event, auto-creates WEATHER_ALERT incident
5. Incident Service then publishes `incident.detected`
6. Traffic Service receives incident event, marks specific zone as BLOCKED
7. Notification Service creates WEATHER notification and INCIDENT notification

### Accident -> Traffic Blocked
1. Client POSTs incident to `/api/incidents`
2. Incident Service creates record and publishes `incident.detected`
3. Traffic Service receives event, marks zone as BLOCKED (congestion=100)
4. Notification Service creates INCIDENT notification

### Traffic Jam -> Parking Alert
1. Client creates/updates traffic with congestion >= 70
2. Traffic Service publishes `traffic.jam.detected`
3. Parking Service receives event, logs available parkings
4. Notification Service creates TRAFFIC notification
