const { kafka, TOPICS } = require('../../../../kafka/kafkaClient');
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { produceEvent } = require('./producer');

async function initConsumer() {
  const consumer = kafka.consumer({ groupId: 'incident-service-group' });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.WEATHER_DANGEROUS], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Incident] Received event from ${topic}:`, data);

      if (topic === TOPICS.WEATHER_DANGEROUS) {
        // Create a preventive weather alert incident
        const id = uuidv4();
        const now = new Date().toISOString();
        db.prepare(
          'INSERT INTO incidents (id, city, zone, type, severity, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          id, data.city, 'ALL', 'WEATHER_ALERT', 'HIGH',
          `Dangerous weather detected: ${data.condition}. Wind: ${data.wind_speed}km/h, Rain: ${data.rainfall}mm`,
          'ACTIVE', now, now
        );

        await produceEvent(TOPICS.INCIDENT_DETECTED, {
          id, city: data.city, zone: 'ALL', type: 'WEATHER_ALERT', severity: 'HIGH',
          description: `Auto-generated: Dangerous weather - ${data.condition}`,
        });

        console.log(`[Incident] Created weather alert for ${data.city}`);
      }
    },
  });

  console.log('Incident Kafka consumer running');
}

module.exports = { initConsumer };
