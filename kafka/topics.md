# Kafka Topics Reference

## Topic List

| Topic | Key | Producer | Consumers |
|---|---|---|---|
| `incident.detected` | INCIDENT_DETECTED | Incident Service | Traffic, Notification |
| `incident.resolved` | INCIDENT_RESOLVED | Incident Service | Notification |
| `traffic.jam.detected` | TRAFFIC_JAM_DETECTED | Traffic Service | Parking, Notification |
| `traffic.status.updated` | TRAFFIC_STATUS_UPDATED | Traffic Service | (monitoring) |
| `parking.full` | PARKING_FULL | Parking Service | Notification |
| `parking.available` | PARKING_AVAILABLE | Parking Service | (monitoring) |
| `weather.dangerous` | WEATHER_DANGEROUS | Weather Service | Traffic, Incident, Notification |
| `weather.updated` | WEATHER_UPDATED | Weather Service | (monitoring) |
| `notification.created` | NOTIFICATION_CREATED | Notification Service | (monitoring) |

## Topic Descriptions

### incident.detected
Published when a new incident is created. Triggers:
- Traffic Service: marks the affected zone as BLOCKED
- Notification Service: creates an INCIDENT notification

### incident.resolved
Published when an incident status changes to RESOLVED. Triggers:
- Notification Service: creates an INCIDENT_RESOLVED notification

### traffic.jam.detected
Published when congestion_level >= 70. Triggers:
- Parking Service: logs available parkings in nearby zones
- Notification Service: creates a TRAFFIC notification

### traffic.status.updated
Published on every traffic record create/update. Used for monitoring.

### parking.full
Published when available_spots transitions to 0. Triggers:
- Notification Service: creates a PARKING notification

### parking.available
Published when parking opens up (was full, now has spots). Used for monitoring.

### weather.dangerous
Published when wind_speed > 80 OR rainfall > 50 OR condition in [STORM, FOG]. Triggers:
- Traffic Service: marks all roads in the city as DANGEROUS
- Incident Service: auto-creates a WEATHER_ALERT incident
- Notification Service: creates a WEATHER notification

### weather.updated
Published on every weather record create/update. Used for monitoring.

### notification.created
Published by Notification Service when a notification is persisted.

## Event Payload Schema

All events include a `timestamp` field added by the producer.

### incident.detected payload
```json
{
  "id": "uuid",
  "city": "string",
  "zone": "string",
  "type": "ACCIDENT | EMERGENCY | ROAD_BLOCKED | WEATHER_ALERT",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "description": "string",
  "timestamp": "ISO8601"
}
```

### traffic.jam.detected payload
```json
{
  "id": "uuid",
  "city": "string",
  "zone": "string",
  "congestion_level": "integer (0-100)",
  "timestamp": "ISO8601"
}
```

### parking.full payload
```json
{
  "id": "uuid",
  "name": "string",
  "city": "string",
  "zone": "string",
  "timestamp": "ISO8601"
}
```

### weather.dangerous payload
```json
{
  "id": "uuid",
  "city": "string",
  "condition": "CLEAR | CLOUDY | RAIN | STORM | FOG | SNOW",
  "wind_speed": "float",
  "rainfall": "float",
  "timestamp": "ISO8601"
}
```
