const { kafka, TOPICS } = require('../../../../kafka/kafkaClient');
const { db } = require('../db');

async function initConsumer() {
  const consumer = kafka.consumer({ groupId: 'traffic-service-group' });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.INCIDENT_DETECTED, TOPICS.WEATHER_DANGEROUS], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Traffic] Received event from ${topic}:`, data);

      if (topic === TOPICS.INCIDENT_DETECTED) {
        // Mark traffic as blocked near the incident zone
        const updated_at = new Date().toISOString();
        db.prepare(
          "UPDATE traffic SET status = 'BLOCKED', congestion_level = 100, updated_at = ? WHERE city = ? AND zone = ?"
        ).run(updated_at, data.city, data.zone);
        console.log(`[Traffic] Zone ${data.zone} in ${data.city} marked as BLOCKED due to incident`);
      }

      if (topic === TOPICS.WEATHER_DANGEROUS) {
        // Mark roads as dangerous
        const updated_at = new Date().toISOString();
        db.prepare(
          "UPDATE traffic SET road_condition = 'DANGEROUS', updated_at = ? WHERE city = ?"
        ).run(updated_at, data.city);
        console.log(`[Traffic] Roads in ${data.city} marked as DANGEROUS due to weather`);
      }
    },
  });

  console.log('Traffic Kafka consumer running');
}

module.exports = { initConsumer };
