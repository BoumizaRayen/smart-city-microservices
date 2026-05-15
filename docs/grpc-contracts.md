# gRPC Service Contracts

All proto files are located in `/proto/`.

## Traffic Service — port 50051

Proto: `proto/traffic.proto`

```protobuf
service TrafficService {
  rpc GetAllTraffic (CityRequest) returns (TrafficList);
  rpc GetTrafficById (TrafficIdRequest) returns (Traffic);
  rpc CreateTraffic (CreateTrafficRequest) returns (Traffic);
  rpc UpdateTraffic (UpdateTrafficRequest) returns (Traffic);
  rpc DeleteTraffic (TrafficIdRequest) returns (DeleteResponse);
}
```

Status values: FREE, MODERATE, CONGESTED, BLOCKED
Road condition values: NORMAL, DANGEROUS, WET
congestion_level: integer 0-100

## Parking Service — port 50052

Proto: `proto/parking.proto`

```protobuf
service ParkingService {
  rpc GetAllParkings (CityRequest) returns (ParkingList);
  rpc GetParkingById (ParkingIdRequest) returns (Parking);
  rpc CreateParking (CreateParkingRequest) returns (Parking);
  rpc UpdateParking (UpdateParkingRequest) returns (Parking);
  rpc DeleteParking (ParkingIdRequest) returns (DeleteResponse);
}
```

UpdateParking only accepts available_spots (is_full is computed automatically)

## Incident Service — port 50053

Proto: `proto/incident.proto`

```protobuf
service IncidentService {
  rpc GetAllIncidents (CityRequest) returns (IncidentList);
  rpc GetIncidentById (IncidentIdRequest) returns (Incident);
  rpc CreateIncident (CreateIncidentRequest) returns (Incident);
  rpc UpdateIncident (UpdateIncidentRequest) returns (Incident);
  rpc DeleteIncident (IncidentIdRequest) returns (DeleteResponse);
}
```

Type values: ACCIDENT, EMERGENCY, ROAD_BLOCKED, WEATHER_ALERT
Severity values: LOW, MEDIUM, HIGH, CRITICAL
Status values: ACTIVE, RESOLVED

## Weather Service — port 50054

Proto: `proto/weather.proto`

```protobuf
service WeatherService {
  rpc GetAllWeather (CityRequest) returns (WeatherList);
  rpc GetWeatherById (WeatherIdRequest) returns (Weather);
  rpc CreateWeather (CreateWeatherRequest) returns (Weather);
  rpc UpdateWeather (UpdateWeatherRequest) returns (Weather);
  rpc DeleteWeather (WeatherIdRequest) returns (DeleteResponse);
}
```

Condition values: CLEAR, CLOUDY, RAIN, STORM, FOG, SNOW
is_dangerous is computed (wind_speed > 80 OR rainfall > 50 OR STORM/FOG)

## Notification Service — port 50055

Proto: `proto/notification.proto`

```protobuf
service NotificationService {
  rpc GetAllNotifications (CityRequest) returns (NotificationList);
  rpc GetNotificationById (NotificationIdRequest) returns (Notification);
  rpc DeleteNotification (NotificationIdRequest) returns (DeleteResponse);
}
```

Notifications are read-only (created automatically by Kafka events). No CreateNotification RPC.

## gRPC Error Codes

| Code | Meaning | HTTP equivalent |
|---|---|---|
| 3 | INVALID_ARGUMENT | 400 |
| 5 | NOT_FOUND | 404 |
| 13 | INTERNAL | 500 |

## Client Usage (Node.js)

The API Gateway wraps all gRPC clients in promise-based helpers:

```javascript
const trafficClient = require('./grpc-clients/traffic.client');

// Get all traffic for a city
const result = await trafficClient.getAllTraffic('Tunis');
// result.traffic = [{ id, city, zone, status, congestion_level, road_condition, updated_at }]

// Create traffic record
const created = await trafficClient.createTraffic({
  city: 'Tunis', zone: 'Centre-Ville', status: 'CONGESTED', congestion_level: 80, road_condition: 'NORMAL'
});
```
