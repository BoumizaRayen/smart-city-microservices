const { kafka, TOPICS } = require('../../../../kafka/kafkaClient');
const { getCollection } = require('../db');
const { v4: uuidv4 } = require('uuid');

function buildNotification(topic, data) {
  const base = { id: uuidv4(), city: data.city || 'unknown', source_event: topic, created_at: new Date().toISOString() };

  switch (topic) {
    case TOPICS.INCIDENT_DETECTED:
      return { ...base, type: 'INCIDENT', title: `Incident: ${data.type || 'ACCIDENT'}`, message: `${data.severity || 'MEDIUM'} severity incident in zone ${data.zone}. ${data.description || ''}` };
    case TOPICS.INCIDENT_RESOLVED:
      return { ...base, type: 'INCIDENT_RESOLVED', title: `Incident Resolved`, message: `Incident in zone ${data.zone} has been resolved.` };
    case TOPICS.PARKING_FULL:
      return { ...base, type: 'PARKING', title: `Parking Full: ${data.name}`, message: `Parking ${data.name} in zone ${data.zone} is now full. Please use alternative parking.` };
    case TOPICS.TRAFFIC_JAM_DETECTED:
      return { ...base, type: 'TRAFFIC', title: `Traffic Jam Detected`, message: `Heavy congestion (${data.congestion_level}%) detected in zone ${data.zone}.` };
    case TOPICS.WEATHER_DANGEROUS:
      return { ...base, type: 'WEATHER', title: `Dangerous Weather Alert`, message: `Dangerous weather conditions in ${data.city}: ${data.condition}. Wind: ${data.wind_speed}km/h, Rain: ${data.rainfall}mm.` };
    default:
      return { ...base, type: 'INFO', title: 'Smart City Alert', message: JSON.stringify(data) };
  }
}

async function initConsumer() {
  const consumer = kafka.consumer({ groupId: 'notification-service-group' });
  await consumer.connect();
  await consumer.subscribe({
    topics: [
      TOPICS.INCIDENT_DETECTED,
      TOPICS.INCIDENT_RESOLVED,
      TOPICS.PARKING_FULL,
      TOPICS.TRAFFIC_JAM_DETECTED,
      TOPICS.WEATHER_DANGEROUS,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Notification] Received event from ${topic}`);

      try {
        const collection = getCollection();
        const notification = buildNotification(topic, data);
        await collection.insert(notification);
        console.log(`[Notification] Created: ${notification.title}`);
      } catch (err) {
        console.error('[Notification] Error creating notification:', err.message);
      }
    },
  });

  console.log('Notification Kafka consumer running');
}

module.exports = { initConsumer };
