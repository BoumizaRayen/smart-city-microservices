# Kafka Events Reference

## Broker Configuration
- **Host**: localhost:9092
- **Zookeeper**: localhost:2181
- **UI**: http://localhost:8080 (Kafka UI)

## Topics

### incident.detected
**Producer**: Incident Service
**Consumers**: Traffic Service, Notification Service

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "zone": "string",
  "type": "ACCIDENT | EMERGENCY | ROAD_BLOCKED | WEATHER_ALERT",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "description": "string",
  "timestamp": "2026-05-13T10:00:00.000Z"
}
```

Side effects:
- Traffic: zone status set to BLOCKED, congestion to 100
- Notification: INCIDENT notification created

---

### incident.resolved
**Producer**: Incident Service (on status -> RESOLVED update)
**Consumers**: Notification Service

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "zone": "string",
  "type": "string",
  "timestamp": "ISO8601"
}
```

Side effects:
- Notification: INCIDENT_RESOLVED notification created

---

### traffic.jam.detected
**Producer**: Traffic Service (when congestion_level >= 70)
**Consumers**: Parking Service, Notification Service

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "zone": "string",
  "congestion_level": 75,
  "timestamp": "ISO8601"
}
```

Side effects:
- Parking: logs available parkings in the city
- Notification: TRAFFIC notification created

---

### traffic.status.updated
**Producer**: Traffic Service (on every create/update)
**Consumers**: Monitoring only

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "zone": "string",
  "status": "FREE | MODERATE | CONGESTED | BLOCKED",
  "congestion_level": 45,
  "timestamp": "ISO8601"
}
```

---

### parking.full
**Producer**: Parking Service (when available_spots transitions to 0)
**Consumers**: Notification Service

Payload:
```json
{
  "id": "uuid-v4",
  "name": "string",
  "city": "string",
  "zone": "string",
  "timestamp": "ISO8601"
}
```

Side effects:
- Notification: PARKING notification created

---

### parking.available
**Producer**: Parking Service (on create, or when was_full -> available)
**Consumers**: Monitoring only

Payload:
```json
{
  "id": "uuid-v4",
  "name": "string",
  "city": "string",
  "zone": "string",
  "available_spots": 42,
  "timestamp": "ISO8601"
}
```

---

### weather.dangerous
**Producer**: Weather Service (when wind > 80 OR rain > 50 OR STORM/FOG)
**Consumers**: Traffic Service, Incident Service, Notification Service

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "condition": "STORM | FOG | ...",
  "wind_speed": 95.0,
  "rainfall": 60.0,
  "timestamp": "ISO8601"
}
```

Side effects:
- Traffic: all roads in city set to road_condition = DANGEROUS
- Incident: auto-creates WEATHER_ALERT incident -> republishes incident.detected
- Notification: WEATHER notification created

---

### weather.updated
**Producer**: Weather Service (on every create/update)
**Consumers**: Monitoring only

Payload:
```json
{
  "id": "uuid-v4",
  "city": "string",
  "condition": "string",
  "wind_speed": 15.0,
  "rainfall": 0.0,
  "timestamp": "ISO8601"
}
```

---

### notification.created
**Producer**: Notification Service
**Consumers**: Monitoring only

## Consumer Groups

| Service | Group ID |
|---|---|
| Traffic Service | traffic-service-group |
| Parking Service | parking-service-group |
| Incident Service | incident-service-group |
| Notification Service | notification-service-group |
