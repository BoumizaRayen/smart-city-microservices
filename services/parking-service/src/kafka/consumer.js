const { kafka, TOPICS } = require('../../../../kafka/kafkaClient');
const { getCollection } = require('../db');

async function initConsumer() {
  const consumer = kafka.consumer({ groupId: 'parking-service-group' });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.TRAFFIC_JAM_DETECTED], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Parking] Received event from ${topic}:`, data);

      if (topic === TOPICS.TRAFFIC_JAM_DETECTED) {
        // Find available parkings in other zones
        try {
          const collection = getCollection();
          const parkings = await collection.find({
            selector: { city: data.city, is_full: false },
          }).exec();
          console.log(`[Parking] Traffic jam in zone ${data.zone}. Available parkings in ${data.city}: ${parkings.length}`);
        } catch (err) {
          console.error('[Parking] Error handling traffic jam event:', err.message);
        }
      }
    },
  });

  console.log('Parking Kafka consumer running');
}

module.exports = { initConsumer };
